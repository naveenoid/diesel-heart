/* ── The run ──────────────────────────────────────────────────────────────────
   One trip up or down the valley. Everything the campaign cares about happens
   here: whether the train arrived, whether it arrived whole, and what it cost
   the machine to do it.

   The design rule throughout: no failure should ever be a surprise. Every red
   signal, every meet, every rockfall is visible or announced far enough ahead
   that losing means you read it wrong, not that the game hid it. */

import { buildRoute, MILE } from '../data/routes.js';
import { LOCOS, CARS } from '../data/roster.js';
import { buildConsist, makeTrainState, stepTrain, stoppingDistance, mph } from './physics.js';
import { drawWorld, drawAtmosphere, skyFor, Weather, PPM, trackPoint } from '../render/world.js';
import { drawPlayerTrain, drawTrafficTrain, Plume, stackPoint } from '../render/trains.js';
import { drawHUD, fmtTime } from '../render/hud.js';
import { CHARACTERS } from '../data/story.js';
import { sound } from '../audio.js';

const W = 1280, H = 720;
const WHISTLE_RANGE = 240;      // metres from the crossing that the board stands
const ARRIVE_ZONE = 90;         // how close to the far end counts as "at the platform"

export class RunScene {
    constructor(app, chapter, camp) {
        this.app = app;
        this.chapter = chapter;
        this.camp = camp;
        const R = chapter.run;

        this.route = buildRoute(R.from, R.to);
        const locoDef = LOCOS[R.loco];
        const locoState = camp.locos[R.loco];
        this.consist = buildConsist(locoDef, locoState, R.cars.map(id => CARS[id]));

        this.env = { adhesion: R.adhesion || 'dry', ambient: (R.ambient ?? 30) + (R.cracked?.heatBias || 0) };
        this.train = makeTrainState(this.consist, { ambient: this.env.ambient });

        this.hour = R.hour ?? 12;
        this.weatherKind = R.weather || 'clear';
        this.weather = new Weather(this.weatherKind);
        this.plume = new Plume();
        this.sky = skyFor(this.hour);

        this.elapsed = 0;
        this.camS = 0;
        this.shake = 0;
        this.paused = false;
        this.finished = false;
        this.headlight = this.sky.night || this.weatherKind === 'fog';

        // Siding state
        this.onSiding = false;
        this.linedFor = null;        // siding the points are set for
        this.currentSiding = null;

        // Traffic
        this.traffic = (R.traffic || []).map(t => ({
            ...t, released: (t.releaseAt ?? 0) <= 0, phase: 0, onSiding: false, done: false,
            held: false, v: t.v ?? 0,
        }));
        // A scripted meet is a dispatcher's decision, so it has to happen where
        // the dispatcher said it would. Tie each meet to its train.
        for (const m of (R.meets || [])) {
            const tr = this.traffic.find(x => x.id === m.trainId);
            if (tr) tr.meetSiding = m.siding;
        }

        // Hazards: crossings come from the route, the scenario chooses which are live
        this.hazards = [];
        for (const h of (R.hazards || [])) {
            if (h.type === 'crossing') {
                const cr = nearest(this.route.crossings, h.s);
                if (cr) this.hazards.push({ type:'crossing', s: cr.s, name: cr.name, whistled:false, vehicle:false, cleared:false });
            } else {
                this.hazards.push({ ...h, cleared: false, clearing: 0 });
            }
        }

        this.signalAspects = new Map();
        this.radioLog = [];
        this.pendingRadio = (R.radio || []).map(r => ({ ...r, fired: false }));
        this.warnings = [];

        // Tally
        this.spads = 0;
        this.emergencies = 0;
        this.cargoLost = 0;
        this.crossingStrike = false;
        this.missedWhistle = 0;
        this.struckDebris = false;
        this.everDerated = false;
        this.everStalled = false;
        this.bodgeFailed = false;
        this.slipSeconds = 0;
        this.fuelStart = this.train.fuel;
        this.emergencyLockout = 0;
        this.overspeedSecs = 0;
        this.worstOverspeed = 0;
        this.hornTimer = 0;
        this.arrived = false;
        this.deadReason = null;
        this.stopDwell = 0;

        this.keys = new Set();
        this.hint = 'W/S THROTTLE   ·   A/D BRAKE   ·   SPACE EMERGENCY   ·   H HORN   ·   X SAND   ·   1 SIDING  2 MAIN   ·   L LIGHT   ·   ESC PAUSE';
    }

