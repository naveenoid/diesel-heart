/* ── The world ────────────────────────────────────────────────────────────────
   Side elevation. The train holds a fixed point on screen and the valley moves
   past it, tilting as the grade changes — which is the whole reason to draw a
   railway from the side. You can *see* Sabre Hill coming, and you can see the
   moment the ground stops fighting you and starts pushing.

   Vertical relief is exaggerated ~2.4×. A real 2.2% grade drawn honestly is
   invisible, and a hill you cannot see is not a hill, it is a number. */

import { MILE } from '../data/routes.js';

export const PPM     = 4.4;    // pixels per metre, horizontally
export const TRAIN_X = 352;    // where the locomotive's nose sits on screen
export const RAIL_Y  = 470;    // railhead under the locomotive
export const VEXAG   = 2.0;    // vertical exaggeration of the grade

const W = 1280, H = 720;

/* ── Deterministic wiggle, so the same hillside is the same hillside ── */
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function ridge(x, seed, amp, freq) {
    return Math.sin(x * freq + seed) * amp
         + Math.sin(x * freq * 2.13 + seed * 1.7) * amp * 0.42
         + Math.sin(x * freq * 4.31 + seed * 3.1) * amp * 0.18;
}

/* ── Elevation, integrated once per route and cached on it ── */
function elevation(route) {
    if (route._elev) return route._elev;
    const e = new Float32Array(route.grade.length);
    let acc = 0;
    for (let i = 0; i < route.grade.length; i++) { e[i] = acc; acc += route.grade[i] * 25; }
    route._elev = e;
    return e;
}
export function elevAt(route, s) {
    const e = elevation(route);
    const f = s / 25;
    const i = Math.max(0, Math.min(e.length - 1, Math.floor(f)));
    const j = Math.min(e.length - 1, i + 1);
    return e[i] + (e[j] - e[i]) * (f - i);
}

/** Screen position of a point on the track at sim distance `s`. */
export function trackPoint(route, s, camS) {
    return {
        x: TRAIN_X + (s - camS) * PPM,
        y: RAIL_Y - (elevAt(route, s) - elevAt(route, camS)) * PPM * VEXAG,
    };
}
export function screenToSim(x, camS) { return camS + (x - TRAIN_X) / PPM; }

/* ── Palettes by hour ────────────────────────────────────────────────────────
   Six keyed moments; everything between is a blend. The valley should feel
   different at 04:40 than at three in the afternoon, because it is. */
const SKIES = [
    { h: 0,    top:'#070b16', mid:'#0d1424', low:'#141c2c', sun:null,      amb:0.26, fog:'#101827' },
    { h: 5,    top:'#141d33', mid:'#3b3350', low:'#7a5254', sun:'#e0714a', amb:0.42, fog:'#3a3244' },
    { h: 7,    top:'#3f6f9e', mid:'#89a7bd', low:'#d5b284', sun:'#ffd9a0', amb:0.78, fog:'#b7bfc4' },
    { h: 13,   top:'#3a72ab', mid:'#7fa8ca', low:'#b9cdd8', sun:'#fff3cf', amb:1.00, fog:'#c9d4da' },
    { h: 19,   top:'#25406d', mid:'#7a5f74', low:'#c9704a', sun:'#ff9a52', amb:0.58, fog:'#6d5a5c' },
    { h: 21.5, top:'#0c1224', mid:'#182036', low:'#2a2c3c', sun:null,      amb:0.30, fog:'#1a2130' },
    { h: 24,   top:'#070b16', mid:'#0d1424', low:'#141c2c', sun:null,      amb:0.26, fog:'#101827' },
];

function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round((pa >> 16 & 255) * (1 - t) + (pb >> 16 & 255) * t);
    const g = Math.round((pa >> 8 & 255) * (1 - t) + (pb >> 8 & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return `rgb(${r},${g},${bl})`;
}
function hexMix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round((pa >> 16 & 255) * (1 - t) + (pb >> 16 & 255) * t);
    const g = Math.round((pa >> 8 & 255) * (1 - t) + (pb >> 8 & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

export function skyFor(hour) {
    let a = SKIES[0], b = SKIES[SKIES.length - 1];
    for (let i = 0; i < SKIES.length - 1; i++) {
        if (hour >= SKIES[i].h && hour <= SKIES[i + 1].h) { a = SKIES[i]; b = SKIES[i + 1]; break; }
    }
    const t = (hour - a.h) / Math.max(0.001, b.h - a.h);
    return {
        top: hexMix(a.top, b.top, t),
        mid: hexMix(a.mid, b.mid, t),
        low: hexMix(a.low, b.low, t),
        fog: hexMix(a.fog, b.fog, t),
        sun: a.sun && b.sun ? hexMix(a.sun, b.sun, t) : (t < 0.5 ? a.sun : b.sun),
        amb: a.amb + (b.amb - a.amb) * t,
        night: (a.amb + (b.amb - a.amb) * t) < 0.5,
    };
}

/* ── Weather particle systems, owned by the renderer ── */
export class Weather {
    constructor(kind) {
        this.kind = kind;
        this.parts = [];
        const n = kind === 'rain' ? 320 : kind === 'snow' ? 260 : 0;
        for (let i = 0; i < n; i++) this.parts.push(this.spawn(true));
        this.gust = 0;
    }
    spawn(anywhere) {
        return {
            x: Math.random() * (W + 300) - 150,
            y: anywhere ? Math.random() * H : -20,
            v: this.kind === 'rain' ? 900 + Math.random() * 700 : 40 + Math.random() * 70,
            d: Math.random() * 0.6 + 0.7,
            r: Math.random() * 2 + 1,
            ph: Math.random() * 6.28,
        };
    }
    update(dt, speed) {
        this.gust += dt;
        const drift = this.kind === 'snow' ? 26 : 150;
        for (const p of this.parts) {
            p.y += p.v * dt * p.d;
            p.x -= (drift + speed * (this.kind === 'rain' ? 6 : 2.2)) * dt * p.d;
            if (this.kind === 'snow') p.x += Math.sin(this.gust * 1.3 + p.ph) * 14 * dt;
            if (p.y > H + 20 || p.x < -160) Object.assign(p, this.spawn(false), { x: Math.random() * (W + 300) - 60 });
        }
    }
    draw(ctx, speed) {
        if (this.kind === 'rain') {
            ctx.strokeStyle = 'rgba(178,204,224,0.42)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            const skew = 5 + speed * 0.22;
            for (const p of this.parts) {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + skew * p.d, p.y + 17 * p.d);
            }
            ctx.stroke();
        } else if (this.kind === 'snow') {
            ctx.fillStyle = 'rgba(240,246,252,0.78)';
            for (const p of this.parts) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.d, 0, 6.283);
                ctx.fill();
            }
        }
    }
}

