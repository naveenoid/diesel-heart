/* ── Rolling stock ────────────────────────────────────────────────────────────
   Side elevation, drawn to the track so everything tilts with the grade and
   leans through the slack. Wheels turn at the right rate for the speed, and the
   Swiss tank engine gets connecting rods, because a side view without rods is
   a wasted side view. */

import { PPM, trackPoint, roundRect } from './world.js';

const SCALE = PPM;                    // metres → pixels, same as the world

/* ── Small helpers ───────────────────────────────────────────────────────── */

function shadeFn(amb) {
    return (hex, mul = 1) => {
        const p = parseInt(hex.slice(1), 16);
        const r = Math.min(255, (p >> 16 & 255) * amb * mul);
        const g = Math.min(255, (p >> 8 & 255) * amb * mul);
        const b = Math.min(255, (p & 255) * amb * mul);
        return `rgb(${r | 0},${g | 0},${b | 0})`;
    };
}

function wheel(ctx, x, y, r, phase, sh, spokes = 0) {
    ctx.fillStyle = sh('#1a1c1f');
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = sh('#575c62');
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, r - 1.4, 0, 6.283); ctx.stroke();

    if (spokes) {
        ctx.strokeStyle = sh('#3c4045');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < spokes; i++) {
            const a = phase + (i / spokes) * 6.283;
            ctx.moveTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2);
            ctx.lineTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
        }
        ctx.stroke();
        ctx.fillStyle = sh('#6a7076');
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
    } else {
        // Counterweight-ish mark so plain wheels still read as rotating
        ctx.fillStyle = sh('#4a4f55');
        ctx.beginPath();
        ctx.arc(x + Math.cos(phase) * r * 0.5, y + Math.sin(phase) * r * 0.5, 1.6, 0, 6.283);
        ctx.fill();
    }
}

function truck(ctx, x, y, phase, sh, w = 22) {
    ctx.fillStyle = sh('#232629');
    ctx.fillRect(x - w / 2, y - 9, w, 7);
    wheel(ctx, x - w / 2 + 4.5, y - 1, 4.6, phase, sh);
    wheel(ctx, x + w / 2 - 4.5, y - 1, 4.6, phase, sh);
}

function shadow(ctx, halfLen, amb) {
    ctx.fillStyle = `rgba(0,0,0,${0.30 * amb + 0.12})`;
    ctx.beginPath();
    ctx.ellipse(0, 3, halfLen * 0.94, 4.5, 0, 0, 6.283);
    ctx.fill();
}

/* ── Locomotives ─────────────────────────────────────────────────────────── */

