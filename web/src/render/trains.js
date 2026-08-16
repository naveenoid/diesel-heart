/* ── Rolling stock ────────────────────────────────────────────────────────────
   Drawn as solid objects rather than coloured rectangles.

   The camera sits a little above the railhead, so every vehicle shows a sliver
   of its roof receding away from you. That one cue does most of the work: the
   rest is volume shading (bright along the top edge, mid on the flank, dark
   into the solebar, a bounce of ground light underneath), ambient occlusion
   where the roof overhangs and where the body meets the frame, a horizon
   reflection band across the paint, weathering that climbs from the axleboxes,
   and the far-side wheels showing above the near ones.

   None of it is expensive. It is all gradients, and gradients are what make a
   flat shape look like it has a far side. */

import { PPM, trackPoint, roundRect } from './world.js';

const SCALE = PPM;

/* ── Light model ──────────────────────────────────────────────────────────────
   Sun high and slightly ahead. Multipliers against the base colour. */
const L = {
    roof:   1.30,   // top face, catching sky
    edge:   1.55,   // the lit rim along the cantrail
    upper:  1.10,
    mid:    0.92,
    lower:  0.60,
    solebar:0.40,
    under:  0.24,
    bounce: 0.72,   // light kicked back up off the ballast
};

/* Roof recession — how much of the top face we can see. */
const RDX = 3.5, RDY = 6.5;

function parse(hex) {
    const p = parseInt(hex.slice(1), 16);
    return [p >> 16 & 255, p >> 8 & 255, p & 255];
}
/** Base colour × light multiplier × scene ambient, clamped. */
function tone(hex, mul, amb) {
    const [r, g, b] = parse(hex);
    const k = mul * amb;
    return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
}
function rgba(hex, mul, amb, a) {
    const [r, g, b] = parse(hex);
    const k = mul * amb;
    return `rgba(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0},${a})`;
}

/**
 * A body panel with real volume: multi-stop vertical gradient, a lit cantrail
 * edge, occlusion under the roof, and a horizon reflection across the middle.
 */
function panelBody(ctx, x, y, w, h, base, amb, opts = {}) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0.00, tone(base, L.edge, amb));
    g.addColorStop(0.07, tone(base, L.upper, amb));
    g.addColorStop(0.42, tone(base, L.mid, amb));
    g.addColorStop(0.84, tone(base, L.lower, amb));
    g.addColorStop(1.00, tone(base, L.bounce, amb));
    ctx.fillStyle = g;
    if (opts.round) { roundRect(ctx, x, y, w, h, opts.round); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);

    // Occlusion in the shadow of the roof overhang.
    const ao = ctx.createLinearGradient(0, y, 0, y + Math.min(9, h * 0.3));
    ao.addColorStop(0, 'rgba(0,0,0,0.34)');
    ao.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ao;
    ctx.fillRect(x, y, w, Math.min(9, h * 0.3));

    // The horizon, lying across the paint. Subtle, but it is what says "glossy".
    if (opts.gloss !== false) {
        const hz = ctx.createLinearGradient(0, y + h * 0.44, 0, y + h * 0.62);
        hz.addColorStop(0, 'rgba(255,255,255,0)');
        hz.addColorStop(0.5, `rgba(255,255,255,${0.07 * amb})`);
        hz.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hz;
        ctx.fillRect(x, y + h * 0.44, w, h * 0.18);
    }
}

/** The visible top of a roof, receding up and away. */
function roofFace(ctx, x, y, w, base, amb, depth = 1, camber = 0) {
    const dx = RDX * depth, dy = RDY * depth;
    const g = ctx.createLinearGradient(0, y - dy, 0, y);
    g.addColorStop(0, tone(base, L.roof * 1.08, amb));
    g.addColorStop(1, tone(base, L.roof * 0.82, amb));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + dx, y - dy - camber);
    ctx.lineTo(x + dx, y - dy - camber);
    ctx.closePath();
    ctx.fill();
    // Bright cantrail line where roof meets side.
    ctx.strokeStyle = rgba(base, L.edge * 1.15, amb, 0.85);
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
}

/** Cylindrical shading — boilers, tanks, dewars. */
function cylinder(ctx, x, y, w, h, base, amb, r) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0.00, tone(base, 0.72, amb));
    g.addColorStop(0.16, tone(base, 1.24, amb));   // the specular band
    g.addColorStop(0.34, tone(base, 1.02, amb));
    g.addColorStop(0.70, tone(base, 0.70, amb));
    g.addColorStop(1.00, tone(base, 0.42, amb));
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r ?? h / 2);
    ctx.fill();
}

/** A row of rivets. At this scale they read as texture, which is the point. */
function rivetRow(ctx, x0, x1, y, step, amb) {
    ctx.fillStyle = `rgba(255,255,255,${0.13 * amb})`;
    for (let x = x0; x < x1; x += step) ctx.fillRect(x, y, 0.9, 0.9);
    ctx.fillStyle = `rgba(0,0,0,${0.16 * amb})`;
    for (let x = x0; x < x1; x += step) ctx.fillRect(x, y + 0.9, 0.9, 0.6);
}

/** A raised panel seam: dark groove with a lit lip beside it. */
function seam(ctx, x, y0, y1, amb) {
    ctx.strokeStyle = `rgba(0,0,0,${0.30 * amb})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.10 * amb})`;
    ctx.beginPath(); ctx.moveTo(x + 1, y0); ctx.lineTo(x + 1, y1); ctx.stroke();
}

/** Road dirt, thrown up from the ballast and never washed off. */
function grimeWash(ctx, x, y, w, h, amount, amb) {
    const g = ctx.createLinearGradient(0, y + h, 0, y + h * 0.32);
    g.addColorStop(0, `rgba(46,38,28,${0.55 * amount})`);
    g.addColorStop(0.5, `rgba(56,48,38,${0.22 * amount})`);
    g.addColorStop(1, 'rgba(60,52,42,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
}

/** Glass: dark inside, sky down the pane, and a diagonal streak of reflection. */
function glassPane(ctx, x, y, w, h, night, amb) {
    if (night) {
        // Lit from inside: brightest at the top where the lamp is.
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#ffe6a8');
        g.addColorStop(0.6, '#f4c876');
        g.addColorStop(1, '#d9a252');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
    } else {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, `rgba(${140 * amb | 0},${172 * amb | 0},${196 * amb | 0},1)`);
        g.addColorStop(0.55, `rgba(${58 * amb | 0},${76 * amb | 0},${92 * amb | 0},1)`);
        g.addColorStop(1, `rgba(${36 * amb | 0},${48 * amb | 0},${58 * amb | 0},1)`);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        // Reflection streak
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.fillStyle = `rgba(255,255,255,${0.20 * amb})`;
        ctx.beginPath();
        ctx.moveTo(x - 2, y + h);
        ctx.lineTo(x + w * 0.5, y - 2);
        ctx.lineTo(x + w * 0.78, y - 2);
        ctx.lineTo(x + w * 0.28, y + h);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    // Rubber and frame
    ctx.strokeStyle = `rgba(0,0,0,${0.55 * amb})`;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x - 0.4, y - 0.4, w + 0.8, h + 0.8);
}

/** Handrails and grab irons: a light line with its own shadow just below. */
function handrail(ctx, pts, amb) {
    ctx.strokeStyle = `rgba(0,0,0,${0.42 * amb})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1));
    ctx.stroke();
    ctx.strokeStyle = `rgba(232,226,212,${0.72 * amb})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
}

/* ── Running gear ─────────────────────────────────────────────────────────────
   One convention, everywhere: local y = 0 is the top of the near railhead, and
   everything is built upward from it in negative y. Wheels touch the rail
   because their centres sit exactly one radius above it, the solebar sits above
   the axleboxes, and every body sits on the solebar. Get this wrong and the
   train floats, or sinks into the ballast, and no amount of shading saves it. */