/* ── Sky, sun, stars ─────────────────────────────────────────────────────── */
function drawSky(ctx, sky, hour, camS) {
    const g = ctx.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, sky.top);
    g.addColorStop(0.55, sky.mid);
    g.addColorStop(1, sky.low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 430);

    if (sky.night) {
        // Stars drift with the camera, very slowly, so the sky is not wallpaper.
        const off = camS * 0.012;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 130; i++) {
            const sx = ((hash(i) * 1600 - off) % 1600 + 1600) % 1600 - 160;
            const sy = hash(i + 99) * 300;
            const tw = 0.35 + 0.65 * Math.abs(Math.sin(i + performance.now() * 0.0007));
            ctx.globalAlpha = (1 - sky.amb) * tw * 0.9;
            ctx.fillRect(sx, sy, hash(i + 7) > 0.9 ? 2 : 1, hash(i + 7) > 0.9 ? 2 : 1);
        }
        ctx.globalAlpha = 1;
        // Moon
        ctx.fillStyle = '#e8ecf2';
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(1010, 108, 26, 0, 6.283); ctx.fill();
        ctx.fillStyle = sky.top;
        ctx.beginPath(); ctx.arc(1023, 99, 24, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
    } else if (sky.sun) {
        const sunY = 300 - Math.sin(Math.max(0, Math.min(1, (hour - 5) / 14)) * Math.PI) * 250;
        const gg = ctx.createRadialGradient(940, sunY, 6, 940, sunY, 190);
        gg.addColorStop(0, sky.sun);
        gg.addColorStop(0.14, sky.sun + '');
        gg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = gg;
        ctx.fillRect(700, sunY - 200, 480, 400);
        ctx.globalAlpha = 1;
        ctx.fillStyle = sky.sun;
        ctx.beginPath(); ctx.arc(940, sunY, 21, 0, 6.283); ctx.fill();
    }
}

/* ── Parallax ridges ─────────────────────────────────────────────────────── */
function drawRidge(ctx, camS, para, baseY, amp, freq, seed, color, treeColor) {
    const off = camS * para;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, H);
    for (let x = -40; x <= W + 40; x += 12) {
        const y = baseY + ridge((x + off) * 0.0016, seed, amp, freq);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 40, H);
    ctx.closePath();
    ctx.fill();

    if (treeColor) {
        // A fringe of conifers along the crest — cheap, and it sells the scale.
        ctx.fillStyle = treeColor;
        for (let x = -30; x <= W + 30; x += 13) {
            const y = baseY + ridge((x + off) * 0.0016, seed, amp, freq);
            const h = 9 + hash((x + off) * 0.07) * 15;
            const w = 3.6 + hash((x + off) * 0.11) * 2.6;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + w, y + 2);
            ctx.lineTo(x - w, y + 2);
            ctx.closePath();
            ctx.fill();
        }
    }
}

/* ── Ballast, sleepers, rail ─────────────────────────────────────────────── */
function trackPath(route, camS, offsetY = 0, s0 = null, s1 = null) {
    const pts = [];
    const startX = s0 === null ? -60 : null;
    for (let x = -60; x <= W + 60; x += 14) {
        const s = screenToSim(x, camS);
        if (s0 !== null && (s < s0 || s > s1)) continue;
        const p = trackPoint(route, s, camS);
        pts.push({ x: p.x, y: p.y + offsetY, s });
    }
    return pts;
}

function drawRoadbed(ctx, pts, sky, sidingDrop = 0) {
    if (pts.length < 2) return;
    const dark = sky.amb;

    // Ballast shoulder
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + 4);
    for (const p of pts) ctx.lineTo(p.x, p.y + 4);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + 0, pts[i].y + 30);
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, 0, 0, 1);
    ctx.fillStyle = `rgb(${Math.round(96 * dark + 12)},${Math.round(90 * dark + 12)},${Math.round(82 * dark + 14)})`;
    ctx.fill();

    // Sleepers, spaced in world units so they scroll correctly
    ctx.fillStyle = `rgb(${Math.round(64 * dark + 10)},${Math.round(46 * dark + 9)},${Math.round(33 * dark + 8)})`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i];
        const phase = ((p.s % 0.72) + 0.72) % 0.72;
        if (phase < 0.36) {
            const dx = pts[i + 1].x - p.x, dy = pts[i + 1].y - p.y;
            const ang = Math.atan2(dy, dx);
            ctx.save();
            ctx.translate(p.x, p.y + 6);
            ctx.rotate(ang);
            ctx.fillRect(-3, -1, 6, 8);
            ctx.restore();
        }
    }

    // Rail: a dark web with a bright, worn head
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgb(${Math.round(38 * dark + 8)},${Math.round(36 * dark + 8)},${Math.round(36 * dark + 9)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + 1);
    for (const p of pts) ctx.lineTo(p.x, p.y + 1);
    ctx.stroke();

    ctx.strokeStyle = `rgb(${Math.round(178 * dark + 26)},${Math.round(180 * dark + 28)},${Math.round(186 * dark + 30)})`;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - 1);
    for (const p of pts) ctx.lineTo(p.x, p.y - 1);
    ctx.stroke();
}