    /* ── Lifecycle ───────────────────────────────────────────────────────── */

    start() {
        sound.init();
        sound.resume();
        sound.setWeather(this.weatherKind);
        sound.setEngine({ on: true, kind: this.consist.loco.kind, thump: this.consist.loco.idleThump });
        this.say('dell', `${this.chapter.run.title}. Brake pipe charged, ${this.consist.cars.length} on behind.`);
    }

    stop() {
        sound.setEngine({ on: false });
        sound.setWeather('clear');
    }

    say(who, text) {
        const c = CHARACTERS[who] || { name: who };
        this.radioLog.push({ who, name: c.name || who, text, at: performance.now() });
        if (this.radioLog.length > 24) this.radioLog.shift();
        sound.radioCall();
    }

    /* ── Input ───────────────────────────────────────────────────────────── */

    keydown(e) {
        const k = e.key.toLowerCase();
        if (k === 'escape' || k === 'p') { this.paused = !this.paused; e.preventDefault(); return; }
        if (this.paused || this.finished) return;
        const t = this.train, loco = this.consist.loco;

        switch (k) {
            case 'w': case 'arrowup':
                t.notch = Math.min(loco.notches, t.notch + 1);
                sound.clunk(); e.preventDefault(); break;
            case 's': case 'arrowdown':
                t.notch = Math.max(-loco.dynamicBrake, t.notch - 1);
                sound.clunk(); e.preventDefault(); break;
            case 'd': case 'arrowright':
                t.brake = Math.min(1, +(t.brake + 0.1).toFixed(2)); e.preventDefault(); break;
            case 'a': case 'arrowleft':
                if (t.emergency) this.releaseEmergency();
                t.brake = Math.max(0, +(t.brake - 0.1).toFixed(2)); e.preventDefault(); break;
            case ' ':
                if (!t.emergency) {
                    t.emergency = true;
                    t.notch = 0;
                    this.emergencies++;
                    sound.alarm();
                    this.warn('danger', 'EMERGENCY BRAKE APPLIED', 'emerg');
                }
                e.preventDefault(); break;
            case 'h':
                this.sound_horn(); e.preventDefault(); break;
            case 'x':
                t.sanders = !t.sanders; e.preventDefault(); break;
            case 'l':
                this.headlight = !this.headlight; e.preventDefault(); break;
            case '1':
                this.lineSiding(true); e.preventDefault(); break;
            case '2':
                this.lineSiding(false); e.preventDefault(); break;
        }
    }

    /**
     * Coming out of an emergency is where the cost is. The pipe has dumped, and
     * recharging it takes real time — so the clock starts on release, not on
     * application, or the penalty would tick away harmlessly while you were
     * still stopping.
     */
    releaseEmergency() {
        this.train.emergency = false;
        this.train.brake = 0;
        this.train.pipe = 0.9;      // still full; it bleeds off slowly
        this.emergencyLockout = 7;
    }

    sound_horn() {
        sound.horn();
        this.hornTimer = 1.4;
        // Credit any crossing whose whistle board we are between
        for (const hz of this.hazards) {
            if (hz.type !== 'crossing' || hz.whistled) continue;
            const d = hz.s - this.train.s;
            if (d > -20 && d < WHISTLE_RANGE) {
                hz.whistled = true;
                hz.cleared = true;
            }
        }
    }

    /** Line the points for the next siding, if we are close enough and not past it. */
    lineSiding(intoSiding) {
        const sd = this.nextSidingEntry();
        if (!sd) { sound.bad(); return; }
        this.linedFor = intoSiding ? sd.name : null;
        sound.blip(intoSiding ? 760 : 520, 0.08);
        this.warn('info', intoSiding ? `POINTS LINED — ${sd.name.toUpperCase()}` : 'POINTS LINED — MAIN');
    }

    nextSidingEntry() {
        if (this.onSiding) return null;
        for (const sd of this.route.sidings) {
            const d = sd.s0 - this.train.s;
            if (d > -5 && d < 900) return sd;
        }
        return null;
    }