function drawWDM2(ctx, L, o) {
    const sh = shadeFn(o.amb), lv = o.livery;
    const h = 30, y0 = -12;
    shadow(ctx, L / 2, o.amb);

    // Frame and fuel tank slung underneath
    ctx.fillStyle = sh(lv.frame);
    ctx.fillRect(-L / 2, y0 + h - 4, L, 6);
    ctx.fillStyle = sh('#2b2f34');
    roundRect(ctx, -L * 0.20, y0 + h + 1, L * 0.42, 8, 2); ctx.fill();

    // Long hood (the business end faces forward, +x)
    ctx.fillStyle = sh(lv.body);
    roundRect(ctx, -L / 2 + 4, y0, L * 0.70, h, 2.5); ctx.fill();
    // Radiator flare at the far end
    ctx.fillStyle = sh(lv.body, 0.86);
    roundRect(ctx, -L / 2 + 2, y0 + 2, 12, h - 8, 2); ctx.fill();
    ctx.strokeStyle = sh('#0f1114');
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-L / 2 + 3, y0 + 5 + i * 3.4);
        ctx.lineTo(-L / 2 + 13, y0 + 5 + i * 3.4);
        ctx.stroke();
    }

    // Cab, set back from the short nose
    const cabX = L * 0.20;
    ctx.fillStyle = sh(lv.body, 1.06);
    roundRect(ctx, cabX, y0 - 7, L * 0.20, h + 7, 2.5); ctx.fill();
    ctx.fillStyle = sh(lv.roof);
    roundRect(ctx, cabX - 1, y0 - 9, L * 0.20 + 2, 4, 2); ctx.fill();

    // Windows — lit from inside at night, which is most of this railway's life
    ctx.fillStyle = o.night ? '#f2c169' : sh('#9dc3d6');
    ctx.fillRect(cabX + 3, y0 - 4, L * 0.075, 9);
    ctx.fillRect(cabX + L * 0.115, y0 - 4, L * 0.07, 9);
    ctx.strokeStyle = sh('#0f1114'); ctx.lineWidth = 0.8;
    ctx.strokeRect(cabX + 3, y0 - 4, L * 0.075, 9);

    // Short nose
    ctx.fillStyle = sh(lv.body, 0.94);
    roundRect(ctx, cabX + L * 0.20, y0 + 5, L * 0.09, h - 5, 2); ctx.fill();

    // Gold band, the one bit of pride on the whole machine
    ctx.fillStyle = sh(lv.stripe);
    ctx.fillRect(-L / 2 + 4, y0 + h - 11, L * 0.70, 2.6);
    ctx.fillRect(cabX, y0 + h - 11, L * 0.29, 2.6);

    // Exhaust stack and horn
    ctx.fillStyle = sh('#2a2d31');
    ctx.fillRect(-L * 0.10, y0 - 5, 6, 6);
    ctx.fillRect(cabX - 6, y0 - 11, 3, 3);

    // Headlight
    const nx = L / 2 - 2;
    ctx.fillStyle = o.headlight ? '#fff6cf' : sh('#8e8e8e');
    ctx.beginPath(); ctx.arc(nx - 3, y0 + 11, 3, 0, 6.283); ctx.fill();
    if (o.headlight) {
        const g = ctx.createRadialGradient(nx - 3, y0 + 11, 1, nx - 3, y0 + 11, 26);
        g.addColorStop(0, 'rgba(255,246,207,0.75)');
        g.addColorStop(1, 'rgba(255,246,207,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nx - 3, y0 + 11, 26, 0, 6.283); ctx.fill();
    }

    // Number board
    ctx.fillStyle = sh('#101214');
    ctx.fillRect(cabX + L * 0.205, y0 + 1, 13, 7);
    ctx.fillStyle = o.night ? '#ffe9a8' : sh('#ded4bd');
    ctx.font = 'bold 6px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('17', cabX + L * 0.205 + 6.5, y0 + 6.6);
    ctx.textAlign = 'left';

    // Bogies — three axles each, because she is a Co-Co and it shows
    ctx.fillStyle = sh('#212427');
    ctx.fillRect(-L * 0.40, y0 + h + 1, L * 0.26, 8);
    ctx.fillRect(L * 0.14, y0 + h + 1, L * 0.26, 8);
    for (const bx of [-L * 0.27, L * 0.27]) {
        for (let i = -1; i <= 1; i++) wheel(ctx, bx + i * 9.4, y0 + h + 10, 5.4, o.phase, sh);
    }
}

