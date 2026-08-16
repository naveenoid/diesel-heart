/* ── Screens ──────────────────────────────────────────────────────────────────
   Title, chapter card, briefing, debrief, epilogue. The canvas keeps drawing
   underneath most of these, because a still of the valley is a better backdrop
   than a flat colour. */

import { buildRoute, routeClimb, MILE } from '../data/routes.js';
import { LOCOS, CARS } from '../data/roster.js';
import { buildConsist, makeTrainState } from '../game/physics.js';
import { drawWorld, drawAtmosphere, skyFor, Weather } from '../render/world.js';
import { drawPlayerTrain, Plume, stackPoint } from '../render/trains.js';
import { fmtTime } from '../render/hud.js';
import { show, prompt, esc, money, condBar, clearOverlay } from './ui.js';
import { sound } from '../audio.js';

const W = 1280, H = 720;

/* ── An idling locomotive outside the shed, which is the whole game in one
      picture: nothing happening, engine running, waiting to be needed. ── */
export class IdleScene {
    constructor(opts = {}) {
        this.route = buildRoute('marrow', 'tannery');
        this.locoId = opts.loco || 'wdm2';
        const loco = LOCOS[this.locoId];
        this.consist = buildConsist(loco, { cond:{prime:100,traction:100,brakes:100,cooling:100}, bodges:{} },
            (opts.cars || ['combine', 'caboose']).map(c => CARS[c]));
        this.train = makeTrainState(this.consist);
        this.train.s = 70;
        this.train.power = 0.06;
        this.hour = opts.hour ?? 4.3;
        this.sky = skyFor(this.hour);
        this.weatherKind = opts.weather || 'clear';
        this.weather = new Weather(this.weatherKind);
        this.plume = new Plume();
        this.camS = 70;
        this.t = 0;
        this.title = opts.title || null;
    }

    start() {
        sound.init(); sound.resume();
        sound.setWeather(this.weatherKind);
        sound.setEngine({ on: true, kind: this.consist.loco.kind,
                          thump: this.consist.loco.idleThump, power: 0.03, speed: 0, brake: 1 });
    }
    stop() { sound.setEngine({ on: false }); sound.setWeather('clear'); }
    keydown() {}

    update(dt) {
        this.t += dt;
        // She breathes a little at idle, which is the point.
        this.train.wheelPhase += Math.sin(this.t * 1.4) * dt * 0.05;
        const sp = stackPoint(this.route, this.train, this.camS, this.consist.loco.kind, false);
        if (Math.random() < dt * 5) this.plume.emit(sp.x, sp.y, this.consist.loco.kind === 'steam' ? 'steam' : 'diesel', 0.09, 0);
        this.plume.update(dt);
        this.weather.update(dt, 0);
    }