/* ── Ground fill beneath the track ───────────────────────────────────────── */
function drawGround(ctx, pts, sky, weather) {
    if (pts.length < 2) return;
    const d = sky.amb;
    const snow = weather === 'snow';
    ctx.beginPath();
    ctx.moveTo(-60, H);
    for (const p of pts) ctx.lineTo(p.x, p.y + 26);
    ctx.lineTo(W + 60, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 380, 0, H);
    if (snow) {
        g.addColorStop(0, `rgb(${Math.round(198 * d + 30)},${Math.round(206 * d + 32)},${Math.round(214 * d + 36)})`);
        g.addColorStop(1, `rgb(${Math.round(150 * d + 22)},${Math.round(160 * d + 24)},${Math.round(172 * d + 28)})`);
    } else {
        g.addColorStop(0, `rgb(${Math.round(78 * d + 12)},${Math.round(92 * d + 14)},${Math.round(54 * d + 12)})`);
        g.addColorStop(1, `rgb(${Math.round(46 * d + 9)},${Math.round(56 * d + 11)},${Math.round(34 * d + 9)})`);
    }
    ctx.fillStyle = g;
    ctx.fill();
}

/* ── Lineside furniture ──────────────────────────────────────────────────── */

function drawSignal(ctx, x, y, aspect, name, sky) {
    const d = sky.amb;
    const base = y - 6;
    ctx.fillStyle = `rgb(${Math.round(52 * d + 12)},${Math.round(54 * d + 13)},${Math.round(58 * d + 14)})`;
    ctx.fillRect(x - 2.5, base - 74, 5, 74);
    ctx.fillRect(x - 9, base - 2, 18, 5);

    // Head
    ctx.fillStyle = `rgb(${Math.round(28 * d + 8)},${Math.round(29 * d + 8)},${Math.round(31 * d + 9)})`;
    roundRect(ctx, x - 11, base - 100, 22, 30, 4);
    ctx.fill();

    const col = aspect === 'green' ? '#3ee07a' : aspect === 'yellow' ? '#f0b32e' : '#ff3a22';
    // Glow first, so the lamp reads at night
    const gg = ctx.createRadialGradient(x, base - 85, 1, x, base - 85, 34);
    gg.addColorStop(0, col);
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = sky.night ? 0.55 : 0.3;
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(x, base - 85, 34, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, base - 85, 6.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(x - 2, base - 87.5, 2, 0, 6.283); ctx.fill();

    // Plate
    ctx.fillStyle = '#d8cdb8';
    ctx.fillRect(x - 12, base - 66, 24, 11);
    ctx.fillStyle = '#16181b';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, base - 58);
    ctx.textAlign = 'left';
}

function drawMilepost(ctx, x, y, mp, sky) {
    const d = sky.amb;
    ctx.fillStyle = `rgb(${Math.round(200 * d + 30)},${Math.round(196 * d + 30)},${Math.round(184 * d + 30)})`;
    ctx.fillRect(x - 1.5, y - 24, 3, 24);
    ctx.fillRect(x - 9, y - 34, 18, 12);
    ctx.fillStyle = '#1a1c1f';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mp.toFixed(0), x, y - 25);
    ctx.textAlign = 'left';
}

function drawWhistleBoard(ctx, x, y, sky) {
    const d = sky.amb;
    ctx.fillStyle = `rgb(${Math.round(70 * d + 14)},${Math.round(60 * d + 12)},${Math.round(48 * d + 11)})`;
    ctx.fillRect(x - 2, y - 40, 4, 40);
    ctx.fillStyle = `rgb(${Math.round(232 * d + 24)},${Math.round(228 * d + 24)},${Math.round(216 * d + 24)})`;
    ctx.beginPath();
    ctx.moveTo(x, y - 62); ctx.lineTo(x + 15, y - 47); ctx.lineTo(x, y - 32); ctx.lineTo(x - 15, y - 47);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1c1f';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('W', x, y - 42);
    ctx.textAlign = 'left';
}