function drawRS3(ctx, L, o) {
    const sh = shadeFn(o.amb), lv = o.livery;
    const h = 26, y0 = -8;
    shadow(ctx, L / 2, o.amb);

    ctx.fillStyle = sh(lv.frame);
    ctx.fillRect(-L / 2, y0 + h - 3, L, 5);

    // Road switcher: hood, cab, hood
    ctx.fillStyle = sh(lv.body);
    roundRect(ctx, -L / 2 + 3, y0 + 4, L * 0.36, h - 4, 2); ctx.fill();
    roundRect(ctx, L * 0.16, y0 + 4, L * 0.32, h - 4, 2); ctx.fill();

    const cabX = -L * 0.13;
    ctx.fillStyle = sh(lv.body, 1.08);
    roundRect(ctx, cabX, y0 - 6, L * 0.29, h + 6, 2); ctx.fill();
    ctx.fillStyle = sh(lv.roof);
    roundRect(ctx, cabX - 1, y0 - 8, L * 0.29 + 2, 4, 2); ctx.fill();
    ctx.fillStyle = o.night ? '#f2c169' : sh('#9dc3d6');
    ctx.fillRect(cabX + 4, y0 - 3, L * 0.09, 8);
    ctx.fillRect(cabX + L * 0.16, y0 - 3, L * 0.09, 8);

    ctx.fillStyle = sh(lv.stripe);
    ctx.fillRect(-L / 2 + 3, y0 + h - 9, L - 6, 1.8);

    ctx.fillStyle = sh('#2a2d31');
    ctx.fillRect(L * 0.30, y0 - 1, 6, 6);

    const nx = L / 2 - 3;
    ctx.fillStyle = o.headlight ? '#fff6cf' : sh('#8e8e8e');
    ctx.beginPath(); ctx.arc(nx, y0 + 9, 2.8, 0, 6.283); ctx.fill();

    ctx.fillStyle = sh('#212427');
    ctx.fillRect(-L * 0.40, y0 + h + 1, L * 0.24, 7);
    ctx.fillRect(L * 0.16, y0 + h + 1, L * 0.24, 7);
    for (const bx of [-L * 0.28, L * 0.28]) {
        wheel(ctx, bx - 7, y0 + h + 9, 5, o.phase, sh);
        wheel(ctx, bx + 7, y0 + h + 9, 5, o.phase, sh);
    }
}

function drawSW1500(ctx, L, o) {
    const sh = shadeFn(o.amb), lv = o.livery;
    const h = 24, y0 = -6;
    shadow(ctx, L / 2, o.amb);

    ctx.fillStyle = sh(lv.frame);
    ctx.fillRect(-L / 2, y0 + h - 3, L, 5);

    // Cab at the back, low hood forward — the switcher silhouette
    ctx.fillStyle = sh(lv.body);
    roundRect(ctx, -L * 0.12, y0 + 6, L * 0.60, h - 6, 2); ctx.fill();
    ctx.fillStyle = sh(lv.body, 1.08);
    roundRect(ctx, -L / 2 + 3, y0 - 8, L * 0.36, h + 8, 2); ctx.fill();
    ctx.fillStyle = sh(lv.roof);
    roundRect(ctx, -L / 2 + 2, y0 - 10, L * 0.36 + 2, 4, 2); ctx.fill();
    ctx.fillStyle = o.night ? '#f2c169' : sh('#9dc3d6');
    ctx.fillRect(-L / 2 + 7, y0 - 5, L * 0.11, 9);
    ctx.fillRect(-L / 2 + 7 + L * 0.15, y0 - 5, L * 0.11, 9);

    ctx.fillStyle = sh(lv.stripe);
    ctx.fillRect(-L / 2 + 3, y0 + h - 8, L - 6, 1.8);

    ctx.fillStyle = sh('#2a2d31');
    ctx.fillRect(L * 0.16, y0 + 1, 6, 6);

    ctx.fillStyle = o.headlight ? '#fff6cf' : sh('#8e8e8e');
    ctx.beginPath(); ctx.arc(L / 2 - 4, y0 + 11, 2.6, 0, 6.283); ctx.fill();

    ctx.fillStyle = sh('#212427');
    ctx.fillRect(-L * 0.36, y0 + h + 1, L * 0.22, 7);
    ctx.fillRect(L * 0.14, y0 + h + 1, L * 0.22, 7);
    for (const bx of [-L * 0.25, L * 0.25]) {
        wheel(ctx, bx - 6, y0 + h + 9, 4.8, o.phase, sh);
        wheel(ctx, bx + 6, y0 + h + 9, 4.8, o.phase, sh);
    }
}

