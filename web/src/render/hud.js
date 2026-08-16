/* ── Instruments ──────────────────────────────────────────────────────────────
   Two jobs.

   The gauges are the driver's view: what the machine is doing right now, read
   without thinking. Analogue, because a needle moving is information and a
   number changing is not.

   The strip along the top is the control room: the whole section at once, every
   signal, every siding, and every train that is not yours. It is the thing you
   glance at to decide, three miles early, whether today is going to work. */

import { mph, stoppingDistance } from '../game/physics.js';
import { MILE } from '../data/routes.js';

const W = 1280, H = 720;
const MONO = 'ui-monospace, "DejaVu Sans Mono", monospace';

function panel(ctx, x, y, w, h, alpha = 0.72) {
    ctx.fillStyle = `rgba(9,11,13,${alpha})`;
    ctx.strokeStyle = 'rgba(120,128,136,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 3) : ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
}

function label(ctx, text, x, y, size = 8, color = '#8c8474', align = 'left') {
    ctx.font = `${size}px ${MONO}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
}

/* ── Analogue dial ───────────────────────────────────────────────────────── */
function dial(ctx, cx, cy, r, value, max, opts = {}) {
    const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
    const ang = v => A0 + (Math.max(0, Math.min(1, v / max))) * (A1 - A0);

    // Face
    ctx.fillStyle = 'rgba(14,16,19,0.92)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(150,158,166,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();

    // Redline / limit band
    if (opts.band) {
        ctx.strokeStyle = opts.bandColor || 'rgba(224,69,47,0.55)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 5, ang(opts.band[0]), ang(opts.band[1]));
        ctx.stroke();
    }

    // Ticks
    const majors = opts.majors ?? 6;
    for (let i = 0; i <= majors; i++) {
        const v = (i / majors) * max;
        const a = ang(v);
        const big = true;
        ctx.strokeStyle = 'rgba(200,206,212,0.55)';
        ctx.lineWidth = big ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
        ctx.lineTo(cx + Math.cos(a) * (r - 11), cy + Math.sin(a) * (r - 11));
        ctx.stroke();
        if (opts.numbers) {
            ctx.font = `7px ${MONO}`;
            ctx.fillStyle = 'rgba(190,196,202,0.7)';
            ctx.textAlign = 'center';
            ctx.fillText(String(Math.round(v)),
                cx + Math.cos(a) * (r - 19), cy + Math.sin(a) * (r - 19) + 2.5);
            ctx.textAlign = 'left';
        }
    }
    // Minor ticks
    for (let i = 0; i < majors * 2; i++) {
        const a = ang((i / (majors * 2)) * max);
        ctx.strokeStyle = 'rgba(160,166,172,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
        ctx.lineTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
        ctx.stroke();
    }

    // Limit needle (thin, amber) — what you are allowed, versus what you are doing
    if (opts.limit !== undefined && opts.limit < max) {
        const a = ang(opts.limit);
        ctx.strokeStyle = '#e8a838';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
        ctx.lineTo(cx + Math.cos(a) * (r - 15), cy + Math.sin(a) * (r - 15));
        ctx.stroke();
    }

    // Needle
    const a = ang(value);
    ctx.strokeStyle = opts.needle || '#e8e2d4';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * (r * 0.18), cy - Math.sin(a) * (r * 0.18));
    ctx.lineTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9));
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#3a4046';
    ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, 6.283); ctx.fill();

    if (opts.readout !== undefined) {
        ctx.font = `bold 15px ${MONO}`;
        ctx.fillStyle = opts.readoutColor || '#e8e2d4';
        ctx.textAlign = 'center';
        ctx.fillText(opts.readout, cx, cy + r * 0.58);
        ctx.textAlign = 'left';
    }
    if (opts.caption) label(ctx, opts.caption, cx, cy + r + 12, 8, '#8c8474', 'center');
}

/* ── Vertical bar gauge ──────────────────────────────────────────────────── */
function bar(ctx, x, y, w, h, frac, color, opts = {}) {
    ctx.fillStyle = 'rgba(12,14,17,0.9)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(140,148,156,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const fh = Math.max(0, Math.min(1, frac)) * (h - 4);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + h - 2 - fh, w - 4, fh);

    if (opts.mark !== undefined) {
        const my = y + h - 2 - opts.mark * (h - 4);
        ctx.strokeStyle = '#e0452f';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x - 2, my); ctx.lineTo(x + w + 2, my); ctx.stroke();
    }
    if (opts.caption) label(ctx, opts.caption, x + w / 2, y + h + 11, 7.5, '#8c8474', 'center');
}

/* ── Throttle ladder ─────────────────────────────────────────────────────── */
function ladder(ctx, x, y, loco, notch, isSteam) {
    const dbn = loco.dynamicBrake;
    const total = loco.notches + dbn + 1;
    const cellH = 13, cellW = 46;
    const h = total * cellH;

    panel(ctx, x - 6, y - 6, cellW + 12, h + 30, 0.66);

    for (let i = 0; i < total; i++) {
        // Top of the ladder is notch 8, bottom is full dynamic brake.
        const n = loco.notches - i;
        const cy = y + i * cellH;
        const on = n > 0 ? notch >= n : (n < 0 ? notch <= n : notch === 0);
        let col = 'rgba(40,45,50,0.9)';
        if (on) col = n > 0 ? (n >= 7 ? '#e0452f' : n >= 5 ? '#e8a838' : '#5fc27e')
                            : (n < 0 ? '#6fa8c8' : '#8c8474');
        ctx.fillStyle = col;
        ctx.fillRect(x, cy, cellW, cellH - 2.5);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeRect(x + 0.5, cy + 0.5, cellW - 1, cellH - 3.5);

        ctx.font = `bold 8px ${MONO}`;
        ctx.fillStyle = on ? 'rgba(10,12,14,0.9)' : 'rgba(160,166,172,0.6)';
        ctx.textAlign = 'center';
        const txt = n > 0 ? (isSteam ? `R${n}` : `N${n}`) : n === 0 ? 'IDLE' : `DB${-n}`;
        ctx.fillText(txt, x + cellW / 2, cy + cellH - 5);
        ctx.textAlign = 'left';
    }
    label(ctx, isSteam ? 'REGULATOR' : 'THROTTLE', x + cellW / 2, y + h + 12, 8, '#8c8474', 'center');
}

/* ── The dispatcher strip ────────────────────────────────────────────────── */
function dispatcherStrip(ctx, v) {
    const { route, train: t, consist, traffic, signalAspects, hazards, onSiding } = v;
    const X0 = 44, X1 = W - 44, Y = 34;
    const px = s => X0 + (s / route.length) * (X1 - X0);

    panel(ctx, 22, 8, W - 44, 58, 0.8);

    // The main line
    ctx.strokeStyle = 'rgba(150,158,166,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(X1, Y); ctx.stroke();

    // Sidings, drawn as a parallel stub
    for (const sd of route.sidings) {
        const a = px(sd.s0), b = px(sd.s1);
        ctx.strokeStyle = 'rgba(150,158,166,0.35)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a, Y); ctx.lineTo(a + 5, Y + 8);
        ctx.lineTo(b - 5, Y + 8); ctx.lineTo(b, Y);
        ctx.stroke();
    }

    // Speed restrictions, as a thin band above the line
    for (const l of route.limits) {
        if (l.v >= 20) continue;
        ctx.fillStyle = 'rgba(232,168,56,0.30)';
        ctx.fillRect(px(l.s0), Y - 10, Math.max(2, px(l.s1) - px(l.s0)), 2.5);
    }

    // Gradient profile, sketched under the line — the shape of the work ahead
    ctx.strokeStyle = 'rgba(111,168,200,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
        const s = (i / 120) * route.length;
        const g = route.gradeSmooth(s);
        const y = Y + 20 - g * 620;
        i === 0 ? ctx.moveTo(px(s), y) : ctx.lineTo(px(s), y);
    }
    ctx.stroke();

    // Signals
    for (const sg of route.signals) {
        const a = signalAspects.get(sg.name) || 'green';
        ctx.fillStyle = a === 'green' ? '#3ee07a' : a === 'yellow' ? '#f0b32e' : '#ff3a22';
        ctx.beginPath(); ctx.arc(px(sg.s), Y - 7, 2.6, 0, 6.283); ctx.fill();
    }

    // Crossings
    for (const cr of route.crossings) {
        const x = px(cr.s);
        ctx.strokeStyle = 'rgba(200,184,154,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, Y - 3); ctx.lineTo(x + 2.5, Y + 3);
        ctx.moveTo(x + 2.5, Y - 3); ctx.lineTo(x - 2.5, Y + 3);
        ctx.stroke();
    }

    // Hazards, but only once you have actually seen one. Marking a landslide on
    // the panel before the crew have laid eyes on it would give away the only
    // thing chapter seven is about.
    for (const hz of hazards) {
        if (hz.cleared || hz.type === 'crossing' || !hz.announced) continue;
        ctx.fillStyle = '#e0452f';
        ctx.beginPath();
        ctx.moveTo(px(hz.s), Y - 13); ctx.lineTo(px(hz.s) + 4, Y - 6); ctx.lineTo(px(hz.s) - 4, Y - 6);
        ctx.closePath(); ctx.fill();
    }

    // Stations
    for (const st of route.stations) {
        const x = px(st.s);
        ctx.fillStyle = 'rgba(216,205,184,0.85)';
        ctx.fillRect(x - 1, Y - 5, 2, 10);
        label(ctx, st.short, x, Y + 22, 7.5, 'rgba(216,205,184,0.7)', 'center');
    }

    // Where you would stop if you put the brake in now — the single most useful
    // thing a driver can see, and no real cab has it.
    const stopS = t.s + stoppingDistance(t.v, consist.brakeCap * 0.92, route.gradeSmooth(t.s));
    if (t.v > 1) {
        ctx.strokeStyle = 'rgba(232,168,56,0.75)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px(t.s), Y - 16); ctx.lineTo(px(Math.min(route.length, stopS)), Y - 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(232,168,56,0.9)';
        ctx.fillRect(px(Math.min(route.length, stopS)) - 1, Y - 20, 2, 8);
    }

    // Other people's trains
    for (const tr of traffic) {
        if (tr.done) continue;
        const x = px(Math.max(0, Math.min(route.length, tr.s)));
        ctx.fillStyle = tr.onSiding ? 'rgba(150,158,166,0.8)' : '#e0452f';
        ctx.beginPath();
        if (tr.dir < 0) { ctx.moveTo(x + 6, Y - 4); ctx.lineTo(x + 6, Y + 4); ctx.lineTo(x - 2, Y); }
        else            { ctx.moveTo(x - 6, Y - 4); ctx.lineTo(x - 6, Y + 4); ctx.lineTo(x + 2, Y); }
        ctx.closePath(); ctx.fill();
        label(ctx, tr.name, x, Y - 12, 7, tr.onSiding ? 'rgba(150,158,166,0.7)' : '#e0452f', 'center');
    }

    // You
    const mx = px(Math.max(0, Math.min(route.length, t.s)));
    ctx.fillStyle = '#d1a04a';
    ctx.beginPath();
    ctx.moveTo(mx - 7, Y - 6 + (onSiding ? 8 : 0));
    ctx.lineTo(mx - 7, Y + 6 + (onSiding ? 8 : 0));
    ctx.lineTo(mx + 4, Y + (onSiding ? 8 : 0));
    ctx.closePath(); ctx.fill();
    label(ctx, '9X', mx - 14, Y + 3 + (onSiding ? 8 : 0), 8, '#d1a04a', 'right');

    label(ctx, route.name.toUpperCase(), 30, 20, 8, 'rgba(140,132,116,0.85)');
    label(ctx, `MP ${route.mpAt(t.s).toFixed(1)}`, W - 30, 20, 8, 'rgba(140,132,116,0.85)', 'right');
}

/* ── Warnings ────────────────────────────────────────────────────────────── */
function warnings(ctx, v) {
    const items = v.warnings;
    let y = 84;
    for (const w of items.slice(0, 5)) {
        const col = w.level === 'danger' ? '#ff3a22' : w.level === 'caution' ? '#e8a838' : '#6fa8c8';
        ctx.font = `bold 11px ${MONO}`;
        const tw = ctx.measureText(w.text).width + 26;
        ctx.fillStyle = 'rgba(9,11,13,0.82)';
        ctx.fillRect(22, y, tw, 20);
        ctx.fillStyle = col;
        ctx.fillRect(22, y, 3, 20);
        // Danger warnings pulse, because you should not be able to ignore them.
        const pulse = w.level === 'danger'
            ? 0.65 + 0.35 * Math.abs(Math.sin(performance.now() / 170)) : 1;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = col;
        ctx.font = `bold 11px ${MONO}`;
        ctx.fillText(w.text, 33, y + 14);
        ctx.globalAlpha = 1;
        y += 24;
    }
}

/* ── Radio log ───────────────────────────────────────────────────────────── */
function radio(ctx, v) {
    const msgs = v.radioLog.slice(-3);
    if (!msgs.length) return;
    // Top right, under the strip: clear of the warnings on the left and of the
    // gauge clusters along the bottom.
    const w = 396, x = W - w - 22;
    let y = 78;
    panel(ctx, x, y, w, 126, 0.74);
    label(ctx, 'RADIO — CH 2', x + 12, y + 16, 8, '#8c8474');

    let ly = y + 34;
    for (const m of msgs) {
        const age = (performance.now() - m.at) / 1000;
        ctx.globalAlpha = Math.max(0.38, 1 - age / 26);
        ctx.font = `bold 9px ${MONO}`;
        ctx.fillStyle = m.who === 'radio' ? '#6fa8c8' : '#d1a04a';
        ctx.fillText(m.name.toUpperCase(), x + 12, ly);
        ctx.font = `10.5px ${MONO}`;
        ctx.fillStyle = '#bdb4a4';
        for (const line of wrap(ctx, m.text, w - 26)) {
            ly += 12;
            ctx.fillText(line, x + 12, ly);
        }
        ly += 16;
        ctx.globalAlpha = 1;
        if (ly > y + 118) break;
    }
}

function wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const out = [];
    let line = '';
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
        else line = test;
    }
    if (line) out.push(line);
    return out;
}

/* ── Main HUD ────────────────────────────────────────────────────────────── */
export function drawHUD(ctx, v) {
    const { train: t, consist, route, elapsed, schedule } = v;
    const loco = consist.loco;
    const isSteam = loco.kind === 'steam';

    dispatcherStrip(ctx, v);
    warnings(ctx, v);
    radio(ctx, v);

    /* ── Left cluster: speed ── */
    const cx = 108, cy = H - 108;
    panel(ctx, 22, H - 190, 176, 176, 0.7);
    // Round the scale up to a multiple of 20 so every major tick is a round ten.
    const vMax = Math.ceil(mph(loco.maxSpeed) / 20) * 20;
    dial(ctx, cx, cy, 62, mph(Math.abs(t.v)), vMax, {
        numbers: true, majors: vMax / 10,
        limit: mph(route.limitAt(t.s)),
        readout: `${Math.round(mph(Math.abs(t.v)))}`,
        readoutColor: mph(t.v) > mph(route.limitAt(t.s)) + 2 ? '#ff3a22' : '#e8e2d4',
        needle: t.v < -0.05 ? '#ff3a22' : '#e8e2d4',
        caption: 'MPH',
    });

    /* ── Right cluster: throttle ladder and the machine's condition ── */
    ladder(ctx, W - 96, H - 220, loco, t.notch, isSteam);

    const gx = W - 232, gy = H - 180;
    panel(ctx, gx - 14, gy - 14, 128, 172, 0.7);

    // Brake pipe
    bar(ctx, gx, gy, 22, 118, t.pipe,
        t.emergency ? '#ff3a22' : t.pipe > 0.05 ? '#e8a838' : '#3a4046',
        { caption: 'BRAKE' });

    // Heat, or boiler pressure — the machine's own opinion of what you are doing
    if (isSteam) {
        // The arrow is the whole skill: is the fire winning, or the regulator?
        const trend = t.steamTrend > 0.15 ? '\u25B2' : t.steamTrend < -0.15 ? '\u25BC' : '\u2014';
        bar(ctx, gx + 38, gy, 22, 118, t.steam / loco.steamMax,
            t.steam < 30 ? '#ff3a22' : t.steam < 55 ? '#e8a838' : '#6fa8c8',
            { caption: `STEAM ${trend}`, mark: 0.3 });
        label(ctx, `${Math.round(t.steam)}`, gx + 49, gy - 4, 8,
            t.steam < 30 ? '#ff3a22' : '#8c8474', 'center');
    } else {
        const frac = Math.max(0, Math.min(1, (t.heat - 20) / (loco.heatRedline + 18 - 20)));
        bar(ctx, gx + 38, gy, 22, 118, frac,
            t.heat > loco.heatRedline ? '#ff3a22' : t.heat > loco.heatRedline - 10 ? '#e8a838' : '#6fa8c8',
            { caption: 'WATER', mark: (loco.heatRedline - 20) / (loco.heatRedline + 18 - 20) });
        label(ctx, `${Math.round(t.heat)}°`, gx + 49, gy - 4, 8,
            t.heat > loco.heatRedline ? '#ff3a22' : '#8c8474', 'center');
    }

    // Shock — the cargo's opinion
    const shockCol = t.shock > 0.7 ? '#ff3a22' : t.shock > 0.45 ? '#e8a838' : '#5fc27e';
    bar(ctx, gx + 76, gy, 22, 118, t.shock, shockCol,
        { caption: 'SHOCK', mark: v.shockLimit ?? 0.7 });

    /* ── Centre bottom: the numbers you check between decisions ── */
    const bx = 214, by = H - 92;
    panel(ctx, bx, by, 296, 78, 0.7);

    const late = elapsed > schedule;
    label(ctx, 'ELAPSED', bx + 16, by + 18, 8, '#8c8474');
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = late ? '#e0452f' : '#e8e2d4';
    ctx.fillText(fmtTime(elapsed), bx + 16, by + 42);
    label(ctx, `SLOT ${fmtTime(schedule)}`, bx + 16, by + 58, 8, late ? '#e0452f' : '#8c8474');

    label(ctx, 'TO GO', bx + 128, by + 18, 8, '#8c8474');
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = '#e8e2d4';
    ctx.fillText(`${Math.max(0, (route.length - t.s) / MILE).toFixed(1)}`, bx + 128, by + 42);
    label(ctx, 'MILES', bx + 128, by + 58, 8, '#8c8474');

    label(ctx, 'GRADE', bx + 210, by + 18, 8, '#8c8474');
    const g = route.gradeSmooth(t.s) * 100;
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = g > 0.4 ? '#e8a838' : g < -0.4 ? '#6fa8c8' : '#e8e2d4';
    ctx.fillText(`${g >= 0 ? '+' : ''}${g.toFixed(2)}%`, bx + 210, by + 42);
    label(ctx, g > 0.4 ? 'CLIMBING' : g < -0.4 ? 'FALLING' : 'LEVEL', bx + 210, by + 58, 8, '#8c8474');

    /* ── Status flags ── */
    const flags = [];
    if (t.sanders)   flags.push(['SAND', '#e8a838']);
    if (t.wheelslip > 0.2) flags.push(['SLIP', '#ff3a22']);
    if (t.emergency) flags.push(['EMERGENCY', '#ff3a22']);
    if (t.derated)   flags.push(['DERATED', '#ff3a22']);
    if (v.onSiding)  flags.push(['IN SIDING', '#5fc27e']);
    if (v.headlight) flags.push(['HEADLIGHT', '#6fa8c8']);
    let fx = 214;
    for (const [txt, col] of flags) {
        ctx.font = `bold 9px ${MONO}`;
        const w = ctx.measureText(txt).width + 16;
        ctx.fillStyle = 'rgba(9,11,13,0.8)';
        ctx.fillRect(fx, H - 112, w, 16);
        ctx.fillStyle = col;
        ctx.fillRect(fx, H - 112, 2, 16);
        ctx.fillText(txt, fx + 9, H - 100);
        fx += w + 6;
    }

    /* ── Key hints, low-key, always available ── */
    label(ctx, v.hint || '', W / 2, H - 12, 9, 'rgba(140,132,116,0.75)', 'center');
}

export function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