    /* ── Signals ─────────────────────────────────────────────────────────── */

    updateSignals() {
        const sigs = this.route.signals;
        for (let i = 0; i < sigs.length; i++) {
            const a = sigs[i].s;
            const b = i + 1 < sigs.length ? sigs[i + 1].s : this.route.length;
            const c = i + 2 < sigs.length ? sigs[i + 2].s : this.route.length;
            const occ1 = this.blockOccupied(a, b);
            const occ2 = this.blockOccupied(b, c);
            this.signalAspects.set(sigs[i].name, occ1 ? 'red' : occ2 ? 'yellow' : 'green');
        }
    }

    blockOccupied(a, b) {
        for (const tr of this.traffic) {
            if (tr.done || !tr.released || tr.onSiding) continue;
            const rear = tr.dir < 0 ? tr.s + 120 : tr.s - 120;
            const lo = Math.min(tr.s, rear), hi = Math.max(tr.s, rear);
            if (hi >= a && lo <= b) return true;
        }
        /* Hazards deliberately do NOT occupy a block. Track circuits detect
           trains, not landslides — nobody has told Halloway there is a rock in
           the Sabre cut, which is the entire point of that night. A signal that
           went red for it would both lie about how railways work and lock the
           player out of the block they are supposed to creep through. */
        return false;
    }

    signalAhead() {
        for (const sg of this.route.signals) {
            if (sg.s > this.train.s - 8) return { sg, dist: sg.s - this.train.s, aspect: this.signalAspects.get(sg.name) || 'green' };
        }
        return null;
    }

    /* ── Traffic ─────────────────────────────────────────────────────────── */

    updateTraffic(dt) {
        const t = this.train;
        for (const tr of this.traffic) {
            if (tr.done) continue;
            if (!tr.released) {
                if (this.elapsed >= (tr.releaseAt ?? 0)) {
                    tr.released = true;
                    this.say('radio', `${tr.name} is on the move against you.`);
                }
                continue;
            }

            /* A train ordered into a loop to let you by. Once it is inside, it
               stops fouling the main and the signals behind it clear — which is
               the only way overtaking works on single track. */
            if (tr.takesSiding && !tr.onSiding) {
                const sd = this.route.sidings.find(x => x.name === tr.takesSiding);
                if (sd && (tr.dir > 0 ? tr.s >= sd.s0 + 60 : tr.s <= sd.s1 - 60)) {
                    tr.onSiding = true;
                    tr.sidingRef = sd;
                    this.say('radio', `${tr.name} is inside ${sd.name}. Main is yours — take it.`);
                }
            }
            if (tr.onSiding) {
                // Brake to a stand in the loop and wait you out.
                tr.v = Math.max(0, tr.v - 1.1 * dt);
                tr.s += tr.dir * tr.v * dt;
                tr.phase += (tr.dir * tr.v * dt) / 0.52;
                if ((t.s - tr.s) * (tr.dir > 0 ? 1 : -1) > 260) tr.done = true;
                continue;
            }

            let target = tr.cruise;
            tr.held = false;

            /* Ordered meet: he stops clear of the far end of the named loop and
               waits for you to get inside it. That is what the radio promised,
               so that is where it happens — regardless of who arrives first. */
            if (tr.meetSiding && !this.onSiding) {
                const sd = this.route.sidings.find(x => x.name === tr.meetSiding);
                if (sd) {
                    const holdPos = tr.dir < 0 ? sd.s1 + 170 : sd.s0 - 170;
                    const past = tr.dir < 0 ? tr.s <= holdPos : tr.s >= holdPos;
                    if (past) { tr.s = holdPos; target = 0; tr.held = true; }
                    else {
                        // Brake on a curve that actually brings him to a stand.
                        target = Math.min(target, Math.sqrt(2 * 0.85 * Math.abs(tr.s - holdPos)));
                    }
                }
            }

            /* Safety net, whether or not there is a scripted meet: he does not
               drive into you. He simply refuses to go away. */
            const gap = (tr.s - t.s) * (tr.dir < 0 ? 1 : -1);
            if (!this.onSiding && gap > 0 && gap < 2600) {
                target = Math.min(target, Math.sqrt(2 * 1.0 * Math.max(0, gap - 260)));
                tr.held = tr.held || gap < 420;
            }

            const accel = target > tr.v ? 0.45 : 1.15;
            tr.v += Math.sign(target - tr.v) * accel * dt;
            if (Math.abs(target - tr.v) < 0.12) tr.v = target;
            tr.v = Math.max(0, tr.v);

            tr.s += tr.dir * tr.v * dt;
            tr.phase += (tr.dir * tr.v * dt) / 0.52;

            if (tr.s < -600 || tr.s > this.route.length + 600) tr.done = true;

            // Collision
            if (!this.onSiding && Math.abs(tr.s - t.s) < 26 && (tr.v > 0.5 || Math.abs(t.v) > 0.5)) {
                this.fail(`Collision with ${tr.name}.`);
                return;
            }
        }
    }

