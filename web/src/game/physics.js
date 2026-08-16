/* ── Train physics ────────────────────────────────────────────────────────────
   Everything dramatic about driving a train comes from three facts:

     1. It is heavy, so it does not do what you ask when you ask.
     2. The brakes are air, so they answer late and let go later.
     3. The couplers are slack, so the train talks back.

   Model all three honestly and you do not need to invent tension. */

const G = 9.81;

/** Rail friction coefficient by condition. Sand buys you back a little. */
const ADHESION = { dry: 0.33, wet: 0.24, snow: 0.16, ice: 0.12, leaves: 0.19 };

export function buildConsist(loco, locoState, cars) {
    let mass = loco.mass, len = 22, pay = 0, frag = 0, fragMass = 0;
    for (const c of cars) {
        mass += c.mass;
        len  += c.len;
        pay  += c.pay;
        frag += c.fragility * c.mass;
        fragMass += c.mass;
    }
    return {
        loco, locoState, cars,
        mass, length: len, payout: pay,
        // Mass-weighted fragility: one cryostat in a train of hoppers still
        // dominates, because it is the thing that breaks.
        fragility: fragMass ? Math.max(frag / fragMass, ...cars.map(c => c.fragility * 0.85)) : 0,
        carCount: cars.length,
        // Brake capacity scales with how much of the train actually has working
        // air, which is to say: with the state of the rigging.
        brakeCap: loco.brakeForce * (0.55 + 0.45 * (locoState.cond.brakes / 100)),
    };
}

export function makeTrainState(consist, opts = {}) {
    const isSteam = consist.loco.kind === 'steam';
    return {
        s: 0, v: 0,
        notch: 0,                 // negative = dynamic brake
        power: 0,                 // lagged fraction of rated power, 0..1
        brake: 0,                 // commanded train brake, 0..1
        pipe: 0,                  // actual brake effort, lags `brake`
        emergency: false,
        emergencyCount: 0,
        sanders: false,
        heat: opts.ambient ?? 34,
        steam: isSteam ? 100 : 0,
        steamTrend: 0,
        fuel: opts.fuel ?? 100,
        slack: 0, slackVel: 0,
        shock: 0, peakShock: 0,
        wheelslip: 0,
        accel: 0, prevAccel: 0,
        wheelPhase: 0,
        derated: false,
        stalled: false,
        distanceRun: 0,
        wearTraction: 0, wearBrakes: 0, wearPrime: 0, wearCooling: 0,
    };
}

/**
 * The largest fraction of rated power the machine can hold indefinitely without
 * cooking itself (diesel) or running its boiler down (steam). This — not the
 * headline rating — is what a hill actually gets.
 */
export function sustainablePower(loco, locoState, ambient = 30) {
    if (loco.kind === 'steam') return 0.8;
    if (!loco.heatRedline) return 1;
    const cool = (locoState?.cond?.cooling ?? 100) / 100;
    // Invert the heat target: ambient + 78·p^1.65·(1.35−0.35·cool) + 10(1−cool) = redline
    const head = loco.heatRedline - ambient - 10 * (1 - cool);
    if (head <= 0) return 0.25;
    const frac = head / (78 * (1.35 - 0.35 * cool));
    return Math.max(0.25, Math.min(1, Math.pow(frac, 1 / 1.65)));
}

/**
 * The speed a locomotive will settle at on a sustained grade with a given
 * trailing load — the number that decides whether a train is a train or a
 * stalled train. Used by the yard to tell you what you have just built.
 */
export function rulingSpeed(loco, mass, grade, adhesion = 'dry', locoState = null, ambient = 30) {
    const mu = ADHESION[adhesion] ?? ADHESION.dry;
    const p = sustainablePower(loco, locoState, ambient);
    let lo = 0, hi = loco.maxSpeed;
    for (let i = 0; i < 40; i++) {
        const v = (lo + hi) / 2;
        const te = Math.min(loco.teMax, mu * loco.mass * G, loco.power * p / Math.max(1.6, v));
        const a = te / mass - G * grade - (0.0055 + 0.00042 * v + 0.0000175 * v * v);
        if (a > 0) lo = v; else hi = v;
    }
    return lo < 0.4 ? 0 : lo;
}

/** How far it takes to stop from `v` under a given deceleration, plus reaction. */
export function stoppingDistance(v, decel, grade = 0) {
    const a = Math.max(0.05, decel + G * grade);   // downhill lengthens it
    return (v * v) / (2 * a) + v * 0.8;
}