function drawE33(ctx, L, o) {
    const sh = shadeFn(o.amb), lv = o.livery;
    const y0 = -4;
    shadow(ctx, L / 2, o.amb);

    // Running plate
    ctx.fillStyle = sh('#1c1f22');
    ctx.fillRect(-L / 2, y0 + 16, L, 3);

    // Boiler
    ctx.fillStyle = sh(lv.body);
    roundRect(ctx, -L * 0.14, y0 - 4, L * 0.60, 17, 6); ctx.fill();
    // Smokebox — always a shade blacker than the boiler
    ctx.fillStyle = sh('#15181a');
    roundRect(ctx, L * 0.36, y0 - 5, L * 0.12, 19, 4); ctx.fill();

    // Side tanks
    ctx.fillStyle = sh(lv.body, 1.1);
    roundRect(ctx, -L * 0.10, y0 + 1, L * 0.42, 14, 2); ctx.fill();
    ctx.fillStyle = sh(lv.stripe);
    ctx.fillRect(-L * 0.08, y0 + 4, L * 0.38, 1.6);

    // Chimney, dome, safety valve
    ctx.fillStyle = sh('#15181a');
    ctx.fillRect(L * 0.395, y0 - 15, 7, 12);
    roundRect(ctx, L * 0.38, y0 - 17, 11, 4, 1.5); ctx.fill();
    ctx.fillStyle = sh('#3d4b45');
    roundRect(ctx, L * 0.12, y0 - 10, 10, 7, 3); ctx.fill();
    ctx.fillStyle = sh('#8a7a3c');
    ctx.fillRect(L * 0.02, y0 - 8, 4, 5);

    // Cab
    ctx.fillStyle = sh(lv.body, 1.05);
    roundRect(ctx, -L * 0.42, y0 - 14, L * 0.30, 30, 2); ctx.fill();
    ctx.fillStyle = sh(lv.roof);
    roundRect(ctx, -L * 0.45, y0 - 17, L * 0.36, 5, 2); ctx.fill();
    // The firebox glow is the best thing about a steam engine at night
    ctx.fillStyle = o.night ? '#ffb457' : sh('#93b8c9');
    ctx.fillRect(-L * 0.38, y0 - 10, L * 0.10, 9);
    if (o.night || o.fire) {
        const g = ctx.createRadialGradient(-L * 0.30, y0 + 10, 1, -L * 0.30, y0 + 10, 22);
        g.addColorStop(0, 'rgba(255,138,44,0.55)');
        g.addColorStop(1, 'rgba(255,138,44,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(-L * 0.30, y0 + 10, 22, 0, 6.283); ctx.fill();
    }

    // Buffer beam
    ctx.fillStyle = sh('#8f2f28');
    ctx.fillRect(L / 2 - 4, y0 + 6, 4, 12);

    ctx.fillStyle = o.headlight ? '#fff6cf' : sh('#b9a97f');
    ctx.beginPath(); ctx.arc(L * 0.455, y0 + 3, 3, 0, 6.283); ctx.fill();

    /* ── Three coupled driving wheels, with the rods that make them a team ── */
    const wy = y0 + 22, wr = 9.2;
    const dx = [-L * 0.22, 0, L * 0.22];
    for (const x of dx) wheel(ctx, x, wy, wr, o.phase, sh, 10);

    // Crank pins ride the wheel rim; the coupling rod joins all three.
    const cr = wr * 0.55;
    const px = Math.cos(o.phase) * cr, py = Math.sin(o.phase) * cr;
    ctx.strokeStyle = sh('#9aa0a6');
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(dx[0] + px, wy + py);
    ctx.lineTo(dx[1] + px, wy + py);
    ctx.lineTo(dx[2] + px, wy + py);
    ctx.stroke();

    // Connecting rod back from the crosshead
    const chX = L * 0.34, chY = wy - 5;
    ctx.strokeStyle = sh('#b0b6bc');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx[2] + px, wy + py);
    ctx.lineTo(chX, chY);
    ctx.stroke();
    // Cylinder
    ctx.fillStyle = sh('#2a2f33');
    roundRect(ctx, chX - 2, chY - 6, L * 0.12, 12, 2); ctx.fill();

    ctx.fillStyle = sh('#6f767c');
    for (const x of dx) { ctx.beginPath(); ctx.arc(x + px, wy + py, 1.9, 0, 6.283); ctx.fill(); }
}

/* ── Freight and passenger cars ──────────────────────────────────────────── */

