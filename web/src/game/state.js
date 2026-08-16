/* ── Campaign state ───────────────────────────────────────────────────────────
   What survives between runs: money, the machines' condition, how much the
   valley trusts you, and how much Continental Pacific does.

   Wear is the connective tissue. Drive badly and it shows up here, and then it
   shows up in the next run as an engine that will not make power on a hill. */

import { LOCOS, newLocoState } from '../data/roster.js';
import { CHAPTERS } from '../data/story.js';

export const TOWNS = {
    marrow:     { name: 'Marrow Bend',   pop: 900  },
    tannery:    { name: 'Tannery Flats', pop: 1400 },
    coldspring: { name: 'Coldspring',    pop: 400  },
    kestrel:    { name: 'Kestrel Gap',   pop: 210  },
};

export function newCampaign() {
    return {
        version: 3,
        chapter: 0,
        money: 4200,
        rep: 12,                      // standing with Continental Pacific, 0..100
        crew: 60,                     // how the crew are holding up, 0..100
        morale: { marrow: 55, tannery: 55, coldspring: 55, kestrel: 55 },
        flags: {},
        locos: {
            wdm2:   newLocoState('wdm2'),
            rs3:    newLocoState('rs3'),
            sw1500: newLocoState('sw1500'),
            e33:    newLocoState('e33'),
        },
        log: [],                      // one line per completed run
        stats: { runs: 0, miles: 0, onTime: 0, spads: 0, emergencies: 0, perfect: 0 },
    };
}

/* ── Repairs ──────────────────────────────────────────────────────────────────
   Two ways to fix anything. The right way costs money you do not have. The
   other way costs you a chance of it failing on the hill. */

export const REPAIRS = [
    { id:'proper-prime',    comp:'prime',    label:'Overhaul prime mover',   cost: 3800, gain: 100, jugaad:false,
      note:'Injectors, heads, the lot. Four days in the shed.' },
    { id:'proper-traction', comp:'traction', label:'Rewind traction motor',  cost: 4600, gain: 100, jugaad:false,
      note:'Sent out. Eight weeks if you are lucky, so plan around it.' },
    { id:'proper-brakes',   comp:'brakes',   label:'Reline brake rigging',   cost: 1900, gain: 100, jugaad:false,
      note:'New shoes, new pins, correct clearances.' },
    { id:'proper-cooling',  comp:'cooling',  label:'New radiator core',      cost: 3100, gain: 100, jugaad:false,
      note:'The thing Meera has wanted since August.' },

    { id:'bodge-prime',     comp:'prime',    label:'Jugaad: swap a good injector across',  cost: 260, gain: 42, jugaad:true, risk:0.28,
      steal:{ loco:'rs3', comp:'prime', amount:16 },
      note:'Robs a spare off Rusty. Rusty will notice eventually.' },
    { id:'bodge-traction',  comp:'traction', label:'Jugaad: shim the brush gear',          cost: 180, gain: 38, jugaad:true, risk:0.34,
      note:'Holds if you never let her slip. Never is a strong word.' },
    { id:'bodge-brakes',    comp:'brakes',   label:'Jugaad: turn the shoes and re-pin',    cost: 140, gain: 34, jugaad:true, risk:0.22,
      note:'Buys a month. Emergency applications spend it faster.' },
    { id:'bodge-cooling',   comp:'cooling',  label:'Jugaad: braze the core, bypass a bank',cost: 220, gain: 40, jugaad:true, risk:0.31,
      note:'She will run hotter. She will run.' },
];

/* ── Settlement ───────────────────────────────────────────────────────────────
   Turn a finished run into consequences. */