    /* ── Hazards ─────────────────────────────────────────────────────────── */

    updateHazards(dt) {
        const t = this.train;

        for (const hz of this.hazards) {
            if (hz.type === 'crossing') {
                const d = hz.s - t.s;
                // A vehicle appears once we are close and nobody has whistled.
                if (!hz.whistled && !hz.vehicle && d < 170 && d > 12) {
                    hz.vehicle = true;
                    this.warn('danger', `VEHICLE ON ${hz.name.toUpperCase()}`);
                    sound.alarm();
                }
                if (hz.vehicle && !hz.cleared) {
                    if (d < 6 && Math.abs(t.v) > 2.2) {
                        hz.cleared = true;
                        this.crossingStrike = true;
                        this.shake = 1.4;
                        sound.bad();
                        this.say('dell', 'We hit it. We hit it — get her stopped.');
                        this.warn('danger', 'CROSSING STRUCK');
                    } else if (d < 6) {
                        // Crawled up to it; the driver had time to get clear
                        hz.cleared = true;
                        this.say('dell', 'He is out of it. Go on, gently.');
                    }
                }
                if (d < -30 && !hz.whistled && !hz.counted) {
                    hz.counted = true;
                    this.missedWhistle++;
                }
            }

            else if (hz.type === 'rockfall' && !hz.cleared) {
                const d = hz.s - t.s;
                if (d < 14 && d > -40) {
                    if (Math.abs(t.v) > 1.6) {
                        this.struckDebris = true;
                        this.fail('Struck the rockfall at speed.');
                        return;
                    }
                    // Stopped short: the crew get down and shift it.
                    if (Math.abs(t.v) < 0.4) {
                        hz.clearing += dt;
                        this.warn('caution', `CLEARING DEBRIS — ${Math.max(0, 22 - hz.clearing).toFixed(0)}s`);
                        if (hz.clearing > 22) {
                            hz.cleared = true;
                            sound.good();
                            this.say('dell', 'Off the road and down the bank. Take her on.');
                        }
                    }
                } else if (d < 420 && d > 0 && !hz.announced) {
                    hz.announced = true;
                    this.warn('danger', 'OBSTRUCTION AHEAD');
                }
            }

            else if (hz.type === 'drift' && !hz.cleared) {
                const d = Math.abs(hz.s - t.s);
                // A drift is white and enormous; you can see it coming.
                if (hz.s - t.s < 500) hz.announced = true;
                if (d < 45) {
                    // Ploughing costs you speed; too slow and you simply stop.
                    t.v = Math.max(0, t.v - 0.55 * dt * (1 + this.consist.mass / 400000));
                    this.warn('caution', 'PLOUGHING SNOW');
                    if (hz.s < t.s) hz.cleared = true;
                }
            }
        }
    }

    /* ── Warnings ────────────────────────────────────────────────────────── */

    /**
     * Most warnings carry a live distance or temperature in them, so matching
     * on the text would stack a fresh copy every frame. Match on a key instead
     * and let the text update in place.
     */
    warn(level, text, key) {
        const k = key || text.replace(/[\d.]+/g, '#');
        const existing = this.warnings.find(w => w.key === k);
        if (existing) { existing.ttl = 2.2; existing.text = text; existing.level = level; return; }
        this.warnings.push({ level, text, key: k, ttl: 2.2 });
    }