function drawCar(ctx, kind, L, o) {
    const sh = shadeFn(o.amb);
    shadow(ctx, L / 2, o.amb);
    const y0 = -6;

    const deck = () => {
        ctx.fillStyle = sh('#22262a');
        ctx.fillRect(-L / 2, y0 + 20, L, 4);
    };
    const bogies = () => {
        truck(ctx, -L * 0.30, y0 + 32, o.phase, sh);
        truck(ctx, L * 0.30, y0 + 32, o.phase, sh);
    };

    switch (kind) {
        case 'boxcar':
            deck();
            ctx.fillStyle = sh('#8b5a34');
            roundRect(ctx, -L / 2 + 1, y0 - 8, L - 2, 28, 1.5); ctx.fill();
            ctx.fillStyle = sh('#6d4527');
            ctx.fillRect(-L * 0.09, y0 - 6, L * 0.18, 24);
            ctx.strokeStyle = sh('#4a2e1a'); ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(-L / 2 + 2, y0 - 2); ctx.lineTo(L / 2 - 2, y0 - 2); ctx.stroke();
            ctx.fillStyle = sh('#c8b89a');
            ctx.font = '5px ui-monospace, monospace';
            ctx.fillText('SVRY', -L / 2 + 5, y0 + 14);
            break;

        case 'reefer':
            deck();
            ctx.fillStyle = sh('#d8d2c4');
            roundRect(ctx, -L / 2 + 1, y0 - 8, L - 2, 28, 1.5); ctx.fill();
            ctx.fillStyle = sh('#4a6f86');
            ctx.fillRect(-L / 2 + 3, y0 - 6, 8, 10);
            ctx.fillStyle = sh('#9c968a');
            ctx.fillRect(-L * 0.07, y0 - 6, L * 0.14, 24);
            break;

        case 'hopper':
            deck();
            ctx.fillStyle = sh('#4f4034');
            ctx.beginPath();
            ctx.moveTo(-L / 2 + 1, y0 - 6);
            ctx.lineTo(L / 2 - 1, y0 - 6);
            ctx.lineTo(L / 2 - 6, y0 + 20);
            ctx.lineTo(-L / 2 + 6, y0 + 20);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = sh('#332a22');
            ctx.fillRect(-L / 2 + 1, y0 - 8, L - 2, 3);
            ctx.strokeStyle = sh('#3a3028'); ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const x = -L / 2 + (L / 4) * i;
                ctx.beginPath(); ctx.moveTo(x, y0 - 6); ctx.lineTo(x, y0 + 20); ctx.stroke();
            }
            break;

        case 'gondola':
            deck();
            ctx.fillStyle = sh('#57493c');
            ctx.fillRect(-L / 2 + 1, y0 + 2, L - 2, 18);
            ctx.fillStyle = sh('#6b5b4a');
            ctx.fillRect(-L / 2 + 1, y0, L - 2, 3);
            // Scrap poking above the sides
            ctx.fillStyle = sh('#7d7169');
            for (let i = 0; i < 6; i++) {
                const x = -L / 2 + 5 + i * (L - 10) / 6;
                ctx.fillRect(x, y0 - 3 - (i % 3) * 2, 4, 6);
            }
            break;

        case 'tank':
            deck();
            ctx.fillStyle = sh('#5a6066');
            roundRect(ctx, -L / 2 + 2, y0 - 2, L - 4, 20, 9); ctx.fill();
            ctx.fillStyle = sh('#6d747a');
            roundRect(ctx, -L / 2 + 4, y0, L - 8, 6, 3); ctx.fill();
            ctx.fillStyle = sh('#3d4348');
            ctx.fillRect(-3, y0 - 7, 6, 6);
            ctx.strokeStyle = sh('#3d4348'); ctx.lineWidth = 1.2;
            for (const x of [-L * 0.22, L * 0.22]) {
                ctx.beginPath(); ctx.moveTo(x, y0 - 2); ctx.lineTo(x, y0 + 18); ctx.stroke();
            }
            break;

        case 'flat':
            deck();
            ctx.fillStyle = sh('#4a4238');
            ctx.fillRect(-L / 2 + 1, y0 + 14, L - 2, 7);
            // Lumber load
            ctx.fillStyle = sh('#a5834f');
            ctx.fillRect(-L * 0.36, y0 + 4, L * 0.72, 10);
            ctx.strokeStyle = sh('#7d6339'); ctx.lineWidth = 0.7;
            for (let i = 0; i < 5; i++) {
                const yy = y0 + 5.5 + i * 2;
                ctx.beginPath(); ctx.moveTo(-L * 0.36, yy); ctx.lineTo(L * 0.36, yy); ctx.stroke();
            }
            break;

        case 'cryo': {
            deck();
            ctx.fillStyle = sh('#3a4148');
            ctx.fillRect(-L / 2 + 1, y0 + 14, L - 2, 7);
            // Two dewars in a cradle, wrapped and strapped
            for (const cx of [-L * 0.19, L * 0.19]) {
                ctx.fillStyle = sh('#c6cdd3');
                roundRect(ctx, cx - L * 0.13, y0 - 4, L * 0.26, 19, 8); ctx.fill();
                ctx.fillStyle = sh('#8e979f');
                roundRect(ctx, cx - L * 0.13, y0 + 4, L * 0.26, 4, 2); ctx.fill();
                ctx.fillStyle = sh('#2e353b');
                ctx.fillRect(cx - 1.5, y0 - 8, 3, 5);
            }
            // Shock logger, blinking away
            ctx.fillStyle = o.shockAlarm ? '#ff4a2e'
                          : (Math.floor(performance.now() / 900) % 2 ? sh('#4ad07a') : sh('#2a6e46'));
            ctx.fillRect(-2, y0 + 16, 4, 4);
            ctx.fillStyle = sh('#d8cdb8');
            ctx.font = '4.5px ui-monospace, monospace';
            ctx.fillText('PEREGRINE', -L / 2 + 4, y0 + 20);
            break;
        }

        case 'medical':
            deck();
            ctx.fillStyle = sh('#e4e0d4');
            roundRect(ctx, -L / 2 + 1, y0 - 8, L - 2, 28, 1.5); ctx.fill();
            ctx.fillStyle = '#c4392c';
            ctx.fillRect(-2.5, y0 - 1, 5, 15);
            ctx.fillRect(-7.5, y0 + 4, 15, 5);
            ctx.fillStyle = o.night ? '#fff0c4' : sh('#9dc3d6');
            ctx.fillRect(-L / 2 + 4, y0 - 5, 9, 8);
            ctx.fillRect(L / 2 - 13, y0 - 5, 9, 8);
            break;

        case 'coach':
        case 'combine': {
            deck();
            ctx.fillStyle = sh('#2f4f6b');
            roundRect(ctx, -L / 2 + 1, y0 - 10, L - 2, 30, 2.5); ctx.fill();
            ctx.fillStyle = sh('#23415a');
            roundRect(ctx, -L / 2 + 1, y0 - 12, L - 2, 5, 2.5); ctx.fill();
            ctx.fillStyle = sh('#c8a44a');
            ctx.fillRect(-L / 2 + 2, y0 + 12, L - 4, 1.6);

            const winStart = kind === 'combine' ? -L * 0.06 : -L / 2 + 5;
            const winEnd = L / 2 - 5;
            ctx.fillStyle = o.night ? '#ffe4a2' : sh('#a9cfe0');
            for (let x = winStart; x < winEnd - 4; x += 8.5) {
                ctx.fillRect(x, y0 - 6, 5.5, 9);
            }
            if (kind === 'combine') {
                // Baggage half — a sliding door and no windows
                ctx.fillStyle = sh('#26445d');
                ctx.fillRect(-L / 2 + 3, y0 - 7, L * 0.40, 18);
                ctx.fillStyle = sh('#1c3446');
                ctx.fillRect(-L * 0.26, y0 - 6, L * 0.11, 16);
            }
            if (o.night) {
                const g = ctx.createRadialGradient(0, y0 + 2, 4, 0, y0 + 2, L * 0.7);
                g.addColorStop(0, 'rgba(255,214,140,0.16)');
                g.addColorStop(1, 'rgba(255,214,140,0)');
                ctx.fillStyle = g;
                ctx.fillRect(-L, y0 - 40, L * 2, 90);
            }
            break;
        }

        case 'caboose':
            deck();
            ctx.fillStyle = sh('#9c3a2c');
            roundRect(ctx, -L / 2 + 1, y0 - 6, L - 2, 26, 2); ctx.fill();
            // Cupola — the whole point of a caboose
            ctx.fillStyle = sh('#8a3226');
            roundRect(ctx, -L * 0.14, y0 - 17, L * 0.28, 12, 2); ctx.fill();
            ctx.fillStyle = o.night ? '#ffe4a2' : sh('#a9cfe0');
            ctx.fillRect(-L * 0.11, y0 - 14, L * 0.09, 6);
            ctx.fillRect(L * 0.02, y0 - 14, L * 0.09, 6);
            ctx.fillRect(-L / 2 + 4, y0 - 2, 7, 8);
            ctx.fillRect(L / 2 - 11, y0 - 2, 7, 8);
            // Marker lamp on the rear
            ctx.fillStyle = '#e0452f';
            ctx.beginPath(); ctx.arc(-L / 2 + 2, y0 + 4, 2.2, 0, 6.283); ctx.fill();
            if (o.night) {
                const g = ctx.createRadialGradient(-L / 2 + 2, y0 + 4, 1, -L / 2 + 2, y0 + 4, 18);
                g.addColorStop(0, 'rgba(224,69,47,0.6)');
                g.addColorStop(1, 'rgba(224,69,47,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(-L / 2 + 2, y0 + 4, 18, 0, 6.283); ctx.fill();
            }
            break;

        default:
            deck();
            ctx.fillStyle = sh('#6b6257');
            roundRect(ctx, -L / 2 + 1, y0 - 6, L - 2, 26, 2); ctx.fill();
    }

    bogies();
}