export function settleRun(camp, chapter, result) {
    const R = result;
    const lines = [];
    let money = 0;

    // Pay follows the train the player actually made up, not the booked minimum.
    const basePay = R.pay ?? chapter.run.pay ?? 0;
    money += basePay;
    if (basePay) lines.push({ label: chapter.run.title, amount: basePay });

    // Punctuality. Being early is not a virtue on a shared railway, but being
    // late costs somebody something every time.
    if (R.time <= chapter.run.schedule) {
        const bonus = Math.round(basePay * 0.14);
        money += bonus;
        camp.rep += 3;
        camp.stats.onTime++;
        if (bonus) lines.push({ label: 'In the slot', amount: bonus });
    } else if (R.time > chapter.run.hardLimit) {
        const pen = Math.round(basePay * 0.4);
        money -= pen;
        camp.rep -= 6;
        if (pen) lines.push({ label: 'Missed the slot entirely', amount: -pen });
    } else {
        camp.rep -= 1;
        lines.push({ label: 'Late into the section', amount: 0 });
    }

    // Cargo. The shock log does not care about your reasons.
    if (R.cargoLost > 0) {
        const pen = Math.round(basePay * R.cargoLost);
        money -= pen;
        lines.push({ label: 'Damaged lading', amount: -pen });
        camp.rep -= Math.round(R.cargoLost * 8);
    }

    if (R.spads > 0) {
        money -= 900 * R.spads;
        camp.rep -= 14 * R.spads;
        camp.stats.spads += R.spads;
        lines.push({ label: `Signal passed at danger ×${R.spads}`, amount: -900 * R.spads });
    }

    // Speed restrictions exist because of a curve, a bridge or a crowd of mill
    // workers walking across the yard. Exceeding one is charged for.
    if (R.overspeedSecs > 1.5) {
        const pen = Math.min(1800, Math.round(R.overspeedSecs * 22 + R.worstOverspeed * 30));
        money -= pen;
        camp.rep -= Math.min(10, Math.round(R.overspeedSecs / 4) + 2);
        lines.push({ label: `Overspeed — ${Math.round(R.overspeedSecs)}s, up to ${Math.round(R.worstOverspeed)} mph over`, amount: -pen });
    }

    if (R.crossingStrike) {
        money -= 2400;
        camp.rep -= 10;
        camp.morale[chapter.run.town || 'marrow'] = (camp.morale[chapter.run.town || 'marrow'] ?? 55) - 6;
        lines.push({ label: 'Struck a vehicle on a crossing', amount: -2400 });
    }

    const fuelCost = Math.round(R.fuelUsed * 1.35);
    if (fuelCost > 0) { money -= fuelCost; lines.push({ label: 'Fuel', amount: -fuelCost }); }

    camp.stats.emergencies += R.emergencies;
    camp.stats.runs++;
    camp.stats.miles += R.miles;

    // Wear applied to the machine you actually used.
    const ls = camp.locos[chapter.run.loco];
    if (ls) {
        ls.cond.traction = clamp(ls.cond.traction - R.wear.traction);
        ls.cond.brakes   = clamp(ls.cond.brakes   - R.wear.brakes);
        ls.cond.prime    = clamp(ls.cond.prime    - R.wear.prime);
        ls.cond.cooling  = clamp(ls.cond.cooling  - R.wear.cooling);
        ls.hours += R.time / 3600;
    }

    // The valley notices whether the train came.
    const dest = chapter.run.to;
    if (camp.morale[dest] !== undefined) {
        camp.morale[dest] = clamp(camp.morale[dest] + (R.success ? 4 : -7));
    }
    if (!R.success) camp.crew = clamp(camp.crew - 8);
    else camp.crew = clamp(camp.crew + 2);

    const perfect = R.success && R.spads === 0 && R.emergencies === 0 &&
                    R.cargoLost === 0 && R.time <= chapter.run.schedule;
    if (perfect) {
        camp.stats.perfect++;
        camp.rep += 4;
        money += 400;
        lines.push({ label: 'A clean trip', amount: 400 });
    }

    camp.money += money;
    camp.rep = clamp(camp.rep);
    camp.crew = clamp(camp.crew);

    camp.log.push({
        chapter: chapter.title,
        time: R.time, success: R.success, net: money,
    });

    return { lines, net: money, perfect, settled: true };
}

export function applyEffect(camp, eff) {
    if (!eff) return;
    if (eff.money) camp.money += eff.money;
    if (eff.rep) camp.rep = clamp(camp.rep + eff.rep);
    if (eff.flag) camp.flags[eff.flag] = true;
    if (eff.morale) {
        for (const [k, v] of Object.entries(eff.morale)) {
            if (k === 'crew') camp.crew = clamp(camp.crew + v * 4);
            else if (camp.morale[k] !== undefined) camp.morale[k] = clamp(camp.morale[k] + v * 3);
        }
    }
}

export const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function currentChapter(camp) { return CHAPTERS[camp.chapter] ?? null; }

export function valleyHealth(camp) {
    const m = Object.values(camp.morale);
    return m.reduce((a, b) => a + b, 0) / m.length;
}

/** A one-line read on how the railway is doing, for the depot header. */
export function standing(camp) {
    const v = valleyHealth(camp);
    if (camp.money < 0)  return { text: 'Insolvent — and still running trains', cls: 'bad' };
    if (v > 78 && camp.rep > 55) return { text: 'The valley depends on you, and knows it', cls: 'good' };
    if (v > 60)          return { text: 'Holding on', cls: '' };
    if (v > 40)          return { text: 'People are starting to make other arrangements', cls: 'warn' };
    return { text: 'The valley is leaving', cls: 'bad' };
}

export { LOCOS };