    buildWarnings(dt) {
        for (const w of this.warnings) w.ttl -= dt;
        this.warnings = this.warnings.filter(w => w.ttl > 0);

        const t = this.train;

        // Signal ahead
        const sa = this.signalAhead();
        if (sa && sa.dist < 1000 && sa.dist > -10) {
            if (sa.aspect === 'red') {
                const canStop = stoppingDistance(t.v, this.consist.brakeCap * 0.9,
                                                 this.route.gradeSmooth(t.s)) < sa.dist;
                this.warn(canStop ? 'caution' : 'danger',
                    `SIGNAL ${sa.sg.name} AT DANGER — ${Math.round(sa.dist)} M`);
            } else if (sa.aspect === 'yellow' && sa.dist < 700) {
                this.warn('caution', `SIGNAL ${sa.sg.name} CAUTION — ${Math.round(sa.dist)} M`);
            }
        }

        // Overspeed
        const lim = this.route.limitAt(t.s);
        if (t.v > lim + 1.4) {
            this.warn('danger', `OVERSPEED — LIMIT ${Math.round(mph(lim))} MPH`, 'overspeed');
        } else {
            // Look ahead for a restriction we are not going to make. Only warn
            // about one we have not already entered — "in 0 m" helps nobody.
            for (const l of this.route.limits) {
                const d = l.s0 - t.s;
                if (d > 30 && d < 900 && t.v > l.v + 1.4) {
                    if (stoppingDistance(t.v - l.v, this.consist.brakeCap * 0.8, this.route.gradeSmooth(t.s)) > d)
                        this.warn('caution', `${Math.round(mph(l.v))} MPH IN ${Math.round(d)} M — ${l.why.toUpperCase()}`, 'ahead-limit');
                    break;
                }
            }
        }

        // Whistle board
        for (const hz of this.hazards) {
            if (hz.type !== 'crossing' || hz.whistled) continue;
            const d = hz.s - t.s;
            if (d > 0 && d < WHISTLE_RANGE) this.warn('caution', `WHISTLE BOARD — ${hz.name.toUpperCase()} [H]`);
        }

        // Meets
        for (const tr of this.traffic) {
            if (tr.done || !tr.released || this.onSiding) continue;
            const gap = Math.abs(tr.s - this.train.s);
            const closing = tr.dir < 0 ? tr.s > this.train.s : tr.s < this.train.s;
            if (closing && gap < 2600) {
                const sd = this.nextSidingEntry();
                this.warn(gap < 900 ? 'danger' : 'caution',
                    sd ? `MEET ${tr.name.toUpperCase()} — TAKE ${sd.name.toUpperCase()} [1]`
                       : `MEET ${tr.name.toUpperCase()} — ${Math.round(gap)} M`);
            }
        }

        // Machine
        if (t.derated) this.warn('danger', 'ENGINE DERATED — BACK OFF');
        else if (!this.isSteam() && t.heat > this.consist.loco.heatRedline - 8)
            this.warn('caution', `WATER TEMPERATURE ${Math.round(t.heat)}°`);
        if (this.isSteam() && t.steam < 32) this.warn('caution', `BOILER PRESSURE LOW — ${Math.round(t.steam)}`);
        if (t.wheelslip > 0.25) this.warn('danger', 'WHEELSLIP — SAND [X]');
        if (t.stalled) this.warn('danger', 'STALLED ON THE GRADE');
        // An emergency application latches. Say so, and say how to get out of it,
        // or the player sits there wondering why the throttle has stopped working.
        if (t.emergency) this.warn('danger', 'EMERGENCY LATCHED — PRESS [A] TO RELEASE', 'emerg');
        else if (this.emergencyLockout > 0)
            this.warn('caution', `BRAKE PIPE RECHARGING — ${Math.ceil(this.emergencyLockout)}s`, 'emerg');

        // Arrival
        const toGo = this.route.length - t.s;
        if (toGo < 600 && toGo > -20) {
            const dest = this.route.stations[this.route.stations.length - 1];
            this.warn('info', `${dest.name.toUpperCase()} — ${Math.round(toGo)} M, STOP AT THE PLATFORM`);
        }
    }