/**
 * Advance the train one step.
 *
 * @param t       train state (mutated)
 * @param consist output of buildConsist
 * @param route   route object with gradeAt()
 * @param env     { adhesion:'dry'|'wet'|..., ambient:number }
 * @param dt      seconds
 * @returns       { events: [] } notable things that happened this step
 */
export function stepTrain(t, consist, route, env, dt) {
    const loco = consist.loco;
    const events = [];
    const isSteam = loco.kind === 'steam';

    /* ── Throttle: commanded power chases the notch, at the machine's own pace.
       An Alco takes three and a half seconds to believe you. ── */
    const maxN = loco.notches;
    const cmd = Math.max(0, t.notch) / maxN;
    const lag = loco.throttleLag;
    t.power += (cmd - t.power) * Math.min(1, dt / Math.max(0.05, lag) * 2.2);

    /* ── Steam: pressure is a budget. Open the regulator and you spend it. ── */
    let steamScale = 1;
    if (isSteam) {
        const drain = loco.steamDrain * cmd * (0.55 + Math.min(1.4, t.v / 9));
        const gain  = loco.steamRecover * (1 - cmd * 0.85);
        const before = t.steam;
        t.steam = Math.max(0, Math.min(loco.steamMax, t.steam - drain * dt + gain * dt));
        t.steamTrend = dt > 0 ? (t.steam - before) / dt : 0;
        // Below a third of a glass she simply cannot make the power.
        steamScale = Math.min(1, 0.25 + 0.75 * (t.steam / 38));
        if (t.steam < 6 && cmd > 0.4) events.push({ type: 'steamlow' });
    }

    /* ── Heat: the diesel's conscience. ── */
    let heatScale = 1;
    if (!isSteam) {
        const coolFrac = consist.locoState.cond.cooling / 100;
        const ambient  = env.ambient ?? 34;
        // Power in the exponent, so notch 8 is not merely worse than 7 — it is
        // a different decision.
        const target = ambient + 78 * Math.pow(t.power, 1.65) * (1.35 - 0.35 * coolFrac)
                               + 10 * (1 - coolFrac);
        /* Coolant has thermal mass measured in minutes, not seconds. Rising
           runs to a ~70 s time constant and shedding to ~50 s, which is what
           makes notch 8 a decision you take for a stretch of hill rather than
           a switch that instantly cooks her. */
        const rate = target > t.heat
            ? 0.0140 * loco.heatGain
            : 0.0195 * loco.heatShed * (0.45 + 0.55 * coolFrac);
        t.heat += (target - t.heat) * rate * dt;

        // Past the redline the engine protects itself whether you like it or not.
        if (t.heat > loco.heatRedline) {
            const over = (t.heat - loco.heatRedline) / 14;
            heatScale = Math.max(0.28, 1 - over * 0.62);
            t.wearCooling += over * dt * 2.4;
            t.wearPrime   += over * dt * 1.5;
            if (!t.derated) { t.derated = true; events.push({ type: 'derate' }); }
        } else if (t.derated && t.heat < loco.heatRedline - 5) {
            t.derated = false;
            events.push({ type: 'derate-clear' });
        }
        t.fuel = Math.max(0, t.fuel - loco.fuelBurn * t.power * dt * 0.22);
    }

    /* ── Tractive effort, limited by power, by the machine's condition, and
       finally by whether the wheels can hold the rail at all. ── */
    const primeFrac = 0.62 + 0.38 * (consist.locoState.cond.prime / 100);
    const tracFrac  = 0.55 + 0.45 * (consist.locoState.cond.traction / 100);
    const avail = loco.power * t.power * primeFrac * heatScale * steamScale;
    let te = Math.min(loco.teMax * tracFrac, avail / Math.max(1.6, t.v));

    let mu = ADHESION[env.adhesion] ?? ADHESION.dry;
    if (t.sanders) mu += 0.075;
    const teAdhesion = mu * loco.mass * G;

    if (te > teAdhesion && t.power > 0.05) {
        // Slip. She screams, the ammeter swings, and you go nowhere fast.
        t.wheelslip = Math.min(1, t.wheelslip + dt * 3.4);
        te = teAdhesion * (0.52 + 0.18 * (1 - t.wheelslip));
        t.wearTraction += dt * 5.5 * t.wheelslip;
        if (t.wheelslip > 0.35) events.push({ type: 'slip' });
    } else {
        t.wheelslip = Math.max(0, t.wheelslip - dt * 1.8);
    }

    /* ── Braking. Air propagates; that delay is the whole art. ── */
    if (t.emergency) {
        t.pipe += (1 - t.pipe) * Math.min(1, dt * 4.2);
    } else {
        const applying = t.brake > t.pipe;
        // Applying is slow. Releasing is slower — and on a falling grade,
        // that is the sentence you will remember.
        const rate = applying ? 0.62 : 0.34;
        const d = Math.sign(t.brake - t.pipe) * rate * dt;
        t.pipe = Math.abs(t.brake - t.pipe) < Math.abs(d) ? t.brake : t.pipe + d;
    }

    let brakeA = t.pipe * consist.brakeCap * (t.emergency ? 1.55 : 1);
    // Brakes are friction too — you cannot out-brake the adhesion limit either.
    brakeA = Math.min(brakeA, mu * G * 0.82);
    if (t.emergency) t.wearBrakes += dt * 8;
    else t.wearBrakes += t.pipe * dt * 0.55;

    // Dynamic brake: free retardation that fades to nothing at low speed, which
    // is exactly when you most want it.
    let dynA = 0;
    if (t.notch < 0 && loco.dynamicBrake > 0) {
        const frac = Math.min(1, -t.notch / loco.dynamicBrake);
        const fade = Math.min(1, Math.max(0, (t.v - 2.2) / 6));
        dynA = frac * fade * 0.42 * (loco.mass / consist.mass) * 9.2;
    }

    /* ── Sum the accelerations. ── */
    const grade = route.gradeAt(t.s);
    const aTract = te / consist.mass;
    const aGrade = -G * grade;
    const aRes   = 0.0055 + 0.00042 * t.v + 0.0000175 * t.v * t.v
                 + 0.00022 * consist.carCount;
    const aResist = t.v > 0.02 ? -aRes : 0;
    const aBrake  = -(brakeA + dynA) * (t.v > 0.05 ? 1 : 0);

    let a = aTract + aGrade + aResist + aBrake;

    // Standing still on a grade with no power and no brake: she rolls back.
    if (t.v <= 0.02 && a < 0 && t.pipe > 0.28) a = 0;

    t.prevAccel = t.accel;
    t.accel = a;

    t.v += a * dt;
    if (t.v < 0) t.v = Math.max(t.v, -2.2);       // rollback is possible, and awful
    if (t.v > loco.maxSpeed * 1.12) t.v = loco.maxSpeed * 1.12;

    const ds = t.v * dt;
    t.s += ds;
    t.distanceRun += Math.abs(ds);
    t.wheelPhase += ds / 0.52;                     // driver radius, for the rods

    /* ── Stall detection: uphill, wide open, and losing. ── */
    t.stalled = (t.v < 0.6 && t.notch > 4 && grade > 0.008 && aTract + aGrade < 0);

    /* ── Slack action. The couplers have play in them; the train stretches when
       you pull and bunches when you brake, and the wave takes time to run the
       length of it. Model it as one damped spring and the whole consist
       breathes. ── */
    const target = Math.max(-1, Math.min(1, a / 0.75));
    const stiff  = 7.2 / Math.max(1, consist.carCount * 0.16 + 1);
    const damp   = 2.4;
    t.slackVel += ((target - t.slack) * stiff - t.slackVel * damp) * dt;
    t.slack    += t.slackVel * dt;
    t.slack     = Math.max(-1.3, Math.min(1.3, t.slack));

    // Shock is jerk, felt through the couplers, smoothed just enough to read.
    const jerk = Math.abs(t.accel - t.prevAccel) / Math.max(dt, 1e-3);
    const inst = Math.min(1, (jerk / 9) * (0.45 + 0.55 * Math.min(1, consist.carCount / 8))
                            + Math.abs(t.slackVel) * 0.22);
    t.shock += (inst - t.shock) * Math.min(1, dt * 6);
    t.peakShock = Math.max(t.peakShock, t.shock);

    if (t.shock > 0.82 && consist.carCount >= 5) events.push({ type: 'knuckle-strain' });

    return { events };
}

export const MPS_TO_MPH = 2.23694;
export const mph = v => v * MPS_TO_MPH;