const LOCO_DRAW = { wdm2: drawWDM2, rs3: drawRS3, sw1500: drawSW1500, e33: drawE33 };

/* ── Placing a vehicle on the track ──────────────────────────────────────── */

function placeAndDraw(ctx, route, camS, centreS, lengthM, yOff, fn, o) {
    const half = lengthM / 2;
    const a = trackPoint(route, centreS - half, camS);
    const b = trackPoint(route, centreS + half, camS);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + yOff;
    if (cx < -260 || cx > 1540) return;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    fn(ctx, lengthM * SCALE, o);
    ctx.restore();
}

/**
 * Draw the player's train: locomotive at `t.s`, cars trailing behind, each
 * nudged by the slack so the consist visibly stretches and bunches.
 */
export function drawPlayerTrain(ctx, v) {
    const { route, camS, train: t, consist, sky, onSiding, headlight, shockAlarm } = v;
    const yOff = onSiding ? 26 : 0;
    const o = {
        amb: Math.max(0.35, sky.amb),
        night: sky.night,
        livery: consist.loco.livery,
        phase: t.wheelPhase,
        headlight,
        shockAlarm,
        fire: consist.loco.kind === 'steam',
    };

    const locoLen = 20;
    placeAndDraw(ctx, route, camS, t.s - locoLen / 2, locoLen,
        yOff, LOCO_DRAW[consist.loco.id] || drawWDM2, o);

    let back = t.s - locoLen;
    for (let i = 0; i < consist.cars.length; i++) {
        const c = consist.cars[i];
        // Slack accumulates down the train: the caboose feels it most.
        const give = t.slack * 0.42 * ((i + 1) / consist.cars.length);
        back -= 0.9 + give * 0.5;
        placeAndDraw(ctx, route, camS, back - c.len / 2, c.len, yOff,
            (cx, L, oo) => drawCar(cx, c.id, L, oo), o);
        back -= c.len;
    }
}