    isSteam() { return this.consist.loco.kind === 'steam'; }

    /* ── Sidings ─────────────────────────────────────────────────────────── */

    updateSidings() {
        const t = this.train;
        if (!this.onSiding) {
            for (const sd of this.route.sidings) {
                if (this.linedFor === sd.name && t.s >= sd.s0 && t.s < sd.s0 + 30) {
                    this.onSiding = true;
                    this.currentSiding = sd;
                    this.linedFor = null;
                    sound.blip(620, 0.12);
                    this.warn('info', `IN ${sd.name.toUpperCase()} — MAIN IS CLEAR`);
                }
            }
        } else {
            const sd = this.currentSiding;
            if (t.s >= sd.s1) {
                this.onSiding = false;
                this.currentSiding = null;
                this.warn('info', 'BACK ON THE MAIN');
                sound.blip(500, 0.12);
            }
        }
    }

    /* ── SPAD ────────────────────────────────────────────────────────────── */

    checkSpad(prevS) {
        for (const sg of this.route.signals) {
            if (prevS < sg.s && this.train.s >= sg.s) {
                if ((this.signalAspects.get(sg.name) || 'green') === 'red' && Math.abs(this.train.v) > 0.6) {
                    this.spads++;
                    // The trip stop does not ask your opinion.
                    this.train.emergency = true;
                    this.train.notch = 0;
                    sound.alarm();
                    this.warn('danger', `SPAD — SIGNAL ${sg.name} PASSED AT DANGER`);
                    this.say('radio', `9X, Halloway. You have just run signal ${sg.name}. Stop your train and call me.`);
                }
            }
        }
    }

    /* ── Update ──────────────────────────────────────────────────────────── */