    draw(ctx) {
        const view = {
            route: this.route, camS: this.camS, sky: this.sky, hour: this.hour,
            weather: this.weatherKind, signalAspects: new Map(), hazards: [],
            lined: null, onSiding: false, train: this.train, consist: this.consist,
            headlight: this.sky.night, speed: 0,
        };
        drawWorld(ctx, view);
        drawPlayerTrain(ctx, view);
        this.plume.draw(ctx, Math.max(0.4, this.sky.amb));
        drawAtmosphere(ctx, view);
        this.weather.draw(ctx, 0);

        if (this.title) {
            ctx.save();
            ctx.textAlign = 'center';
            // A wash behind the title so it survives whatever is underneath.
            const g = ctx.createLinearGradient(0, 60, 0, 300);
            g.addColorStop(0, 'rgba(6,8,11,0.0)');
            g.addColorStop(0.4, 'rgba(6,8,11,0.55)');
            g.addColorStop(1, 'rgba(6,8,11,0.0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 60, W, 240);

            ctx.fillStyle = '#d8cdb8';
            ctx.font = '600 62px "Iowan Old Style", Palatino, Georgia, serif';
            ctx.fillText('DIESEL HEART', W / 2, 168);

            ctx.fillStyle = '#d1a04a';
            ctx.font = '12px ui-monospace, monospace';
            ctx.letterSpacing = '6px';
            ctx.fillText('THE SABLE VALLEY RAILWAY', W / 2, 200);
            ctx.letterSpacing = '0px';

            // The heartbeat, made visible: a pulse in time with the idle.
            const beat = (Math.sin(this.t * this.consist.loco.idleThump * Math.PI * 2) + 1) / 2;
            ctx.fillStyle = `rgba(209,160,74,${0.25 + beat * 0.5})`;
            ctx.font = '11px ui-monospace, monospace';
            ctx.fillText('dhuk    dhuk    dhuk', W / 2, 232);
            ctx.restore();
        }
    }
}

/* ── Title ───────────────────────────────────────────────────────────────── */
export async function titleScreen(hasSave) {
    const buttons = [];
    if (hasSave) buttons.push({ id: 'continue', label: 'Continue', cls: 'primary' });
    buttons.push({ id: 'new', label: hasSave ? 'Start over' : 'Begin', cls: hasSave ? '' : 'primary' });
    buttons.push({ id: 'about', label: 'About' });

    const r = await prompt(`
        <h2>Sable Valley Railway</h2>
        <p><em>Twelve miles of track that shouldn't still exist.</em></p>
        <p>Abel Quist ran this railway for thirty-one years. He was buried on Tuesday.
           There is a train to Halloway on Thursday.</p>
        <p>You have four second-hand locomotives, one slot a day on somebody else's
           mainline, and four towns that have no other road.</p>
    `, buttons);

    if (r === 'about') {
        await prompt(`
            <h1>Diesel Heart</h1>
            <h2>What you are actually doing</h2>
            <p>You drive a train from the side, in profile, up and down a valley that
               climbs 2,148 feet. The strip along the top is the whole section at once:
               every signal, every passing loop, and every Continental Pacific train
               that is not yours. You do not own this mainline. You are a guest on it.</p>
            <h3>The three things that will kill a trip</h3>
            <p><strong>Weight.</strong> A thousand tons of train does not stop because you would like it to.
               The amber dashed line on the strip is where you would stop if you put the
               brake in right now. Look at it often.</p>
            <p><strong>Heat.</strong> Number seventeen makes 2,600 horsepower and cooks herself
               doing it. Hold notch 8 up Sabre Hill and she will pull her own power back to
               survive, halfway up, with the train pushing you backwards.</p>
            <p><strong>Slack.</strong> The couplers have play in them. Snatch at the throttle or
               the brake and the shock runs down the train — and the thing at the back is
               sometimes a cryostat, and sometimes a person.</p>
            <h3>Controls</h3>
            <div class="keygrid">
                <span><kbd>W</kbd> <kbd>S</kbd></span><span>Throttle up and down. Below idle is the dynamic brake.</span>
                <span><kbd>A</kbd> <kbd>D</kbd></span><span>Train brake — release and apply. Air is slow. Plan for it.</span>
                <span><kbd>Space</kbd></span><span>Emergency. Seven seconds to recharge, and you have almost nothing during them.</span>
                <span><kbd>H</kbd></span><span>Horn. Every whistle board, every time.</span>
                <span><kbd>X</kbd></span><span>Sanders — buys adhesion on wet or snow.</span>
                <span><kbd>1</kbd> <kbd>2</kbd></span><span>Line the points: into the siding, or stay on the main.</span>
                <span><kbd>L</kbd></span><span>Headlight.</span>
                <span><kbd>Esc</kbd></span><span>Pause.</span>
            </div>
        `, [{ id: 'back', label: 'Back', cls: 'primary' }]);
        return titleScreen(hasSave);
    }
    return r;
}

/* ── Chapter card ────────────────────────────────────────────────────────── */
export async function chapterCard(ch, n) {
    await prompt(`
        <h2>Chapter ${n} — ${esc(ch.subtitle)}</h2>
        <h1>${esc(ch.title)}</h1>
        <hr class="rule">
        <p><em>${esc(ch.epigraph)}</em></p>
    `, [{ id: 'go', label: 'Continue', cls: 'primary' }]);
}

/* ── Briefing ────────────────────────────────────────────────────────────── */
export async function briefing(ch, camp, carIds) {
    const R = ch.run;
    const route = buildRoute(R.from, R.to);
    const loco = LOCOS[R.loco];
    const ls = camp.locos[R.loco];
    const cars = (carIds || R.cars).map(id => CARS[id]);
    const consist = buildConsist(loco, ls, cars);
    const climb = routeClimb(route);

    const wx = {
        clear: 'Clear', rain: 'Rain — greasy rail', snow: 'Snow — almost no adhesion',
        fog: 'Fog — sighting distance under 200 m',
    }[R.weather] || 'Clear';

    const carRows = cars.map(c => `
        <tr><td>${esc(c.name)}</td>
            <td class="num">${Math.round(c.mass / 1000)} t</td>
            <td class="num">${c.len.toFixed(1)} m</td>
            <td class="num ${c.fragility > 0.6 ? 'bad' : c.fragility > 0.35 ? 'warn' : ''}">${(c.fragility * 100) | 0}%</td>
            <td>${esc(c.desc)}</td></tr>`).join('');

    const condRows = Object.entries(ls.cond).map(([k, v]) => `
        <tr><td>${esc(k)}</td><td style="width:120px">${condBar(v)}</td>
            <td class="num ${v > 66 ? 'good' : v > 33 ? 'warn' : 'bad'}">${Math.round(v)}%</td></tr>`).join('');

    await prompt(`
        <h2>Train orders</h2>
        <h1>${esc(R.title)}</h1>
        <p>${esc(R.orders)}</p>

        <h3>Conditions</h3>
        <table class="ledger">
            <tr><td>Departure</td><td class="num">${fmtClock(R.hour)}</td>
                <td>Weather</td><td class="num">${esc(wx)}</td></tr>
            <tr><td>Distance</td><td class="num">${(route.length / MILE).toFixed(1)} mi</td>
                <td>Total climb</td><td class="num ${climb * 3.28 > 300 ? 'warn' : ''}">${Math.round(climb * 3.28)} ft</td></tr>
            <tr><td>Slot</td><td class="num">${fmtTime(R.schedule)}</td>
                <td>Trailing tonnage</td><td class="num">${Math.round((consist.mass - loco.mass) / 1000)} t</td></tr>
        </table>

        <h3>Motive power — ${esc(loco.road)} ${esc(loco.name)}, ${esc(loco.cls)}</h3>
        <p>${esc(loco.blurb)}</p>
        <table class="ledger">${condRows}</table>
        <p style="margin-top:10px;font-size:12px">
            ${loco.quirks.map(q => `<span class="warn">▸</span> ${esc(q)}<br>`).join('')}
        </p>

        <h3>Consist — ${cars.length} cars, ${consist.length.toFixed(0)} m</h3>
        <table class="ledger">
            <tr><th>Car</th><th>Mass</th><th>Length</th><th>Fragile</th><th></th></tr>
            ${carRows}
        </table>

        <h3>What counts as a good trip</h3>
        <table class="ledger">
            ${(R.objectives || []).map(o => `<tr><td>▸ ${esc(o.text)}</td></tr>`).join('')}
        </table>
    `, [{ id: 'go', label: 'Take her out', cls: 'primary' }]);
}

function fmtClock(h) {
    const hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* ── Debrief ─────────────────────────────────────────────────────────────── */
export async function debrief(ch, result, settlement, camp) {
    const R = ch.run;
    const objRows = result.objectives.map(o =>
        `<tr><td class="${o.met ? 'good' : 'bad'}">${o.met ? '✓' : '✗'}</td><td>${esc(o.text)}</td></tr>`).join('');

    const lines = settlement.lines.map(l =>
        `<tr><td>${esc(l.label)}</td><td class="num ${l.amount < 0 ? 'bad' : l.amount > 0 ? 'good' : ''}">${
            l.amount === 0 ? '—' : money(l.amount)}</td></tr>`).join('');

    const notes = [];
    if (result.peakShock > 0.5) notes.push(`Peak coupler shock ${result.peakShock.toFixed(2)}g.`);
    if (result.emergencies)     notes.push(`${result.emergencies} emergency application${result.emergencies > 1 ? 's' : ''}.`);
    if (result.derated)         notes.push('The engine derated to protect itself.');
    if (result.stalled)         notes.push('Stalled on the grade.');
    if (result.bodgeFailed)     notes.push('Meera\'s shim let go.');
    if (result.missedWhistle)   notes.push(`${result.missedWhistle} crossing${result.missedWhistle > 1 ? 's' : ''} taken without a whistle.`);
    if (result.overspeedSecs > 1.5)
        notes.push(`${Math.round(result.overspeedSecs)}s over the permitted speed, peaking ${Math.round(result.worstOverspeed)} mph above it.`);

    // Before anything is applied, a failed trip can simply be run again. Once
    // the settlement has been posted, it is posted.
    const buttons = settlement.settled
        ? [{ id: 'on', label: 'Sign off', cls: 'primary' }]
        : [{ id: 'retry', label: 'Run it again', cls: 'primary' }, { id: 'on', label: 'Take the loss' }];

    return prompt(`
        <h2>${result.success ? 'Trip complete' : 'Trip failed'}</h2>
        <h1>${esc(R.title)}</h1>
        ${result.failReason ? `<p class="bad"><em>${esc(result.failReason)}</em></p>` : ''}

        <table class="ledger">${objRows}</table>

        <h3>Running</h3>
        <table class="ledger">
            <tr><td>Time on the road</td><td class="num ${result.time > R.schedule ? 'warn' : 'good'}">${fmtTime(result.time)}</td>
                <td>Slot</td><td class="num">${fmtTime(R.schedule)}</td></tr>
            <tr><td>Distance</td><td class="num">${result.miles.toFixed(1)} mi</td>
                <td>Lading damage</td><td class="num ${result.cargoLost > 0.01 ? 'bad' : 'good'}">${(result.cargoLost * 100).toFixed(0)}%</td></tr>
        </table>
        ${notes.length ? `<p style="margin-top:10px">${notes.map(esc).join(' ')}</p>` : ''}

        <h3>Settlement</h3>
        <table class="ledger">
            ${lines}
            <tr><td><strong>Net</strong></td><td class="num"><strong class="${settlement.net < 0 ? 'bad' : 'good'}">${money(settlement.net)}</strong></td></tr>
            <tr><td>In hand</td><td class="num ${camp.money < 0 ? 'bad' : ''}">${money(camp.money)}</td></tr>
        </table>
        ${settlement.perfect ? '<p class="good"><em>Nothing to write up. Abel would not have said anything either.</em></p>' : ''}
    `, buttons);
}

/* ── Epilogue ────────────────────────────────────────────────────────────── */
export async function epilogue(camp) {
    const s = camp.stats;
    return prompt(`
        <h2>Sable Valley Railway</h2>
        <h1>The load needs pulling</h1>
        <p>Odell Bray came back in the spring. He does not drive any more. He rides
           in the caboose with a flask and an opinion about your braking, and the
           opinion is usually right.</p>
        <p>Meera fitted the new head in April, out of Peregrine money, and kept the
           cracked one on the wall of the shed where everyone can see it.</p>
        <p>Halvard Ines moved the slot to 06:15. He never mentioned it. It simply
           appeared on the sheet one Tuesday.</p>
        <p>Tomas Weir passed his medical in the autumn. He is not old enough to hold
           a licence yet. He is old enough to be told to stand back from the fence,
           and he no longer needs telling.</p>
        <hr class="rule">
        <table class="ledger">
            <tr><td>Trips run</td><td class="num">${s.runs}</td>
                <td>Miles</td><td class="num">${Math.round(s.miles)}</td></tr>
            <tr><td>In the slot</td><td class="num">${s.onTime}</td>
                <td>Clean trips</td><td class="num">${s.perfect}</td></tr>
            <tr><td>Signals passed at danger</td><td class="num ${s.spads ? 'bad' : 'good'}">${s.spads}</td>
                <td>Emergency applications</td><td class="num">${s.emergencies}</td></tr>
        </table>
        <p style="margin-top:18px"><em>Dhuk. Dhuk. Dhuk.</em></p>
    `, [{ id: 'end', label: 'Back to the shed', cls: 'primary' }]);
}