/** Continental Pacific stock — grey and red, and never in a hurry to help. */
export function drawTrafficTrain(ctx, v, tr) {
    const { route, camS, sky } = v;
    const o = {
        amb: Math.max(0.35, sky.amb),
        night: sky.night,
        livery: tr.kind === 'express'
            ? { body:'#7a2f2a', roof:'#5c231f', stripe:'#d8cdb8', frame:'#1e2126' }
            : { body:'#4e545a', roof:'#3b4046', stripe:'#c9a44a', frame:'#1e2126' },
        phase: tr.phase || 0,
        headlight: true,
    };
    const yOff = tr.onSiding ? 26 : 0;
    const dir = tr.dir;

    // Opposing trains face the other way, so mirror the whole vehicle.
    const mirror = dir < 0;
    const drawMirrored = (fn) => (cx, L, oo) => {
        if (!mirror) return fn(cx, L, oo);
        cx.save(); cx.scale(-1, 1); fn(cx, L, oo); cx.restore();
    };

    const locoLen = 19;
    placeAndDraw(ctx, route, camS, tr.s + (mirror ? -locoLen / 2 : locoLen / 2), locoLen, yOff,
        drawMirrored(tr.kind === 'express' ? drawSW1500 : drawRS3), o);

    const carKind = tr.kind === 'express' ? 'coach' : (tr.kind === 'freight' ? 'hopper' : 'boxcar');
    let edge = tr.s + (mirror ? -locoLen : locoLen);
    for (let i = 0; i < (tr.cars || 6); i++) {
        const len = 15;
        const centre = mirror ? edge + len / 2 : edge - len / 2;
        placeAndDraw(ctx, route, camS, centre, len, yOff,
            drawMirrored((cx, L, oo) => drawCar(cx, i % 3 === 0 && tr.kind === 'freight' ? 'boxcar' : carKind, L, oo)), o);
        edge += mirror ? len : -len;
    }
}