function drawCrossing(ctx, x, y, sky, vehicle) {
    const d = sky.amb;
    // Road across the frame
    ctx.fillStyle = `rgb(${Math.round(58 * d + 12)},${Math.round(56 * d + 12)},${Math.round(54 * d + 12)})`;
    ctx.beginPath();
    ctx.moveTo(x - 46, y + 30); ctx.lineTo(x + 46, y + 30);
    ctx.lineTo(x + 80, H); ctx.lineTo(x - 80, H);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgb(${Math.round(52 * d + 11)},${Math.round(50 * d + 11)},${Math.round(48 * d + 11)})`;
    ctx.fillRect(x - 40, y - 4, 80, 22);

    // Crossbuck
    ctx.save();
    ctx.translate(x + 40, y - 8);
    ctx.strokeStyle = `rgb(${Math.round(226 * d + 26)},${Math.round(222 * d + 26)},${Math.round(212 * d + 26)})`;
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(-1, -48); ctx.lineTo(-1, 0); ctx.stroke();
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-13, -58); ctx.lineTo(13, -40);
    ctx.moveTo(13, -58);  ctx.lineTo(-13, -40);
    ctx.stroke();
    ctx.restore();

    if (vehicle) {
        // A pickup that should not be there.
        const vy = y + 6;
        ctx.fillStyle = '#8a3a2c';
        roundRect(ctx, x - 22, vy - 16, 44, 15, 3); ctx.fill();
        ctx.fillStyle = '#6d2d22';
        roundRect(ctx, x - 12, vy - 25, 20, 11, 3); ctx.fill();
        ctx.fillStyle = '#b9d6e4';
        ctx.fillRect(x - 9, vy - 23, 14, 7);
        ctx.fillStyle = '#17191c';
        ctx.beginPath(); ctx.arc(x - 13, vy, 5, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 13, vy, 5, 0, 6.283); ctx.fill();
        // Hazards flashing
        if (Math.floor(performance.now() / 260) % 2 === 0) {
            ctx.fillStyle = '#ffb020';
            ctx.fillRect(x - 23, vy - 12, 4, 4);
            ctx.fillRect(x + 19, vy - 12, 4, 4);
        }
    }
}

function drawLandmark(ctx, lm, x, y, sky, weather) {
    const d = sky.amb;
    const lit = sky.night;
    const shade = (r, g, b) => `rgb(${Math.round(r * d)},${Math.round(g * d)},${Math.round(b * d)})`;

    switch (lm.type) {
        case 'bridge': {
            const w = (lm.span || 260) * PPM;
            ctx.fillStyle = shade(74, 70, 66);
            ctx.fillRect(x - w / 2, y + 22, w, 12);
            for (let i = 0; i <= 4; i++) {
                const px = x - w / 2 + (w / 4) * i;
                ctx.fillRect(px - 5, y + 30, 10, H - y);
            }
            // Truss
            ctx.strokeStyle = shade(96, 92, 88);
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const x0 = x - w / 2 + (w / 10) * i, x1 = x0 + w / 10;
                ctx.moveTo(x0, y + 18); ctx.lineTo(x1, y - 42);
                ctx.moveTo(x1, y + 18); ctx.lineTo(x0, y - 42);
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - w / 2, y - 42); ctx.lineTo(x + w / 2, y - 42);
            ctx.stroke();
            // River below
            const rg = ctx.createLinearGradient(0, y + 90, 0, H);
            rg.addColorStop(0, shade(58, 92, 116));
            rg.addColorStop(1, shade(34, 58, 78));
            ctx.fillStyle = rg;
            ctx.fillRect(x - w / 2 - 60, y + 120, w + 120, H - y - 120);
            break;
        }
        case 'trestle': {
            const w = (lm.span || 240) * PPM;
            ctx.strokeStyle = shade(62, 48, 34);
            ctx.lineWidth = 4;
            for (let i = 0; i <= 9; i++) {
                const px = x - w / 2 + (w / 9) * i;
                ctx.beginPath();
                ctx.moveTo(px, y + 24); ctx.lineTo(px - 12, H);
                ctx.moveTo(px, y + 24); ctx.lineTo(px + 12, H);
                ctx.stroke();
            }
            break;
        }
        case 'rockcut': {
            const w = (lm.span || 420) * PPM;
            ctx.fillStyle = shade(84, 76, 68);
            ctx.beginPath();
            ctx.moveTo(x - w / 2, y + 30);
            for (let i = 0; i <= 14; i++) {
                const px = x - w / 2 + (w / 14) * i;
                const h = 90 + hash(i * 3.7 + lm.s) * 120;
                ctx.lineTo(px, y - h);
            }
            ctx.lineTo(x + w / 2, y + 30);
            ctx.closePath(); ctx.fill();
            // Strata
            ctx.strokeStyle = shade(62, 56, 50);
            ctx.lineWidth = 2;
            for (let k = 0; k < 5; k++) {
                ctx.beginPath();
                for (let i = 0; i <= 14; i++) {
                    const px = x - w / 2 + (w / 14) * i;
                    const h = 90 + hash(i * 3.7 + lm.s) * 120;
                    const yy = y - h * (0.25 + k * 0.16);
                    i === 0 ? ctx.moveTo(px, yy) : ctx.lineTo(px, yy);
                }
                ctx.stroke();
            }
            break;
        }
        case 'snowshed': {
            const w = (lm.span || 340) * PPM;
            ctx.fillStyle = shade(70, 56, 42);
            for (let i = 0; i <= 12; i++) {
                const px = x - w / 2 + (w / 12) * i;
                ctx.fillRect(px - 3, y - 74, 6, 76);
            }
            ctx.fillStyle = weather === 'snow' ? shade(206, 214, 222) : shade(88, 72, 54);
            ctx.beginPath();
            ctx.moveTo(x - w / 2 - 14, y - 70);
            ctx.lineTo(x + w / 2 + 14, y - 70);
            ctx.lineTo(x + w / 2 + 8, y - 90);
            ctx.lineTo(x - w / 2 - 8, y - 90);
            ctx.closePath(); ctx.fill();
            break;
        }
        case 'mill': {
            const w = (lm.span || 260) * PPM;
            ctx.fillStyle = shade(96, 74, 52);
            ctx.fillRect(x - w / 2, y - 130, w * 0.62, 132);
            ctx.fillStyle = shade(66, 50, 36);
            ctx.beginPath();
            ctx.moveTo(x - w / 2 - 10, y - 130);
            ctx.lineTo(x - w / 2 + w * 0.31, y - 168);
            ctx.lineTo(x - w / 2 + w * 0.62 + 10, y - 130);
            ctx.closePath(); ctx.fill();
            // Stack
            ctx.fillStyle = shade(84, 66, 50);
            ctx.fillRect(x + w * 0.2, y - 210, 20, 210);
            // Windows, lit if it is dark — the mill runs shifts
            ctx.fillStyle = lit ? '#ffd98a' : shade(150, 168, 178);
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 6; c++)
                    ctx.fillRect(x - w / 2 + 16 + c * (w * 0.62 - 32) / 6, y - 116 + r * 34, 18, 20);
            break;
        }
        case 'enginehouse': {
            ctx.fillStyle = shade(84, 70, 58);
            ctx.fillRect(x - 92, y - 106, 184, 108);
            ctx.fillStyle = shade(58, 48, 40);
            ctx.beginPath();
            ctx.moveTo(x - 102, y - 106); ctx.lineTo(x, y - 142); ctx.lineTo(x + 102, y - 106);
            ctx.closePath(); ctx.fill();
            // Doors
            ctx.fillStyle = shade(38, 33, 29);
            ctx.fillRect(x - 46, y - 84, 92, 86);
            ctx.fillStyle = lit ? 'rgba(255,196,110,0.35)' : shade(28, 25, 23);
            ctx.fillRect(x - 42, y - 80, 84, 80);
            // The painted line above the doors
            ctx.fillStyle = shade(216, 205, 184);
            ctx.font = 'bold 10px ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('THE LOAD NEEDS PULLING', x, y - 92);
            ctx.textAlign = 'left';
            break;
        }
        case 'clinic': {
            ctx.fillStyle = shade(196, 192, 182);
            ctx.fillRect(x - 60, y - 84, 120, 86);
            ctx.fillStyle = shade(140, 138, 132);
            ctx.fillRect(x - 66, y - 92, 132, 10);
            ctx.fillStyle = '#c4392c';
            ctx.fillRect(x - 6, y - 74, 12, 34);
            ctx.fillRect(x - 17, y - 63, 34, 12);
            ctx.fillStyle = lit ? '#ffe9a8' : shade(120, 146, 160);
            for (let c = 0; c < 4; c++) ctx.fillRect(x - 48 + c * 26, y - 34, 16, 22);
            break;
        }
        case 'watertower': {
            ctx.fillStyle = shade(72, 58, 44);
            for (const dx of [-22, 22]) { ctx.fillRect(x + dx - 3, y - 78, 6, 78); }
            ctx.fillStyle = shade(94, 76, 58);
            roundRect(ctx, x - 32, y - 128, 64, 54, 5); ctx.fill();
            ctx.fillStyle = shade(60, 48, 38);
            ctx.beginPath();
            ctx.moveTo(x - 38, y - 128); ctx.lineTo(x, y - 150); ctx.lineTo(x + 38, y - 128);
            ctx.closePath(); ctx.fill();
            break;
        }
        case 'fueldepot': {
            ctx.fillStyle = shade(120, 122, 124);
            roundRect(ctx, x - 70, y - 76, 140, 76, 8); ctx.fill();
            ctx.fillStyle = shade(96, 98, 100);
            ctx.fillRect(x - 70, y - 46, 140, 5);
            ctx.fillStyle = shade(180, 60, 40);
            ctx.fillRect(x - 24, y - 66, 48, 14);
            break;
        }
        case 'farm': {
            ctx.fillStyle = shade(132, 58, 44);
            ctx.fillRect(x - 44, y - 66, 88, 68);
            ctx.fillStyle = shade(92, 40, 32);
            ctx.beginPath();
            ctx.moveTo(x - 52, y - 66); ctx.lineTo(x, y - 100); ctx.lineTo(x + 52, y - 66);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = lit ? '#ffdf9b' : shade(60, 50, 42);
            ctx.fillRect(x - 10, y - 44, 20, 24);
            break;
        }
        case 'shrine': {
            // A small thing somebody keeps painted, beside a railway in a valley.
            ctx.fillStyle = shade(190, 180, 160);
            ctx.fillRect(x - 9, y - 30, 18, 30);
            ctx.fillStyle = shade(150, 60, 48);
            ctx.beginPath();
            ctx.moveTo(x - 13, y - 30); ctx.lineTo(x, y - 46); ctx.lineTo(x + 13, y - 30);
            ctx.closePath(); ctx.fill();
            if (lit) {
                ctx.fillStyle = 'rgba(255,190,90,0.75)';
                ctx.beginPath(); ctx.arc(x, y - 18, 4.5, 0, 6.283); ctx.fill();
            }
            break;
        }
        case 'summit': {
            ctx.fillStyle = shade(70, 62, 52);
            ctx.fillRect(x - 2, y - 54, 4, 54);
            ctx.fillStyle = shade(226, 220, 204);
            ctx.fillRect(x - 46, y - 78, 92, 26);
            ctx.fillStyle = '#1a1c1f';
            ctx.font = 'bold 9px ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SABRE', x, y - 67);
            ctx.fillText('2,148 FT', x, y - 57);
            ctx.textAlign = 'left';
            break;
        }
        case 'lab': {
            ctx.fillStyle = shade(158, 166, 172);
            ctx.fillRect(x - 54, y - 96, 108, 98);
            ctx.fillStyle = shade(112, 120, 128);
            ctx.fillRect(x - 54, y - 104, 108, 10);
            ctx.fillStyle = lit ? '#cfe8ff' : shade(96, 128, 150);
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 5; c++)
                    ctx.fillRect(x - 44 + c * 19, y - 84 + r * 26, 13, 16);
            break;
        }
    }
}

function drawStation(ctx, st, x, y, sky) {
    const d = sky.amb;
    const lit = sky.night;
    const shade = (r, g, b) => `rgb(${Math.round(r * d)},${Math.round(g * d)},${Math.round(b * d)})`;

    // Platform
    ctx.fillStyle = shade(150, 144, 132);
    ctx.fillRect(x - 130, y + 2, 260, 16);
    ctx.fillStyle = shade(118, 112, 102);
    ctx.fillRect(x - 130, y + 16, 260, 8);

    // Building
    ctx.fillStyle = shade(122, 96, 70);
    ctx.fillRect(x - 74, y - 68, 148, 70);
    ctx.fillStyle = shade(80, 62, 46);
    ctx.beginPath();
    ctx.moveTo(x - 92, y - 68); ctx.lineTo(x, y - 100); ctx.lineTo(x + 92, y - 68);
    ctx.closePath(); ctx.fill();
    // Canopy over the platform
    ctx.fillStyle = shade(66, 52, 40);
    ctx.fillRect(x - 116, y - 44, 42, 5);
    ctx.fillRect(x + 74, y - 44, 42, 5);
    ctx.fillStyle = shade(60, 48, 38);
    ctx.fillRect(x - 116, y - 40, 4, 40);
    ctx.fillRect(x + 112, y - 40, 4, 40);

    ctx.fillStyle = lit ? '#ffdc9a' : shade(140, 160, 172);
    ctx.fillRect(x - 56, y - 50, 24, 26);
    ctx.fillRect(x + 32, y - 50, 24, 26);
    ctx.fillStyle = shade(46, 38, 30);
    ctx.fillRect(x - 12, y - 50, 24, 50);

    // Nameboard
    ctx.fillStyle = shade(226, 220, 204);
    ctx.fillRect(x - 62, y - 84, 124, 15);
    ctx.fillStyle = '#1a1c1f';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(st.name.toUpperCase(), x, y - 73);
    ctx.textAlign = 'left';

    if (lit) {
        const g = ctx.createRadialGradient(x, y - 30, 4, x, y - 30, 150);
        g.addColorStop(0, 'rgba(255,208,130,0.20)');
        g.addColorStop(1, 'rgba(255,208,130,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 160, y - 180, 320, 220);
    }
}

/* ── Telegraph line ───────────────────────────────────────────────────────────
   Poles beside the track with the wires sagging between them. Nothing sells
   speed in a side view like something close, regular, and going past fast. */
function drawPoles(ctx, route, camS, sky) {
    const d = sky.amb;
    const SPACING = 46;                       // metres between poles
    const first = Math.floor((camS - 120) / SPACING) * SPACING;
    const poles = [];
    for (let s = first; s < camS + 340; s += SPACING) {
        const p = trackPoint(route, s, camS);
        if (p.x < -90 || p.x > W + 90) continue;
        poles.push({ x: p.x, y: p.y - 6, top: p.y - 6 - 96 });
    }
    if (!poles.length) return;

    // Wires first, so the poles sit in front of them.
    ctx.strokeStyle = `rgba(${Math.round(30 * d + 16)},${Math.round(30 * d + 16)},${Math.round(34 * d + 18)},0.75)`;
    ctx.lineWidth = 1;
    for (const dy of [4, 10, 16]) {
        ctx.beginPath();
        for (let i = 0; i < poles.length - 1; i++) {
            const a = poles[i], b = poles[i + 1];
            ctx.moveTo(a.x, a.top + dy);
            ctx.quadraticCurveTo((a.x + b.x) / 2, (a.top + b.top) / 2 + dy + 13, b.x, b.top + dy);
        }
        ctx.stroke();
    }

    ctx.fillStyle = `rgb(${Math.round(58 * d + 12)},${Math.round(46 * d + 10)},${Math.round(34 * d + 9)})`;
    for (const p of poles) {
        ctx.fillRect(p.x - 2, p.top, 4, p.y - p.top);
        ctx.fillRect(p.x - 11, p.top + 2, 22, 3);
        ctx.fillRect(p.x - 8, p.top + 14, 16, 2.5);
    }
}

/* ── Foreground ───────────────────────────────────────────────────────────────
   A near bank of weeds and fence, moving faster than everything else, filling
   the bottom of the frame and giving the eye something to measure speed by. */
function drawForeground(ctx, camS, sky, weather) {
    const d = Math.max(0.5, sky.amb);
    const off = camS * 1.34 * PPM;
    const baseY = RAIL_Y + 138;

    // Bank
    ctx.fillStyle = weather === 'snow'
        ? `rgb(${Math.round(176 * d)},${Math.round(186 * d)},${Math.round(198 * d)})`
        : `rgb(${Math.round(38 * d)},${Math.round(48 * d)},${Math.round(28 * d)})`;
    ctx.beginPath();
    ctx.moveTo(-40, H);
    for (let x = -40; x <= W + 40; x += 20) {
        ctx.lineTo(x, baseY + Math.sin((x + off) * 0.011) * 9 + Math.sin((x + off) * 0.037) * 4);
    }
    ctx.lineTo(W + 40, H);
    ctx.closePath();
    ctx.fill();

    // Weeds along the crest
    ctx.strokeStyle = weather === 'snow'
        ? `rgba(${Math.round(210 * d)},${Math.round(218 * d)},${Math.round(228 * d)},0.9)`
        : `rgba(${Math.round(52 * d)},${Math.round(66 * d)},${Math.round(34 * d)},0.95)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 150; i++) {
        const wx = (((i * 71 - off * 0.6) % (W + 200)) + W + 200) % (W + 200) - 100;
        const wy = baseY + Math.sin((wx + off) * 0.011) * 9 - 2;
        const hh = 8 + hash(i * 5.3) * 16;
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 3, wy - hh * 0.6, wx + 7 * (hash(i) - 0.3), wy - hh);
    }
    ctx.stroke();

    // Fence posts, further along the bank
    const fOff = camS * 1.12 * PPM;
    ctx.fillStyle = `rgb(${Math.round(46 * d)},${Math.round(38 * d)},${Math.round(28 * d)})`;
    ctx.strokeStyle = `rgba(${Math.round(52 * d)},${Math.round(44 * d)},${Math.round(32 * d)},0.9)`;
    ctx.lineWidth = 1.4;
    const posts = [];
    for (let i = -2; i < 22; i++) {
        const px = ((i * 96 - fOff % 96) % (W + 260) + W + 260) % (W + 260) - 130;
        posts.push(px);
    }
    posts.sort((a, b) => a - b);
    for (const px of posts) {
        const py = baseY - 22 + Math.sin((px + off) * 0.009) * 7;
        ctx.fillRect(px - 2, py, 4, 30);
    }

    // Bottom edge shadow, so the HUD has something to sit against
    const g = ctx.createLinearGradient(0, H - 130, 0, H);
    g.addColorStop(0, 'rgba(6,8,10,0)');
    g.addColorStop(1, 'rgba(6,8,10,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 130, W, 130);
}