const R_LOCO = 5.6, R_CAR = 4.9;
const DECK_LOCO = -19, DECK_CAR = -17;     // underside of the body
const GDX = 3, GDY = 8;                    // must match the track's far rail

function wheel(ctx, x, y, r, phase, amb, spokes = 0, far = false) {
    const k = far ? 0.42 : 1;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
    g.addColorStop(0, `rgba(${92 * amb * k | 0},${96 * amb * k | 0},${102 * amb * k | 0},1)`);
    g.addColorStop(0.7, `rgba(${44 * amb * k | 0},${46 * amb * k | 0},${50 * amb * k | 0},1)`);
    g.addColorStop(1, `rgba(${18 * amb * k | 0},${19 * amb * k | 0},${21 * amb * k | 0},1)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();

    if (far) return;    // the far wheel is a hint of depth, not a second drawing

    ctx.strokeStyle = `rgba(${190 * amb | 0},${196 * amb | 0},${204 * amb | 0},0.7)`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(x, y, r - 0.7, 0, 6.283); ctx.stroke();

    if (spokes) {
        ctx.strokeStyle = `rgba(${64 * amb | 0},${66 * amb | 0},${70 * amb | 0},1)`;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        for (let i = 0; i < spokes; i++) {
            const a = phase + (i / spokes) * 6.283;
            ctx.moveTo(x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18);
            ctx.lineTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(${112 * amb | 0},${116 * amb | 0},${122 * amb | 0},1)`;
        ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, 6.283); ctx.fill();
    } else {
        ctx.fillStyle = `rgba(${104 * amb | 0},${108 * amb | 0},${114 * amb | 0},1)`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(phase) * r * 0.46, y + Math.sin(phase) * r * 0.46, r * 0.17, 0, 6.283);
        ctx.fill();
    }
}

/** A two-axle truck sitting on the rail, with the far wheels showing behind. */
function bogie(ctx, cx, phase, amb, span = 18, r = R_CAR) {
    const ay = -r;
    wheel(ctx, cx - span / 2 + GDX, ay - GDY, r * 0.8, phase, amb, 0, true);
    wheel(ctx, cx + span / 2 + GDX, ay - GDY, r * 0.8, phase, amb, 0, true);

    const fy = ay - r - 5;
    const g = ctx.createLinearGradient(0, fy, 0, fy + 8);
    g.addColorStop(0, `rgba(${64 * amb | 0},${66 * amb | 0},${70 * amb | 0},1)`);
    g.addColorStop(1, `rgba(${22 * amb | 0},${23 * amb | 0},${25 * amb | 0},1)`);
    ctx.fillStyle = g;
    roundRect(ctx, cx - span / 2 - 4, fy, span + 8, 8, 1.5); ctx.fill();

    ctx.strokeStyle = `rgba(${128 * amb | 0},${130 * amb | 0},${134 * amb | 0},0.75)`;
    ctx.lineWidth = 1;
    for (const dx of [-span / 2, span / 2]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 4, fy + 1.5);
        ctx.quadraticCurveTo(cx + dx, fy - 1.2, cx + dx + 4, fy + 1.5);
        ctx.stroke();
    }

    wheel(ctx, cx - span / 2, ay, r, phase, amb);
    wheel(ctx, cx + span / 2, ay, r, phase, amb);
}

/** A soft shadow thrown across the ballast, just below the railhead. */
function castShadow(ctx, halfLen, amb) {
    const g = ctx.createLinearGradient(0, -1, 0, 10);
    g.addColorStop(0, `rgba(0,0,0,${0.40 * amb + 0.16})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.98, 0);
    ctx.lineTo(halfLen * 0.98, 0);
    ctx.lineTo(halfLen * 0.9 - 6, 10);
    ctx.lineTo(-halfLen * 0.9 - 6, 10);
    ctx.closePath(); ctx.fill();
}

/** Solebar and headstocks — the deck the body sits on, plus the far solebar. */
function underframe(ctx, x, w, amb, base, deck) {
    ctx.fillStyle = tone(base, L.under * 1.7, amb);
    ctx.fillRect(x + GDX, deck - GDY + 2.5, w, 4.5);
    const g = ctx.createLinearGradient(0, deck, 0, deck + 7);
    g.addColorStop(0, tone(base, L.solebar, amb));
    g.addColorStop(1, tone(base, L.under, amb));
    ctx.fillStyle = g;
    ctx.fillRect(x, deck, w, 7);
    ctx.fillStyle = `rgba(0,0,0,${0.5 * amb})`;
    ctx.fillRect(x, deck + 7, w, 2.5);
}

function coupler(ctx, x, amb, dir = 1) {
    const y = -11;
    ctx.fillStyle = `rgba(${46 * amb | 0},${44 * amb | 0},${42 * amb | 0},1)`;
    ctx.fillRect(x - (dir > 0 ? 0 : 4), y, 4, 3.4);
    ctx.fillStyle = `rgba(${70 * amb | 0},${66 * amb | 0},${62 * amb | 0},1)`;
    ctx.fillRect(x + (dir > 0 ? 1 : -3), y + 0.5, 2.2, 2.2);
    ctx.strokeStyle = `rgba(${28 * amb | 0},${28 * amb | 0},${30 * amb | 0},1)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + dir * 1, y + 2);
    ctx.quadraticCurveTo(x + dir * 3, y + 6, x + dir * 1.5, y + 8.5);
    ctx.stroke();
}

/* ── Locomotives ─────────────────────────────────────────────────────────────
   Each is built from the deck upward, so they all stand on the rail correctly
   and differ only where they actually differ. */