    update(dt) {
        if (this.paused || this.finished) { sound.setEngine({ on: !this.finished }); return; }

        this.elapsed += dt;
        this.emergencyLockout = Math.max(0, this.emergencyLockout - dt);
        this.hornTimer = Math.max(0, this.hornTimer - dt);

        const t = this.train;
        const prevS = t.s;

        // Chapter modifiers
        const R = this.chapter.run;
        if (R.cracked) {
            // A cracked head: less power, and she never really cools down.
            t.power = Math.min(t.power, R.cracked.powerScale);
        }

        // Weak brakes while the pipe recharges after an emergency release
        const savedCap = this.consist.brakeCap;
        if (this.emergencyLockout > 0 && !t.emergency) this.consist.brakeCap = savedCap * 0.4;

        this.updateSignals();
        const { events } = stepTrain(t, this.consist, this.route, this.env, dt);
        this.consist.brakeCap = savedCap;

        for (const ev of events) {
            if (ev.type === 'derate' && !this.everDerated) {
                this.everDerated = true;
                this.say('meera', 'She is pulling her own power back. Ease off and let her breathe.');
            }
            if (ev.type === 'slip') this.slipSeconds += dt;
            if (ev.type === 'knuckle-strain') this.warn('caution', 'COUPLER SHOCK — EASE IT');
        }
        if (t.stalled) this.everStalled = true;
        if (t.wheelslip > 0.2) this.slipSeconds += dt;

        // The bodged component, if the chapter gave us one
        if (R.bodge && !this.bodgeFailed && R.bodge.slipSensitive && this.slipSeconds > 2.6) {
            if (Math.random() < R.bodge.failChance * dt * 0.9) {
                this.bodgeFailed = true;
                this.consist.locoState = {
                    ...this.consist.locoState,
                    cond: { ...this.consist.locoState.cond, traction: this.consist.locoState.cond.traction * 0.45 },
                };
                sound.bad();
                this.say('meera', 'That is the shim gone. You have got what you have got. Nurse her in.');
                this.warn('danger', 'TRACTION MOTOR FAILURE');
            }
        }

        this.checkSpad(prevS);
        this.updateSidings();
        this.updateTraffic(dt);
        if (this.finished) return;
        this.updateHazards(dt);
        if (this.finished) return;

        // Overspeed. A restriction you can exceed for free is decorative, so
        // time spent over it is counted and settled for afterwards.
        const permitted = this.route.limitAt(t.s);
        if (t.v > permitted + 1.4) {
            this.overspeedSecs += dt;
            this.worstOverspeed = Math.max(this.worstOverspeed, t.v - permitted);
        }

        // Shock damage to the lading
        const limit = R.shockLimit ?? 0.78;
        if (t.shock > limit) {
            const bite = (t.shock - limit) * dt * 0.62 * (0.35 + this.consist.fragility);
            this.cargoLost = Math.min(1, this.cargoLost + bite);
            this.warn('danger', 'SHOCK EVENT — LADING AT RISK');
        }

        // Scripted radio
        for (const r of this.pendingRadio) {
            if (!r.fired && t.s >= r.atS) { r.fired = true; this.say(r.who, r.text); }
        }

        this.buildWarnings(dt);

        // Camera: a little lead at speed, so you see further when it matters
        const lead = Math.min(34, Math.abs(t.v) * 1.15);
        this.camS += ((t.s + lead) - this.camS) * Math.min(1, dt * 4.5);

        // Shake from speed, slack and slip
        const target = Math.min(1, Math.abs(t.v) / 46) * 0.5 + t.shock * 0.8 + t.wheelslip * 0.5;
        this.shake += (target - this.shake) * Math.min(1, dt * 6);

        // Exhaust
        const sp = stackPoint(this.route, t, this.camS, this.consist.loco.kind, this.onSiding);
        if (this.isSteam()) {
            if (t.power > 0.05 && Math.abs(t.v) > 0.3 && Math.random() < dt * (4 + Math.abs(t.v) * 1.6))
                this.plume.emit(sp.x, sp.y, 'steam', t.power, Math.abs(t.v) * PPM);
        } else if (Math.random() < dt * (2.5 + t.power * 20)) {
            this.plume.emit(sp.x, sp.y, 'diesel', t.power, Math.abs(t.v) * PPM);
        }
        if (t.wheelslip > 0.3 && Math.random() < dt * 40) {
            const p = trackPoint(this.route, t.s - 12, this.camS);
            this.plume.sparks(p.x, p.y + (this.onSiding ? 26 : 0), 2);
        }
        if (t.pipe > 0.5 && Math.abs(t.v) > 6 && Math.random() < dt * 14) {
            const p = trackPoint(this.route, t.s - 14, this.camS);
            this.plume.sparks(p.x, p.y + (this.onSiding ? 26 : 0), 1);
        }
        this.plume.update(dt);
        this.weather.update(dt, Math.abs(t.v));

        sound.setEngine({
            on: true, kind: this.consist.loco.kind,
            thump: this.consist.loco.idleThump,
            power: t.power, speed: Math.abs(t.v),
            brake: t.pipe, slip: t.wheelslip,
        });

        /* ── Arrival ── */
        const toGo = this.route.length - t.s;
        if (toGo < ARRIVE_ZONE && Math.abs(t.v) < 0.35) {
            this.stopDwell += dt;
            if (this.stopDwell > 1.1) { this.succeed(); return; }
        } else {
            this.stopDwell = 0;
        }

        if (t.s > this.route.length + 40) { this.fail('Ran past the end of the track.'); return; }
        if (this.elapsed > R.hardLimit * 1.9) { this.fail('The trip took so long the slot, the shift and the day were gone.'); return; }
    }

    /* ── Completion ──────────────────────────────────────────────────────── */

    result(success, reason) {
        const t = this.train;
        return {
            success, failReason: reason || null,
            time: this.elapsed,
            miles: t.distanceRun / MILE,
            spads: this.spads,
            emergencies: this.emergencies,
            cargoLost: this.cargoLost,
            crossingStrike: this.crossingStrike,
            missedWhistle: this.missedWhistle,
            overspeedSecs: this.overspeedSecs,
            worstOverspeed: mph(this.worstOverspeed),
            peakShock: t.peakShock,
            derated: this.everDerated,
            stalled: this.everStalled,
            bodgeFailed: this.bodgeFailed,
            struckDebris: this.struckDebris,
            // Tank units → litres. A 2,600 hp unit drinks roughly 600 l/h flat
            // out, so a twenty-minute trip is a couple of hundred litres, not a
            // couple of thousand.
            fuelUsed: Math.max(0, this.fuelStart - t.fuel) * 2.2,
            wear: {
                traction: Math.min(30, t.wearTraction * 0.5 + 0.6),
                brakes:   Math.min(30, t.wearBrakes * 0.32 + 0.5),
                prime:    Math.min(30, t.wearPrime * 0.7 + this.elapsed / 260),
                cooling:  Math.min(30, t.wearCooling * 0.8 + 0.3),
            },
            objectives: this.gradeObjectives(success),
        };
    }