/* ── Turnout: the visual promise that a siding exists ── */
function drawTurnout(ctx, x, y, dir, sky, lined) {
    const d = sky.amb;
    ctx.strokeStyle = lined ? '#5fc27e'
                            : `rgb(${Math.round(150 * d + 22)},${Math.round(152 * d + 22)},${Math.round(156 * d + 24)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + dir * 26, y, x + dir * 30, y + 26, x + dir * 62, y + 26);
    ctx.stroke();
    // Point lever
    ctx.fillStyle = lined ? '#5fc27e' : `rgb(${Math.round(120 * d + 20)},${Math.round(60 * d + 14)},${Math.round(40 * d + 12)})`;
    ctx.fillRect(x - 2, y - 14, 4, 12);
    ctx.beginPath(); ctx.arc(x, y - 16, 4, 0, 6.283); ctx.fill();
}

export function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/* ── The main entry point ────────────────────────────────────────────────── */
export function drawWorld(ctx, v) {
    const { route, camS, weather, signalAspects, hazards, lined, onSiding } = v;
    const sky = v.sky;
    /* Ground-level things get a brightness floor. A night scene that is honest
       about how dark it is at 04:40 is a night scene you cannot read. */
    const gsky = sky.amb < 0.5 ? { ...sky, amb: 0.5 } : sky;

    drawSky(ctx, sky, v.hour, camS);

    // Ridge layers, far to near.
    drawRidge(ctx, camS, 0.05, 352, 34, 1.9, 11.3,
        mixHex(sky.mid, '#38506a', 0.55), null);
    drawRidge(ctx, camS, 0.13, 392, 26, 3.1, 4.7,
        mixHex(sky.mid, '#2b3f4e', 0.75), null);
    drawRidge(ctx, camS, 0.30, 424, 18, 5.3, 21.9,
        weather === 'snow' ? mixHex(sky.low, '#8f9aa4', 0.8) : mixHex(sky.low, '#2f4232', 0.85),
        weather === 'snow' ? mixHex(sky.low, '#5c6a76', 0.9) : mixHex(sky.low, '#1e2f22', 0.92));

    // Main track and the ground it sits on.
    const pts = trackPath(route, camS);
    drawGround(ctx, pts, gsky, weather);

    // Landmarks sit behind the track, in the middle distance.
    for (const lm of route.landmarks) {
        const p = trackPoint(route, lm.s, camS);
        if (p.x < -700 || p.x > W + 700) continue;
        drawLandmark(ctx, lm, p.x, p.y, gsky, weather);
    }

    drawPoles(ctx, route, camS, gsky);

    // Sidings, drawn below the main so the geometry reads at a glance.
    for (const sd of route.sidings) {
        const sPts = trackPath(route, camS, 26, sd.s0, sd.s1);
        if (sPts.length > 1) {
            drawRoadbed(ctx, sPts, gsky);
            const a = trackPoint(route, sd.s0, camS);
            const b = trackPoint(route, sd.s1, camS);
            if (a.x > -140 && a.x < W + 140) drawTurnout(ctx, a.x, a.y, 1, gsky, lined === sd.name);
            if (b.x > -140 && b.x < W + 140) drawTurnout(ctx, b.x, b.y, -1, gsky, false);
            if (a.x > -200 && a.x < W) {
                ctx.fillStyle = `rgba(216,205,184,${0.45 + 0.4 * gsky.amb})`;
                ctx.font = '9px ui-monospace, monospace';
                ctx.fillText(sd.name.toUpperCase(), a.x + 6, a.y + 52);
            }
        }
    }

    drawRoadbed(ctx, pts, gsky);

    // Stations
    for (const st of route.stations) {
        const p = trackPoint(route, st.s, camS);
        if (p.x < -340 || p.x > W + 340) continue;
        drawStation(ctx, st, p.x, p.y, gsky);
    }

    // Crossings — road first, vehicle if a hazard is live there
    for (const cr of route.crossings) {
        const p = trackPoint(route, cr.s, camS);
        if (p.x < -180 || p.x > W + 180) continue;
        const hz = hazards.find(h => h.type === 'crossing' && Math.abs(h.s - cr.s) < 40);
        drawCrossing(ctx, p.x, p.y, gsky, hz && hz.vehicle && !hz.cleared);
        const wp = trackPoint(route, cr.s - 240, camS);
        if (wp.x > -60 && wp.x < W + 60) drawWhistleBoard(ctx, wp.x, wp.y, gsky);
    }

    // Rockfall debris
    for (const hz of hazards) {
        if (hz.type !== 'rockfall' || hz.cleared) continue;
        const p = trackPoint(route, hz.s, camS);
        if (p.x < -120 || p.x > W + 120) continue;
        const d = sky.amb;
        ctx.fillStyle = `rgb(${Math.round(112 * d + 14)},${Math.round(102 * d + 13)},${Math.round(92 * d + 12)})`;
        ctx.beginPath();
        ctx.moveTo(p.x - 34, p.y + 10);
        ctx.lineTo(p.x - 26, p.y - 26);
        ctx.lineTo(p.x + 6, p.y - 34);
        ctx.lineTo(p.x + 32, p.y - 8);
        ctx.lineTo(p.x + 26, p.y + 12);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgb(${Math.round(84 * d + 11)},${Math.round(76 * d + 10)},${Math.round(68 * d + 10)})`;
        ctx.beginPath();
        ctx.moveTo(p.x + 18, p.y + 12); ctx.lineTo(p.x + 40, p.y - 2);
        ctx.lineTo(p.x + 52, p.y + 12); ctx.closePath(); ctx.fill();
    }

    // Snow drifts
    for (const hz of hazards) {
        if (hz.type !== 'drift' || hz.cleared) continue;
        const p = trackPoint(route, hz.s, camS);
        if (p.x < -200 || p.x > W + 200) continue;
        ctx.fillStyle = 'rgba(238,244,250,0.92)';
        ctx.beginPath();
        ctx.moveTo(p.x - 90, p.y + 16);
        ctx.quadraticCurveTo(p.x - 20, p.y - 40, p.x + 40, p.y - 6);
        ctx.quadraticCurveTo(p.x + 70, p.y + 6, p.x + 96, p.y + 16);
        ctx.closePath(); ctx.fill();
    }

    // Signals
    for (const sg of route.signals) {
        const p = trackPoint(route, sg.s, camS);
        if (p.x < -80 || p.x > W + 80) continue;
        drawSignal(ctx, p.x, p.y, signalAspects.get(sg.name) || 'green', sg.name, gsky);
    }

    // Mileposts, at each whole fictional mile within view.
    const mpHere = route.mpAt(camS);
    for (let k = Math.floor(mpHere) - 1; k <= Math.ceil(mpHere) + 2; k++) {
        // Invert mpAt: mp = (base + dir·s)/MILE  ⇒  s = (mp·MILE − base)/dir
        const s = (k * MILE - route.mpAt(0) * MILE) / route.dir;
        if (s < 0 || s > route.length) continue;
        const p = trackPoint(route, s, camS);
        if (p.x < -40 || p.x > W + 40) continue;
        drawMilepost(ctx, p.x, p.y, k, gsky);
    }

    drawForeground(ctx, camS, sky, weather);
}