/* ── Exhaust, steam and spark particles ──────────────────────────────────── */

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
                r: kind === 'steam' ? 5 + Math.random() * 5 : 3.4 + Math.random() * 4.5,
                life: 0,
                max: kind === 'steam' ? 1.5 + Math.random() * 1.1 : 2.1 + Math.random() * 1.5,
                kind,
                soot: kind === 'diesel' ? Math.min(1, power * 1.25 + Math.random() * 0.2) : 0,
            });
        }
        if (this.p.length > 320) this.p.splice(0, this.p.length - 320);
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

    update(dt) {
        for (const q of this.p) {
            q.life += dt;
            q.x += q.vx * dt;
            q.y += q.vy * dt;
            if (q.kind === 'spark') { q.vy += 220 * dt; q.vx *= 0.97; }
            else { q.vy += 7 * dt; q.vx *= 0.985; q.r += dt * (q.kind === 'steam' ? 15 : 10); }
        }
        this.p = this.p.filter(q => q.life < q.max && q.x > -200);
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
                // Fresh exhaust from a hard-working Alco is black; it greys as it goes.
                const g = (46 + t * 96) * amb + 14;
                ctx.fillStyle = `rgba(${g | 0},${g | 0},${g * 0.98 | 0},${a * (0.45 + q.soot * 0.55)})`;
            }
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r, 0, 6.283);
            ctx.fill();
        }
    }
}

/** Where the stack is, in screen space, so the plume comes out of the chimney. */
export function stackPoint(route, t, camS, kind, onSiding) {
    const locoLen = 20;
    const centre = t.s - locoLen / 2;
    const a = trackPoint(route, centre - locoLen / 2, camS);
    const b = trackPoint(route, centre + locoLen / 2, camS);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + (onSiding ? 26 : 0);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    // Local offset of the stack, rotated into world space
    const lx = kind === 'steam' ? locoLen * SCALE * 0.40 : -locoLen * SCALE * 0.10;
    const ly = kind === 'steam' ? -33 : -20;
    return {
        x: cx + lx * Math.cos(ang) - ly * Math.sin(ang),
        y: cy + lx * Math.sin(ang) + ly * Math.cos(ang),
    };
}