    gradeObjectives(success) {
        const R = this.chapter.run;
        const t = this.train;
        const map = {
            arrive:  success,
            ontime:  success && this.elapsed <= R.schedule,
            clean:   this.emergencies === 0,
            nospad:  this.spads === 0,
            whistle: this.missedWhistle === 0 && !this.crossingStrike,
            cargo:   this.cargoLost < 0.02,
            shock:   t.peakShock <= (R.shockLimit ?? 0.78),
            meet:    success && this.traffic.every(tr => tr.done || tr.v < 0.1),
            limits:  this.overspeedSecs < 1.5,
            noderate:!this.everDerated,
            nostall: !this.everStalled,
            noslip:  !this.bodgeFailed,
            nostrike:!this.struckDebris,
        };
        return (R.objectives || []).map(o => ({ ...o, met: !!map[o.id] }));
    }

    succeed() {
        if (this.finished) return;
        this.finished = true;
        sound.good();
        this.stop();
        this.app.onRunComplete(this.result(true));
    }

    fail(reason) {
        if (this.finished) return;
        this.finished = true;
        this.deadReason = reason;
        sound.bad();
        this.shake = 2;
        this.stop();
        this.app.onRunComplete(this.result(false, reason));
    }

    /* ── Draw ────────────────────────────────────────────────────────────── */

    draw(ctx) {
        const t = this.train;

        ctx.save();
        if (this.shake > 0.02) {
            const m = this.shake * 2.6;
            ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
        }

        const view = {
            route: this.route, camS: this.camS, sky: this.sky, hour: this.hour,
            weather: this.weatherKind,
            signalAspects: this.signalAspects,
            hazards: this.hazards,
            lined: this.linedFor,
            onSiding: this.onSiding,
            train: t, consist: this.consist,
            traffic: this.traffic,
            headlight: this.headlight,
            speed: Math.abs(t.v),
            shockAlarm: t.shock > (this.chapter.run.shockLimit ?? 0.78),
            elapsed: this.elapsed,
            schedule: this.chapter.run.schedule,
            shockLimit: this.chapter.run.shockLimit ?? 0.7,
            warnings: this.warnings,
            radioLog: this.radioLog,
            hint: this.hint,
        };

        drawWorld(ctx, view);

        for (const tr of this.traffic) if (!tr.done && tr.released) drawTrafficTrain(ctx, view, tr);
        drawPlayerTrain(ctx, view);
        this.plume.draw(ctx, Math.max(0.4, this.sky.amb));

        drawAtmosphere(ctx, view);
        this.weather.draw(ctx, Math.abs(t.v));

        ctx.restore();

        drawHUD(ctx, view);

        if (this.paused) this.drawPause(ctx);
    }

    drawPause(ctx) {
        ctx.fillStyle = 'rgba(6,8,10,0.82)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d8cdb8';
        ctx.font = '30px "Iowan Old Style", Palatino, Georgia, serif';
        ctx.fillText('Held at the signal', W / 2, H / 2 - 60);
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = '#8c8474';
        const lines = [
            'W / S            throttle up · down  (below idle is dynamic brake)',
            'A / D            train brake release · apply',
            'SPACE            emergency — the pipe takes seven seconds to recharge',
            'H                horn        X  sanders        L  headlight',
            '1 / 2            line the points for the siding · for the main',
            '',
            'ESC              back to it',
        ];
        let y = H / 2 - 16;
        for (const l of lines) { ctx.fillText(l, W / 2, y); y += 21; }
        ctx.textAlign = 'left';
    }
}

function nearest(list, s) {
    let best = null, bd = 1e9;
    for (const it of list) {
        const d = Math.abs(it.s - s);
        if (d < bd) { bd = d; best = it; }
    }
    return best;
}