function drawVelaikkaran(ctx, Lp, o) {
    const amb = o.amb, lv = o.livery, D = DECK_LOCO;
    castShadow(ctx, Lp / 2, amb);

    // Fuel tank slung between the bogies
    ctx.fillStyle = tone('#2b2f34', 0.85, amb);
    roundRect(ctx, -Lp * 0.20, D + 6, Lp * 0.40, 7, 2); ctx.fill();
    underframe(ctx, -Lp / 2, Lp, amb, lv.frame, D);

    /* Long hood — the bulk of him. */
    const hoodH = 30, hoodY = D - hoodH;
    const hoodX = -Lp / 2 + 3, hoodW = Lp * 0.60;
    roofFace(ctx, hoodX, hoodY, hoodW, lv.roof, amb, 1);
    panelBody(ctx, hoodX, hoodY, hoodW, hoodH, lv.body, amb, { round: 1.5 });
    for (let i = 1; i < 6; i++) seam(ctx, hoodX + (hoodW / 6) * i, hoodY + 2, D - 2, amb);
    rivetRow(ctx, hoodX + 2, hoodX + hoodW - 2, hoodY + 3, 4.5, amb);

    // Radiator grille at the far end, recessed and sooty
    ctx.fillStyle = `rgba(0,0,0,${0.5 * amb})`;
    ctx.fillRect(hoodX + 1, hoodY + 4, 11, hoodH - 10);
    ctx.strokeStyle = tone(lv.body, 0.9, amb);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(hoodX + 1.5, hoodY + 5.5 + i * 3.2);
        ctx.lineTo(hoodX + 11.5, hoodY + 5.5 + i * 3.2);
        ctx.stroke();
    }

    /* Cab, standing proud of the hood. */
    const cabX = Lp * 0.12, cabW = Lp * 0.25, cabH = 38, cabY = D - cabH;
    roofFace(ctx, cabX, cabY, cabW, lv.roof, amb, 1.15, 1.5);
    panelBody(ctx, cabX, cabY, cabW, cabH, lv.body, amb, { round: 1.5 });
    glassPane(ctx, cabX + 3.5, cabY + 5, cabW * 0.38, 12, o.night, amb);
    glassPane(ctx, cabX + cabW * 0.54, cabY + 5, cabW * 0.32, 12, o.night, amb);
    if (o.night) {
        const g = ctx.createRadialGradient(cabX + cabW / 2, cabY + 11, 3, cabX + cabW / 2, cabY + 11, 36);
        g.addColorStop(0, 'rgba(255,206,130,0.30)');
        g.addColorStop(1, 'rgba(255,206,130,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cabX - 34, cabY - 22, cabW + 68, 76);
    }

    /* Short nose, lower than the cab — the WDM-2 profile. */
    const noseH = 22, noseY = D - noseH;
    const noseX = cabX + cabW, noseW = Lp * 0.12;
    roofFace(ctx, noseX, noseY, noseW, lv.roof, amb, 0.9);
    panelBody(ctx, noseX, noseY, noseW, noseH, lv.body, amb, { round: 2 });

    /* The gold band — the one bit of pride on the whole machine. */
    ctx.fillStyle = tone(lv.stripe, 1.2, amb);
    ctx.fillRect(hoodX, D - 11, hoodW, 3);
    ctx.fillRect(cabX, D - 11, cabW + noseW, 3);
    ctx.fillStyle = `rgba(0,0,0,${0.3 * amb})`;
    ctx.fillRect(hoodX, D - 8, hoodW, 1);
    ctx.fillRect(cabX, D - 8, cabW + noseW, 1);

    /* Stack, horn, and the soot that lives around them. */
    ctx.fillStyle = tone('#23262a', 1, amb);
    ctx.fillRect(-Lp * 0.12, hoodY - 5, 6.5, 6);
    ctx.fillStyle = `rgba(18,16,14,${0.35 * amb})`;
    ctx.beginPath(); ctx.ellipse(-Lp * 0.10, hoodY + 2, 14, 5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = tone('#3a3f45', 1, amb);
    ctx.fillRect(cabX - 8, cabY - 4, 4.5, 3);

    /* Headlight and number board on the nose. */
    const nx = noseX + noseW - 3;
    if (o.headlight) {
        const g = ctx.createRadialGradient(nx, noseY + 8, 1, nx, noseY + 8, 24);
        g.addColorStop(0, 'rgba(255,248,214,0.9)');
        g.addColorStop(1, 'rgba(255,246,207,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nx, noseY + 8, 24, 0, 6.283); ctx.fill();
    }
    ctx.fillStyle = o.headlight ? '#fffbe2' : tone('#8e8e8e', 1, amb);
    ctx.beginPath(); ctx.arc(nx, noseY + 8, 3.2, 0, 6.283); ctx.fill();
    ctx.strokeStyle = `rgba(0,0,0,${0.5 * amb})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(nx, noseY + 8, 3.2, 0, 6.283); ctx.stroke();

    ctx.fillStyle = `rgba(${14 * amb | 0},${15 * amb | 0},${17 * amb | 0},1)`;
    roundRect(ctx, noseX + 1, noseY + 13, 13, 7, 1); ctx.fill();
    ctx.fillStyle = o.night ? '#ffe9a8' : tone('#ded4bd', 1, amb);
    ctx.font = 'bold 5.5px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('17', noseX + 7.5, noseY + 18.5);
    ctx.textAlign = 'left';

    handrail(ctx, [[noseX + noseW - 1.5, noseY + 3], [noseX + noseW - 1.5, D - 2]], amb);
    handrail(ctx, [[cabX + 1.5, cabY + 3], [cabX + 1.5, D - 2]], amb);
    ctx.fillStyle = tone('#2a2d31', 1, amb);
    ctx.fillRect(cabX - 6, D + 2, 6, 1.6);
    ctx.fillRect(cabX - 6, D + 6, 6, 1.6);

    grimeWash(ctx, -Lp / 2, hoodY, Lp, hoodH + 12, 0.85, amb);

    /* Co-Co: three axles a bogie, and it shows. */
    for (const bx of [-Lp * 0.26, Lp * 0.24]) {
        for (let i = -1; i <= 1; i++)
            wheel(ctx, bx + i * 9.6 + GDX, -R_LOCO - GDY, R_LOCO * 0.8, o.phase, amb, 0, true);
        ctx.fillStyle = tone('#232629', 1, amb);
        roundRect(ctx, bx - 16, -R_LOCO - 10, 32, 9, 1.5); ctx.fill();
        for (let i = -1; i <= 1; i++) wheel(ctx, bx + i * 9.6, -R_LOCO, R_LOCO, o.phase, amb);
    }
    coupler(ctx, Lp / 2 - 3, amb, 1);
    coupler(ctx, -Lp / 2 + 3, amb, -1);
}

function drawFox(ctx, Lp, o) {
    const amb = o.amb, lv = o.livery, D = DECK_LOCO;
    castShadow(ctx, Lp / 2, amb);
    underframe(ctx, -Lp / 2, Lp, amb, lv.frame, D);

    // Road switcher: hood, cab, hood, walkways all round
    const hH = 25, hY = D - hH;
    for (const [hx, hw] of [[-Lp / 2 + 4, Lp * 0.29], [Lp * 0.15, Lp * 0.31]]) {
        roofFace(ctx, hx, hY, hw, lv.roof, amb, 0.95);
        panelBody(ctx, hx, hY, hw, hH, lv.body, amb, { round: 1.5 });
        for (let i = 1; i < 4; i++) seam(ctx, hx + (hw / 4) * i, hY + 2, D - 2, amb);
    }

    const cabH = 34, cabY = D - cabH, cabX = -Lp * 0.15, cabW = Lp * 0.29;
    roofFace(ctx, cabX, cabY, cabW, lv.roof, amb, 1.1, 1.2);
    panelBody(ctx, cabX, cabY, cabW, cabH, lv.body, amb, { round: 1.5 });
    glassPane(ctx, cabX + 3, cabY + 4, cabW * 0.36, 11, o.night, amb);
    glassPane(ctx, cabX + cabW * 0.52, cabY + 4, cabW * 0.34, 11, o.night, amb);

    ctx.fillStyle = tone(lv.stripe, 1.15, amb);
    ctx.fillRect(-Lp / 2 + 4, D - 7, Lp - 8, 2.2);

    ctx.fillStyle = tone('#23262a', 1, amb);
    ctx.fillRect(Lp * 0.26, hY - 5, 6, 6);
    // She has smoked like this since 1953 and nobody has ever fixed it.
    ctx.fillStyle = `rgba(16,14,12,${0.45 * amb})`;
    ctx.beginPath(); ctx.ellipse(Lp * 0.29, hY + 2, 16, 6, 0, 0, 6.283); ctx.fill();

    ctx.fillStyle = o.headlight ? '#fffbe2' : tone('#8e8e8e', 1, amb);
    ctx.beginPath(); ctx.arc(Lp / 2 - 5, hY + 7, 3, 0, 6.283); ctx.fill();

    handrail(ctx, [[-Lp / 2 + 5, hY + 3], [-Lp / 2 + 5, D - 2]], amb);
    handrail(ctx, [[Lp / 2 - 5, hY + 3], [Lp / 2 - 5, D - 2]], amb);
    grimeWash(ctx, -Lp / 2, hY, Lp, hH + 14, 1.0, amb);

    bogie(ctx, -Lp * 0.28, o.phase, amb, 17, R_LOCO);
    bogie(ctx, Lp * 0.28, o.phase, amb, 17, R_LOCO);
    coupler(ctx, Lp / 2 - 3, amb, 1);
    coupler(ctx, -Lp / 2 + 3, amb, -1);
}

function drawGundu(ctx, Lp, o) {
    const amb = o.amb, lv = o.livery, D = DECK_LOCO;
    castShadow(ctx, Lp / 2, amb);
    underframe(ctx, -Lp / 2, Lp, amb, lv.frame, D);

    // Squat hood forward, big cab at the back — short, wide, pleased with himself
    const hH = 21, hY = D - hH;
    const hx = -Lp * 0.10, hw = Lp * 0.54;
    roofFace(ctx, hx, hY, hw, lv.roof, amb, 0.9);
    panelBody(ctx, hx, hY, hw, hH, lv.body, amb, { round: 2 });

    const cabH = 34, cabY = D - cabH, cabX = -Lp / 2 + 4, cabW = Lp * 0.35;
    roofFace(ctx, cabX, cabY, cabW, lv.roof, amb, 1.2, 2);
    panelBody(ctx, cabX, cabY, cabW, cabH, lv.body, amb, { round: 2 });
    glassPane(ctx, cabX + 4, cabY + 5, cabW * 0.34, 12, o.night, amb);
    glassPane(ctx, cabX + cabW * 0.52, cabY + 5, cabW * 0.34, 12, o.night, amb);

    ctx.fillStyle = tone(lv.stripe, 1.2, amb);
    ctx.fillRect(-Lp / 2 + 4, D - 6, Lp - 8, 2.4);

    ctx.fillStyle = tone('#23262a', 1, amb);
    ctx.fillRect(Lp * 0.10, hY - 5, 6, 6);
    ctx.fillStyle = o.headlight ? '#fffbe2' : tone('#8e8e8e', 1, amb);
    ctx.beginPath(); ctx.arc(Lp / 2 - 5, hY + 7, 3, 0, 6.283); ctx.fill();

    handrail(ctx, [[Lp / 2 - 5, hY + 3], [Lp / 2 - 5, D - 2]], amb);
    grimeWash(ctx, -Lp / 2, hY, Lp, hH + 16, 0.65, amb);

    bogie(ctx, -Lp * 0.25, o.phase, amb, 15, R_LOCO);
    bogie(ctx, Lp * 0.25, o.phase, amb, 15, R_LOCO);
    coupler(ctx, Lp / 2 - 3, amb, 1);
    coupler(ctx, -Lp / 2 + 3, amb, -1);
}

function drawMissus(ctx, Lp, o) {
    const amb = o.amb, lv = o.livery;
    const WR = 10.5;                 // driving wheel radius
    const wy = -WR;                  // centre of the drivers
    const PLATE = -20;               // running plate
    castShadow(ctx, Lp / 2, amb);

    /* Frames and running plate. */
    ctx.fillStyle = `rgba(0,0,0,${0.5 * amb})`;
    ctx.fillRect(-Lp / 2 + 4, PLATE + 3, Lp - 8, 4);
    ctx.fillStyle = tone('#1c1f22', 1, amb);
    ctx.fillRect(-Lp / 2, PLATE, Lp, 3.5);

    /* Boiler — the cylinder that gives her all her roundness. */
    const bH = 19, bY = PLATE - 20, bX = -Lp * 0.16, bW = Lp * 0.60;
    cylinder(ctx, bX, bY, bW, bH, lv.body, amb, 5);
    for (const f of [0.18, 0.44, 0.72]) {
        const x = bX + bW * f;
        ctx.strokeStyle = `rgba(0,0,0,${0.42 * amb})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(x, bY + 1); ctx.lineTo(x, bY + bH - 1); ctx.stroke();
        ctx.strokeStyle = tone('#c8a44a', 1.15, amb);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 1.2, bY + 1); ctx.lineTo(x + 1.2, bY + bH - 1); ctx.stroke();
    }

    /* Smokebox — always blacker than the boiler, and dulled by heat. */
    const sbX = bX + bW - 3, sbW = Lp * 0.15;
    cylinder(ctx, sbX, bY - 1.5, sbW, bH + 3, '#191c1e', amb, 5);
    ctx.strokeStyle = tone('#7a8086', 1.1, amb);
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(sbX + sbW - 2, bY + bH / 2, 3.4, 0, 6.283); ctx.stroke();

    /* Side tanks on the running plate. */
    const tH = 15, tY = PLATE - tH, tX = -Lp * 0.13, tW = Lp * 0.47;
    roofFace(ctx, tX, tY, tW, lv.roof, amb, 0.85);
    panelBody(ctx, tX, tY, tW, tH, lv.body, amb, { round: 1.5 });
    rivetRow(ctx, tX + 2, tX + tW - 2, tY + 2, 4, amb);
    ctx.strokeStyle = tone(lv.stripe, 1.25, amb);
    ctx.lineWidth = 0.9;
    ctx.strokeRect(tX + 3, tY + 3.5, tW - 6, tH - 7);

    /* Chimney, dome, safety valves. */
    const chX = sbX + sbW * 0.3;
    ctx.fillStyle = tone('#17191b', 1, amb);
    ctx.fillRect(chX, bY - 13, 7, 13);
    roundRect(ctx, chX - 2, bY - 16.5, 11, 4.5, 1.5); ctx.fill();
    ctx.fillStyle = tone('#3a4a43', 1.25, amb);
    ctx.beginPath(); ctx.ellipse(bX + bW * 0.34, bY, 6.5, 7, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = tone('#b08c3a', 1.3, amb);
    ctx.fillRect(bX + bW * 0.62, bY - 6, 4, 6);

    /* Cab. */
    const cH = 33, cY = PLATE - cH, cX = -Lp / 2 + 2, cW = Lp * 0.29;
    roofFace(ctx, cX - 2, cY, cW + 4, lv.roof, amb, 1.25, 2.5);
    panelBody(ctx, cX, cY, cW, cH, lv.body, amb, { round: 1.5 });
    ctx.fillStyle = `rgba(${18 * amb | 0},${16 * amb | 0},${14 * amb | 0},1)`;
    ctx.fillRect(cX + 3, cY + 5, cW * 0.44, 13);
    glassPane(ctx, cX + cW * 0.56, cY + 5, cW * 0.34, 11, o.night, amb);
    if (o.fire) {
        const g = ctx.createRadialGradient(cX + cW * 0.3, PLATE - 4, 1, cX + cW * 0.3, PLATE - 4, 28);
        g.addColorStop(0, `rgba(255,146,48,${o.night ? 0.72 : 0.34})`);
        g.addColorStop(1, 'rgba(255,146,48,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cX + cW * 0.3, PLATE - 4, 28, 0, 6.283); ctx.fill();
    }

    /* Buffer beam and buffers. */
    ctx.fillStyle = tone('#8f2f28', 1.2, amb);
    ctx.fillRect(Lp / 2 - 4.5, PLATE - 1, 4.5, 11);
    ctx.fillStyle = tone('#6a7076', 1.25, amb);
    ctx.fillRect(Lp / 2 - 7.5, PLATE + 1, 3, 3);
    ctx.fillRect(Lp / 2 - 7.5, PLATE + 6, 3, 3);

    ctx.fillStyle = o.headlight ? '#fff4cc' : tone('#c0ad82', 1, amb);
    ctx.beginPath(); ctx.arc(Lp * 0.45, PLATE - 3, 3, 0, 6.283); ctx.fill();

    grimeWash(ctx, -Lp / 2, bY, Lp, 40, 0.5, amb);

    /* Three coupled drivers, spoked, with the rods that make them a team. */
    const dx = [-Lp * 0.20, 0, Lp * 0.20];
    for (const x of dx) wheel(ctx, x + GDX, wy - GDY, WR * 0.82, o.phase, amb, 0, true);
    for (const x of dx) wheel(ctx, x, wy, WR, o.phase, amb, 10);

    const cr = WR * 0.55;
    const px = Math.cos(o.phase) * cr, py = Math.sin(o.phase) * cr;
    ctx.strokeStyle = `rgba(${28 * amb | 0},${28 * amb | 0},${30 * amb | 0},1)`;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(dx[0] + px, wy + py + 1); ctx.lineTo(dx[2] + px, wy + py + 1);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${200 * amb | 0},${206 * amb | 0},${212 * amb | 0},1)`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(dx[0] + px, wy + py); ctx.lineTo(dx[2] + px, wy + py);
    ctx.stroke();

    // Connecting rod back from the crosshead, and the cylinder it comes from
    const chXX = Lp * 0.32, chY = wy - 6;
    ctx.strokeStyle = `rgba(${180 * amb | 0},${186 * amb | 0},${194 * amb | 0},1)`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(dx[2] + px, wy + py); ctx.lineTo(chXX, chY);
    ctx.stroke();
    cylinder(ctx, chXX - 2, chY - 7, Lp * 0.14, 14, '#33383c', amb, 3);
    ctx.fillStyle = tone('#4a5055', 1.25, amb);
    ctx.fillRect(chXX + Lp * 0.11, chY - 6, 2.5, 12);

    ctx.fillStyle = tone('#8a9096', 1.25, amb);
    for (const x of dx) { ctx.beginPath(); ctx.arc(x + px, wy + py, 2.2, 0, 6.283); ctx.fill(); }
}

/* ── Cars ────────────────────────────────────────────────────────────────── */

function drawCar(ctx, kind, Lp, o) {
    const amb = o.amb;
    const D = DECK_CAR;                 // underside of the body
    castShadow(ctx, Lp / 2, amb);

    const trucks = (span = 18) => {
        bogie(ctx, -Lp * 0.30, o.phase, amb, span, R_CAR);
        bogie(ctx, Lp * 0.30, o.phase, amb, span, R_CAR);
        coupler(ctx, Lp / 2 - 2, amb, 1);
        coupler(ctx, -Lp / 2 + 2, amb, -1);
    };

    /** A closed van body of height h, standing on the deck. */
    const van = (base, roofCol, h, opts = {}) => {
        underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
        const y = D - h;
        roofFace(ctx, -Lp / 2 + 1, y, Lp - 2, roofCol, amb, 1, opts.camber ?? 0);
        panelBody(ctx, -Lp / 2 + 1, y, Lp - 2, h, base, amb, { round: 1.2, gloss: opts.gloss });
        const n = opts.seams ?? 5;
        for (let i = 1; i < n; i++) seam(ctx, -Lp / 2 + 1 + ((Lp - 2) / n) * i, y + 2, D - 2, amb);
        rivetRow(ctx, -Lp / 2 + 4, Lp / 2 - 4, y + 2.5, 4.5, amb);
        return y;
    };

    switch (kind) {
        case 'boxcar': {
            const y = van('#8b5a34', '#5d4a3c', 27);
            // Sliding door, set into the side
            ctx.fillStyle = `rgba(0,0,0,${0.3 * amb})`;
            ctx.fillRect(-Lp * 0.10, y + 1, Lp * 0.21, 25);
            panelBody(ctx, -Lp * 0.10 + 1, y + 2, Lp * 0.21 - 2, 23, '#7a4d2c', amb, { gloss: false });
            ctx.fillStyle = tone('#c8b89a', 1, amb);
            ctx.font = '5px ui-monospace, monospace';
            ctx.fillText('SVRY', -Lp / 2 + 6, D - 5);
            grimeWash(ctx, -Lp / 2, y, Lp, 27, 1, amb);
            trucks(); break;
        }
        case 'reefer': {
            const y = van('#d8d2c4', '#b9b3a5', 27);
            ctx.fillStyle = tone('#3f5f74', 1, amb);
            ctx.fillRect(-Lp / 2 + 4, y + 3, 9, 11);         // ice hatch
            ctx.fillStyle = `rgba(0,0,0,${0.28 * amb})`;
            ctx.fillRect(-Lp * 0.07, y + 2, Lp * 0.15, 23);
            grimeWash(ctx, -Lp / 2, y, Lp, 27, 0.6, amb);
            trucks(); break;
        }
        case 'hopper': {
            underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
            // Sloped sides — a trapezoid gets its volume from the same gradient
            const hTop = D - 26;
            const g = ctx.createLinearGradient(0, hTop, 0, D);
            g.addColorStop(0, tone('#4f4034', L.edge, amb));
            g.addColorStop(0.4, tone('#4f4034', L.mid, amb));
            g.addColorStop(1, tone('#4f4034', L.lower, amb));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-Lp / 2 + 1, hTop); ctx.lineTo(Lp / 2 - 1, hTop);
            ctx.lineTo(Lp / 2 - 6, D); ctx.lineTo(-Lp / 2 + 6, D);
            ctx.closePath(); ctx.fill();
            // Coping along the top, seen from slightly above
            ctx.fillStyle = tone('#6a5747', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2 + 1, hTop); ctx.lineTo(Lp / 2 - 1, hTop);
            ctx.lineTo(Lp / 2 - 1 + RDX, hTop - RDY * 0.6); ctx.lineTo(-Lp / 2 + 1 + RDX, hTop - RDY * 0.6);
            ctx.closePath(); ctx.fill();
            // Load: aggregate heaped just proud of the coping
            ctx.fillStyle = tone('#6d6154', 1.05, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2 + 3 + RDX, hTop - RDY * 0.6);
            for (let i = 0; i <= 8; i++) {
                const f = i / 8;
                ctx.lineTo(-Lp / 2 + 3 + RDX + f * (Lp - 6), hTop - RDY * 0.6 - 1.5 - Math.sin(f * 3.1) * 2.4);
            }
            ctx.lineTo(Lp / 2 - 3 + RDX, hTop - RDY * 0.6);
            ctx.closePath(); ctx.fill();
            for (let i = 1; i < 5; i++) seam(ctx, -Lp / 2 + (Lp / 5) * i, hTop + 1, D - 2, amb);
            grimeWash(ctx, -Lp / 2, hTop, Lp, 26, 1.2, amb);
            trucks(); break;
        }
        case 'gondola': {
            underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
            const gTop = D - 19;
            panelBody(ctx, -Lp / 2 + 1, gTop, Lp - 2, 19, '#57493c', amb, { gloss: false });
            ctx.fillStyle = tone('#6d5c4b', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2 + 1, gTop); ctx.lineTo(Lp / 2 - 1, gTop);
            ctx.lineTo(Lp / 2 - 1 + RDX, gTop - RDY * 0.7); ctx.lineTo(-Lp / 2 + 1 + RDX, gTop - RDY * 0.7);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = tone('#7d7169', 1, amb);
            for (let i = 0; i < 7; i++) {
                const x = -Lp / 2 + 5 + i * (Lp - 10) / 7;
                ctx.fillRect(x, gTop - 3 - (i % 3) * 2.5, 4, 5);
            }
            for (let i = 1; i < 5; i++) seam(ctx, -Lp / 2 + (Lp / 5) * i, gTop + 1, D - 2, amb);
            grimeWash(ctx, -Lp / 2, gTop, Lp, 20, 1.2, amb);
            trucks(); break;
        }
        case 'tank': {
            underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
            const kTop = D - 22;
            cylinder(ctx, -Lp / 2 + 2, kTop, Lp - 4, 22, '#5a6066', amb, 10);
            // End dome, catching the light off-centre
            ctx.fillStyle = tone('#6d747a', 1.15, amb);
            ctx.beginPath(); ctx.ellipse(Lp / 2 - 3, kTop + 11, 2.6, 10, 0, 0, 6.283); ctx.fill();
            // Manway and walkway
            ctx.fillStyle = tone('#3d4348', 1, amb);
            ctx.fillRect(-3, kTop - 4, 7, 5);
            ctx.fillStyle = tone('#8d959b', 1.15, amb);
            ctx.fillRect(-Lp / 2 + 4, kTop - 2, Lp - 8, 1.6);
            for (const x of [-Lp * 0.24, Lp * 0.24]) {
                ctx.strokeStyle = `rgba(0,0,0,${0.35 * amb})`;
                ctx.lineWidth = 1.8;
                ctx.beginPath(); ctx.moveTo(x, kTop); ctx.lineTo(x, D); ctx.stroke();
            }
            handrail(ctx, [[-Lp / 2 + 4, kTop - 5], [Lp / 2 - 4, kTop - 5]], amb);
            grimeWash(ctx, -Lp / 2, kTop, Lp, 24, 0.9, amb);
            trucks(); break;
        }
        case 'flat': {
            underframe(ctx, -Lp / 2, Lp, amb, '#3a4238', D);
            ctx.fillStyle = tone('#4a4238', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2, D); ctx.lineTo(Lp / 2, D);
            ctx.lineTo(Lp / 2 + RDX, D - RDY); ctx.lineTo(-Lp / 2 + RDX, D - RDY);
            ctx.closePath(); ctx.fill();
            // Timber, stacked and strapped
            const lTop = D - 12;
            panelBody(ctx, -Lp * 0.36, lTop, Lp * 0.72, 12, '#a5834f', amb, { gloss: false });
            ctx.fillStyle = tone('#c39d63', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp * 0.36, lTop); ctx.lineTo(Lp * 0.36, lTop);
            ctx.lineTo(Lp * 0.36 + RDX, lTop - RDY); ctx.lineTo(-Lp * 0.36 + RDX, lTop - RDY);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = `rgba(0,0,0,${0.4 * amb})`;
            ctx.lineWidth = 1.1;
            for (const x of [-Lp * 0.2, Lp * 0.2]) {
                ctx.beginPath(); ctx.moveTo(x, lTop - 1); ctx.lineTo(x, D + 1); ctx.stroke();
            }
            trucks(); break;
        }
        case 'cryo':
        case 'isotope': {
            underframe(ctx, -Lp / 2, Lp, amb, '#2e353b', D);
            ctx.fillStyle = tone('#3a4148', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2, D); ctx.lineTo(Lp / 2, D);
            ctx.lineTo(Lp / 2 + RDX, D - RDY); ctx.lineTo(-Lp / 2 + RDX, D - RDY);
            ctx.closePath(); ctx.fill();
            const n = kind === 'cryo' ? 2 : 1;
            const dTop = D - 21;
            for (let i = 0; i < n; i++) {
                const cx = n === 1 ? 0 : (i ? Lp * 0.19 : -Lp * 0.19);
                cylinder(ctx, cx - Lp * 0.14, dTop, Lp * 0.28, 21, '#c6cdd3', amb, 9);
                ctx.fillStyle = tone('#8e979f', 1, amb);
                ctx.fillRect(cx - Lp * 0.14, dTop + 9, Lp * 0.28, 3);
                ctx.fillStyle = tone('#2e353b', 1, amb);
                ctx.fillRect(cx - 1.8, dTop - 4, 3.6, 5);
                ctx.strokeStyle = `rgba(0,0,0,${0.42 * amb})`;
                ctx.lineWidth = 1.6;
                for (const d of [-Lp * 0.07, Lp * 0.07]) {
                    ctx.beginPath(); ctx.moveTo(cx + d, dTop); ctx.lineTo(cx + d, D); ctx.stroke();
                }
            }
            // The shock logger, blinking away
            ctx.fillStyle = o.shockAlarm ? '#ff4a2e'
                : (Math.floor(performance.now() / 900) % 2 ? tone('#4ad07a', 1, amb) : tone('#2a6e46', 1, amb));
            ctx.fillRect(-2, D - 4, 4, 4);
            trucks(); break;
        }
        case 'abb': {
            underframe(ctx, -Lp / 2, Lp, amb, '#2a2f34', D);
            // A crated converter strapped to a well wagon, and chained to death
            ctx.fillStyle = tone('#33383d', L.roof, amb);
            ctx.beginPath();
            ctx.moveTo(-Lp / 2, D); ctx.lineTo(Lp / 2, D);
            ctx.lineTo(Lp / 2 + RDX, D - RDY); ctx.lineTo(-Lp / 2 + RDX, D - RDY);
            ctx.closePath(); ctx.fill();
            const aTop = D - 21;
            roofFace(ctx, -Lp * 0.34, aTop, Lp * 0.68, '#8e939a', amb, 1.1);
            panelBody(ctx, -Lp * 0.34, aTop, Lp * 0.68, 21, '#9aa0a8', amb, { round: 1 });
            ctx.fillStyle = tone('#c4392c', 1.15, amb);
            ctx.fillRect(-Lp * 0.30, aTop + 3, Lp * 0.16, 3);
            ctx.fillStyle = tone('#1a1c1f', 1, amb);
            ctx.font = 'bold 4.5px ui-monospace, monospace';
            ctx.fillText('ABB · BADEN', -Lp * 0.30, aTop + 12);
            ctx.font = '4px ui-monospace, monospace';
            ctx.fillText('DO NOT SHUNT', -Lp * 0.30, aTop + 18);
            ctx.strokeStyle = `rgba(${208 * amb | 0},${196 * amb | 0},${164 * amb | 0},0.85)`;
            ctx.lineWidth = 1.3;
            for (const d of [-0.24, -0.08, 0.08, 0.24]) {
                ctx.beginPath(); ctx.moveTo(Lp * d, aTop); ctx.lineTo(Lp * d + 2, D + 1); ctx.stroke();
            }
            ctx.fillStyle = o.shockAlarm ? '#ff4a2e' : tone('#4ad07a', 1, amb);
            ctx.fillRect(Lp * 0.30, aTop + 6, 4, 4);
            trucks(); break;
        }
        case 'lab': {
            const yl = van('#cfd4d8', '#a8aeb4', 27);
            for (let x = -Lp / 2 + 6; x < Lp / 2 - 8; x += 11) glassPane(ctx, x, yl + 7, 6, 9, o.night, amb);
            ctx.fillStyle = tone('#4a6f86', 1, amb);
            ctx.fillRect(-Lp * 0.06, yl + 2, Lp * 0.12, 23);
            trucks(); break;
        }
        case 'medical': {
            const ym = van('#e4e0d4', '#c2beb2', 27);
            ctx.fillStyle = tone('#c4392c', 1.2, amb);
            ctx.fillRect(-2.6, ym + 8, 5.2, 15);
            ctx.fillRect(-8, ym + 13, 16, 5);
            glassPane(ctx, -Lp / 2 + 5, ym + 5, 9, 9, o.night, amb);
            glassPane(ctx, Lp / 2 - 14, ym + 5, 9, 9, o.night, amb);
            trucks(); break;
        }
        case 'coach':
        case 'combine':
        case 'festival':
        case 'wedding': {
            const base = kind === 'wedding' ? '#7a2036' : '#2f4f6b';
            const roofC = kind === 'wedding' ? '#5c1728' : '#8d959c';
            underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
            const pTop = D - 32;
            // Clerestory: a raised centre strip on the roof, seen from above
            roofFace(ctx, -Lp / 2 + 1, pTop, Lp - 2, roofC, amb, 1.25, 2);
            panelBody(ctx, -Lp / 2 + 1, pTop, Lp - 2, 32, base, amb, { round: 2 });

            const winY = pTop + 6, winH = 12;
            const start = kind === 'combine' ? -Lp * 0.04 : -Lp / 2 + 6;
            for (let x = start; x < Lp / 2 - 9; x += 9.5) glassPane(ctx, x, winY, 6.2, winH, o.night, amb);
            if (kind === 'combine') {
                ctx.fillStyle = `rgba(0,0,0,${0.3 * amb})`;
                ctx.fillRect(-Lp / 2 + 3, pTop + 3, Lp * 0.40, 26);
                panelBody(ctx, -Lp / 2 + 4, pTop + 4, Lp * 0.38, 24, base, amb, { gloss: false });
            }
            // Doors at the ends, with grab handles
            for (const dx of [-Lp / 2 + 3, Lp / 2 - 10]) {
                ctx.fillStyle = `rgba(0,0,0,${0.26 * amb})`;
                ctx.fillRect(dx, pTop + 3, 7, 27);
                handrail(ctx, [[dx + 7.5, pTop + 4], [dx + 7.5, D - 2]], amb);
            }
            // Waist lining
            ctx.fillStyle = tone(kind === 'wedding' ? '#e0c15a' : '#c8a44a', 1.25, amb);
            ctx.fillRect(-Lp / 2 + 2, D - 6, Lp - 4, 1.8);

            if (kind === 'festival') {
                // Marigold garlands, because it is Pongal and somebody always does
                ctx.fillStyle = tone('#e8a838', 1.2, amb);
                for (let x = -Lp / 2 + 5; x < Lp / 2 - 5; x += 5) {
                    ctx.beginPath();
                    ctx.arc(x, pTop - 0.5 + Math.sin(x * 0.6) * 1.4, 1.6, 0, 6.283);
                    ctx.fill();
                }
            }
            if (kind === 'wedding') {
                ctx.fillStyle = tone('#e0c15a', 1.3, amb);
                for (let x = -Lp / 2 + 6; x < Lp / 2 - 6; x += 7) {
                    ctx.beginPath();
                    ctx.moveTo(x, pTop - 1); ctx.lineTo(x + 3, pTop + 2); ctx.lineTo(x - 3, pTop + 2);
                    ctx.closePath(); ctx.fill();
                }
            }
            if (o.night) {
                const g = ctx.createRadialGradient(0, pTop + 14, 5, 0, pTop + 14, Lp * 0.8);
                g.addColorStop(0, 'rgba(255,214,140,0.20)');
                g.addColorStop(1, 'rgba(255,214,140,0)');
                ctx.fillStyle = g;
                ctx.fillRect(-Lp, -50, Lp * 2, 100);
            }
            trucks(19); break;
        }
        case 'caboose': {
            underframe(ctx, -Lp / 2, Lp, amb, '#26292d', D);
            const cbT = D - 27;
            roofFace(ctx, -Lp / 2 + 1, cbT, Lp - 2, '#6d2a1f', amb, 1);
            panelBody(ctx, -Lp / 2 + 1, cbT, Lp - 2, 27, '#9c3a2c', amb, { round: 1.5 });
            // Cupola — the whole point of a caboose, and a second roof face
            roofFace(ctx, -Lp * 0.16, cbT - 11, Lp * 0.32, '#5f231a', amb, 1.2);
            panelBody(ctx, -Lp * 0.16, cbT - 11, Lp * 0.32, 12, '#8a3226', amb, { round: 1 });
            glassPane(ctx, -Lp * 0.13, cbT - 8.5, 6, 6, o.night, amb);
            glassPane(ctx, Lp * 0.02, cbT - 8.5, 6, 6, o.night, amb);
            glassPane(ctx, -Lp / 2 + 5, cbT + 6, 7, 9, o.night, amb);
            glassPane(ctx, Lp / 2 - 12, cbT + 6, 7, 9, o.night, amb);
            handrail(ctx, [[-Lp / 2 + 2.5, cbT + 4], [-Lp / 2 + 2.5, D - 2]], amb);
            // Marker lamp
            const mkY = D - 9;
            ctx.fillStyle = '#e0452f';
            ctx.beginPath(); ctx.arc(-Lp / 2 + 3, mkY, 2.4, 0, 6.283); ctx.fill();
            if (o.night) {
                const g = ctx.createRadialGradient(-Lp / 2 + 3, mkY, 1, -Lp / 2 + 3, mkY, 18);
                g.addColorStop(0, 'rgba(224,69,47,0.65)');
                g.addColorStop(1, 'rgba(224,69,47,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(-Lp / 2 + 3, mkY, 18, 0, 6.283); ctx.fill();
            }
            trucks(15); break;
        }
        case 'baggage': {
            const yb = van('#3d4a52', '#2c363c', 27, { seams: 4 });
            ctx.fillStyle = `rgba(0,0,0,${0.32 * amb})`;
            ctx.fillRect(-Lp * 0.13, yb + 2, Lp * 0.26, 24);
            panelBody(ctx, -Lp * 0.13 + 1, yb + 3, Lp * 0.26 - 2, 22, '#36424a', amb, { gloss: false });
            // Piled to the roof, and you can see it through the door
            ctx.fillStyle = tone('#6b5a44', 1, amb);
            for (let i = 0; i < 5; i++) ctx.fillRect(-Lp * 0.11 + i * 3.4, yb + 6 + (i % 2) * 3, 3, 9);
            handrail(ctx, [[-Lp / 2 + 3, yb + 4], [-Lp / 2 + 3, D - 2]], amb);
            grimeWash(ctx, -Lp / 2, yb, Lp, 27, 1.1, amb);
            trucks(); break;
        }
        case 'crane': {
            underframe(ctx, -Lp / 2, Lp, amb, '#3a2f22', D);
            const crT = D - 27;
            roofFace(ctx, -Lp * 0.34, crT, Lp * 0.62, '#6f4c15', amb, 1);
            panelBody(ctx, -Lp * 0.34, crT, Lp * 0.62, 27, '#9a6a1e', amb, { round: 1 });
            // Jib, up at rest, with its blocks hanging
            const jibTip = crT - 24;
            ctx.strokeStyle = tone('#b07d22', 1.15, amb);
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-Lp * 0.16, crT); ctx.lineTo(Lp * 0.46, jibTip); ctx.stroke();
            ctx.strokeStyle = `rgba(0,0,0,${0.4 * amb})`;
            ctx.lineWidth = 1;
            for (let i = 0; i <= 6; i++) {
                const f = i / 6;
                ctx.beginPath();
                ctx.moveTo(-Lp * 0.16 + f * Lp * 0.62, crT - f * 24);
                ctx.lineTo(-Lp * 0.16 + f * Lp * 0.62 + 3, crT + 4 - f * 24);
                ctx.stroke();
            }
            ctx.strokeStyle = tone('#cfc6b4', 1, amb);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(Lp * 0.44, jibTip + 1); ctx.lineTo(Lp * 0.44, crT - 6); ctx.stroke();
            ctx.fillStyle = tone('#5a5f64', 1.15, amb);
            ctx.fillRect(Lp * 0.42, crT - 7, 4.5, 6);
            // Rust, which is most of what it is made of now
            grimeWash(ctx, -Lp / 2, crT, Lp, 30, 1.4, amb);
            trucks(); break;
        }
        case 'tool': {
            const yt = van('#4a5a3e', '#374331', 26, { seams: 4 });
            glassPane(ctx, -Lp / 2 + 6, yt + 6, 7, 8, o.night, amb);
            glassPane(ctx, Lp / 2 - 13, yt + 6, 7, 8, o.night, amb);
            ctx.fillStyle = `rgba(0,0,0,${0.3 * amb})`;
            ctx.fillRect(-Lp * 0.08, yt + 2, Lp * 0.16, 22);
            trucks(); break;
        }
        default:
            van('#6b6257', '#4d463e', 26);
            trucks(); break;
    }
}

const LOCO_DRAW = {
    wdm2: drawVelaikkaran,
    rs3: drawFox,
    sw1500: drawGundu,
    e33: drawMissus,
};

/* ── Placing a vehicle on the track ──────────────────────────────────────── */

function placeAndDraw(ctx, route, camS, centreS, lengthM, yOff, fn, o) {
    const half = lengthM / 2;
    const a = trackPoint(route, centreS - half, camS);
    const b = trackPoint(route, centreS + half, camS);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + yOff;
    if (cx < -300 || cx > 1580) return;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    fn(ctx, lengthM * SCALE, o);
    ctx.restore();
}

export function drawPlayerTrain(ctx, v) {
    const { route, camS, train: t, consist, sky, onSiding, headlight, shockAlarm } = v;
    const yOff = onSiding ? 26 : 0;
    const o = {
        amb: Math.max(0.42, sky.amb),
        night: sky.night,
        livery: consist.loco.livery,
        phase: t.wheelPhase,
        headlight,
        shockAlarm,
        fire: consist.loco.kind === 'steam',
    };

    const locoLen = 20;
    placeAndDraw(ctx, route, camS, t.s - locoLen / 2, locoLen,
        yOff, LOCO_DRAW[consist.loco.id] || drawVelaikkaran, o);

    let back = t.s - locoLen;
    for (let i = 0; i < consist.cars.length; i++) {
        const c = consist.cars[i];
        // Slack accumulates down the train: the last vehicle feels it most.
        const give = t.slack * 0.42 * ((i + 1) / consist.cars.length);
        back -= 0.9 + give * 0.5;
        placeAndDraw(ctx, route, camS, back - c.len / 2, c.len, yOff,
            (cx, Lp, oo) => drawCar(cx, c.id, Lp, oo), o);
        back -= c.len;
    }
}

/** Somebody else's trains: grey and red, and never in a hurry to help. */
export function drawTrafficTrain(ctx, v, tr) {
    const { route, camS, sky } = v;
    const o = {
        amb: Math.max(0.42, sky.amb),
        night: sky.night,
        livery: tr.kind === 'express'
            ? { body:'#7a2f2a', roof:'#5c231f', stripe:'#d8cdb8', frame:'#1e2126' }
            : { body:'#4e545a', roof:'#3b4046', stripe:'#c9a44a', frame:'#1e2126' },
        phase: tr.phase || 0,
        headlight: true,
    };
    const yOff = tr.onSiding ? 26 : 0;
    const mirror = tr.dir < 0;
    const drawMirrored = (fn) => (cx, Lp, oo) => {
        if (!mirror) return fn(cx, Lp, oo);
        cx.save(); cx.scale(-1, 1); fn(cx, Lp, oo); cx.restore();
    };

    const locoLen = 19;
    placeAndDraw(ctx, route, camS, tr.s + (mirror ? -locoLen / 2 : locoLen / 2), locoLen, yOff,
        drawMirrored(tr.kind === 'express' ? drawGundu : drawFox), o);

    const carKind = tr.kind === 'express' ? 'coach' : (tr.kind === 'freight' ? 'hopper' : 'boxcar');
    let edge = tr.s + (mirror ? -locoLen : locoLen);
    for (let i = 0; i < (tr.cars || 6); i++) {
        const len = 15;
        const centre = mirror ? edge + len / 2 : edge - len / 2;
        placeAndDraw(ctx, route, camS, centre, len, yOff,
            drawMirrored((cx, Lp, oo) => drawCar(cx, i % 3 === 0 && tr.kind === 'freight' ? 'boxcar' : carKind, Lp, oo)), o);
        edge += mirror ? len : -len;
    }
}

/* ── Exhaust, steam and sparks ───────────────────────────────────────────── */

export class Plume {
    constructor() { this.p = []; }

    emit(x, y, kind, power, speed) {
        const n = kind === 'steam' ? 2 : (power > 0.6 ? 2 : 1);
        for (let i = 0; i < n; i++) {
            this.p.push({
                x: x + (Math.random() - 0.5) * 5,
                y: y + (Math.random() - 0.5) * 3,
                // Smoke hangs in the air; it is the locomotive that leaves.
                vx: -speed * 0.95 - Math.random() * 16,
                vy: -30 - Math.random() * 36 - power * 30,
                r: kind === 'steam' ? 3.2 + Math.random() * 3.4 : 3.4 + Math.random() * 4.5,
                life: 0,
                max: kind === 'steam' ? 1.1 + Math.random() * 0.8 : 2.1 + Math.random() * 1.5,
                kind,
                soot: kind === 'diesel' ? Math.min(1, power * 1.25 + Math.random() * 0.2) : 0,
            });
        }
        if (this.p.length > 340) this.p.splice(0, this.p.length - 340);
    }

    sparks(x, y, n) {
        for (let i = 0; i < n; i++) {
            this.p.push({
                x, y,
                vx: -60 - Math.random() * 160,
                vy: (Math.random() - 0.7) * 90,
                r: 1.2 + Math.random() * 1.1,
                life: 0, max: 0.4 + Math.random() * 0.4,
                kind: 'spark', soot: 0,
            });
        }
    }

    /** A blowout: a violent sideways jet of steam at the running plate. */
    burst(x, y, n = 26) {
        for (let i = 0; i < n; i++) {
            const a = Math.PI * (0.85 + Math.random() * 0.5);
            const sp = 90 + Math.random() * 170;
            this.p.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp * 0.5 - 20,
                r: 4 + Math.random() * 6,
                life: 0, max: 1.1 + Math.random() * 1.0,
                kind: 'steam', soot: 0,
            });
        }
    }

    update(dt) {
        for (const q of this.p) {
            q.life += dt;
            q.x += q.vx * dt;
            q.y += q.vy * dt;
            if (q.kind === 'spark') { q.vy += 220 * dt; q.vx *= 0.97; }
            else { q.vy += 7 * dt; q.vx *= 0.985; q.r += dt * (q.kind === 'steam' ? 8 : 10); }
        }
        this.p = this.p.filter(q => q.life < q.max && q.x > -220);
    }

    draw(ctx, amb) {
        for (const q of this.p) {
            const t = q.life / q.max;
            if (q.kind === 'spark') {
                ctx.fillStyle = `rgba(255,${140 + (1 - t) * 90 | 0},60,${(1 - t) * 0.9})`;
                ctx.fillRect(q.x, q.y, q.r, q.r);
                continue;
            }
            const a = (1 - t) * (q.kind === 'steam' ? 0.55 : 0.5);
            if (q.kind === 'steam') {
                ctx.fillStyle = `rgba(${232 * amb + 20 | 0},${238 * amb + 20 | 0},${244 * amb + 20 | 0},${a})`;
            } else {
                const g = (46 + t * 96) * amb + 14;
                ctx.fillStyle = `rgba(${g | 0},${g | 0},${g * 0.98 | 0},${a * (0.45 + q.soot * 0.55)})`;
            }
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r, 0, 6.283);
            ctx.fill();
        }
    }
}

/** Where the stack is, in screen space, so the plume leaves the chimney. */
export function stackPoint(route, t, camS, kind, onSiding) {
    const locoLen = 20;
    const centre = t.s - locoLen / 2;
    const a = trackPoint(route, centre - locoLen / 2, camS);
    const b = trackPoint(route, centre + locoLen / 2, camS);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + (onSiding ? 26 : 0);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const lx = kind === 'steam' ? locoLen * SCALE * 0.36 : -locoLen * SCALE * 0.08;
    const ly = kind === 'steam' ? -36 : -26;
    return {
        x: cx + lx * Math.cos(ang) - ly * Math.sin(ang),
        y: cy + lx * Math.sin(ang) + ly * Math.cos(ang),
    };
}