/* ── Post-pass: fog, night vignette, headlight ───────────────────────────── */
export function drawAtmosphere(ctx, v) {
    const { sky, weather, headlight, speed } = v;

    if (weather === 'fog') {
        const g = ctx.createLinearGradient(0, 260, 0, H);
        g.addColorStop(0, hexToRgba(sky.fog, 0.78));
        g.addColorStop(0.35, hexToRgba(sky.fog, 0.62));
        g.addColorStop(1, hexToRgba(sky.fog, 0.86));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // A clear-ish bubble around the locomotive, because that is what you get.
        const r = ctx.createRadialGradient(TRAIN_X + 60, RAIL_Y - 30, 20, TRAIN_X + 60, RAIL_Y - 30, 340);
        r.addColorStop(0, 'rgba(0,0,0,0.5)');
        r.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
    }

    if (sky.night) {
        ctx.fillStyle = `rgba(6,9,18,${0.30 * (1 - sky.amb)})`;
        ctx.fillRect(0, 0, W, H);

        if (headlight) {
            /* No clipping and no polygon: a hard-edged wedge reads as a painted
               shape lying on the hillside. Two squashed radial gradients — a
               near pool and a longer throw down the track — have no edges at
               all, which is what light actually looks like. */
            const ox = TRAIN_X + 78, oy = RAIL_Y - 18;

            // The throw, down the track.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.translate(ox, oy);
            ctx.scale(1, 0.17);                    // flatten it along the track
            const g = ctx.createRadialGradient(340, 0, 10, 340, 0, 460);
            g.addColorStop(0,    'rgba(255,244,206,0.30)');
            g.addColorStop(0.35, 'rgba(255,238,190,0.10)');
            g.addColorStop(1,    'rgba(255,236,186,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(340, 0, 460, 0, 6.283); ctx.fill();
            ctx.restore();

            // The pool on the ballast right in front of her.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.translate(ox, RAIL_Y + 4);
            ctx.scale(1, 0.34);
            const p = ctx.createRadialGradient(120, 0, 6, 120, 0, 190);
            p.addColorStop(0, 'rgba(255,240,196,0.30)');
            p.addColorStop(1, 'rgba(255,240,196,0)');
            ctx.fillStyle = p;
            ctx.beginPath(); ctx.arc(120, 0, 190, 0, 6.283); ctx.fill();
            ctx.restore();
        }
    }

    // Vignette — always, gently. It focuses the eye on the road ahead.
    const vg = ctx.createRadialGradient(W * 0.46, H * 0.46, H * 0.42, W * 0.46, H * 0.46, H * 1.02);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${0.30 + 0.12 * (1 - sky.amb)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Speed streaks at the frame edge — subtle, only when moving properly.
    if (speed > 14) {
        const a = Math.min(0.16, (speed - 14) / 90);
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 14; i++) {
            const y = 40 + hash(i * 3.3) * (H - 80);
            const len = 60 + hash(i * 7.1) * 160;
            ctx.moveTo(0, y); ctx.lineTo(len, y);
            ctx.moveTo(W, y + 30); ctx.lineTo(W - len, y + 30);
        }
        ctx.stroke();
    }
}

function hexToRgba(hex, a) {
    const p = parseInt(hex.slice(1), 16);
    return `rgba(${p >> 16 & 255},${p >> 8 & 255},${p & 255},${a})`;
}
