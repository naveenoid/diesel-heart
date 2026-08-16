/* ── Campaign state ───────────────────────────────────────────────────────────
   The scoreboard is goodwill, not money.

   Money is a constraint: below zero you cannot fuel, fix or pay anybody, and
   the railway stops. Above that it does nothing for you. Science freight is
   what pays — Peregrine, the isotope flasks, the instrument vans — and if you
   run only science you will be solvent and the valley will quietly stop
   needing you, which is the only way a short line actually dies.

   People are what the goodwill comes from. Carrying them on time and smoothly,
   and especially during a festival, is worth more than any contract on the
   book. Delivering science intact earns some goodwill too — competence is its
   own kind of trust — but never as much.

   And goodwill is not only a score. It is subtracted from the baggage: the
   better the valley thinks of you, the less of its unfinished business you are
   dragging up the hill behind the engine. */

import { LOCOS, CARS, newLocoState, locoHealth } from '../data/roster.js';
import { CHAPTERS } from '../data/story.js';

export const TOWNS = {
    kottapuram: { name: 'Kottapuram',    pop: 410000, city: true },
    marrow:     { name: 'Marrow Bend',   pop: 900   },
    tannery:    { name: 'Tannery Flats', pop: 1400  },
    coldspring: { name: 'Coldspring',    pop: 400   },
    kestrel:    { name: 'Kestrel Gap',   pop: 210   },
};

/** The base weight of everything the railway has not finished carrying. */
export const BAGGAGE_BASE = 30000;

export function newCampaign() {
    return {
        version: 4,
        chapter: 0,
        money: 4200,
        goodwill: 40,                 // the score, 0..100
        rep: 12,                      // standing with Continental Pacific
        crew: 60,
        towns: { kottapuram: 30, marrow: 55, tannery: 50, coldspring: 48, kestrel: 52 },
        flags: {},
        locos: {
            wdm2:   newLocoState('wdm2'),
            e33:    newLocoState('e33'),
            rs3:    newLocoState('rs3'),
            sw1500: newLocoState('sw1500'),
        },
        abbIntact: true,              // the device has never been dropped
        hauled: { people: 0, science: 0, freight: 0 },
        log: [],
        stats: { runs: 0, miles: 0, onTime: 0, spads: 0, emergencies: 0, perfect: 0,
                 festivals: 0, rescues: 0, heritage: 0 },
    };
}

/**
 * What the baggage car weighs today. At no goodwill it is the full thirty
 * tonnes of other people's unfinished business; at full goodwill it is under
 * ten, because most of it has been dealt with by people who wanted to help.
 */
export function baggageMass(camp) {
    return Math.round(BAGGAGE_BASE * (1 - (camp.goodwill / 100) * 0.7));
}

/* ── Repairs ──────────────────────────────────────────────────────────────────
   The right way costs money you do not have. The other way costs you a chance
   of it letting go on the hill. */

export const REPAIRS = [
    { id:'proper-prime',    comp:'prime',    label:'Overhaul prime mover',   cost: 3800, gain: 100, jugaad:false,
      note:'Injectors, heads, the lot. Four days in the shed.' },
    { id:'proper-traction', comp:'traction', label:'Rewind traction motor',  cost: 4600, gain: 100, jugaad:false,
      note:'Sent out. Eight weeks if you are lucky, so plan around it.' },
    { id:'proper-brakes',   comp:'brakes',   label:'Reline brake rigging',   cost: 1900, gain: 100, jugaad:false,
      note:'New shoes, new pins, correct clearances.' },
    { id:'proper-cooling',  comp:'cooling',  label:'New radiator core',      cost: 3100, gain: 100, jugaad:false,
      note:'The thing Meera has wanted since August.' },

    { id:'bodge-prime',     comp:'prime',    label:'Jugaad: swap a good injector across',   cost: 260, gain: 42, jugaad:true, risk:0.28,
      steal:{ loco:'rs3', comp:'prime', amount:16 },
      note:'Robs a spare off the Fox. She will notice eventually.' },
    { id:'bodge-traction',  comp:'traction', label:'Jugaad: shim the brush gear',           cost: 180, gain: 38, jugaad:true, risk:0.34,
      note:'Holds if you never let him slip. Never is a strong word.' },
    { id:'bodge-brakes',    comp:'brakes',   label:'Jugaad: turn the shoes and re-pin',     cost: 140, gain: 34, jugaad:true, risk:0.22,
      note:'Buys a month. Emergency applications spend it faster.' },
    { id:'bodge-cooling',   comp:'cooling',  label:'Jugaad: braze the core, bypass a bank', cost: 220, gain: 40, jugaad:true, risk:0.31,
      note:'She will run hotter. She will run.' },
];

/* ── Care ─────────────────────────────────────────────────────────────────────
   Only the Missus has this, and only the Missus needs it. Care is not a repair;
   it is the hours somebody spends on a ninety-seven-year-old machine so that it
   does not let go of a joint on a hill with a hundred people behind it. */

export const CARE_ACTIONS = [
    { id:'washout', label:'Boiler washout and tube clean',     cost: 420, gain: 34,
      note:'Two days and Meera\'s temper. Nothing else moves the needle like it.' },
    { id:'packing', label:'Repack the glands, ease the motion', cost: 190, gain: 16,
      note:'An evening with an oil can and a feeler gauge.' },
    { id:'polish',  label:'Clean her properly, before the show', cost: 90, gain: 8, goodwill: 3,
      note:'Does nothing mechanical. The town turns out anyway.' },
];

/** Chance per second of blowing a joint, given how she is being worked. */
export function blowoutRisk(loco, ls, regulatorFrac, steamFrac) {
    if (loco.kind !== 'steam') return 0;
    const care = (ls.care ?? 0) / 100;
    const boiler = (ls.cond.cooling ?? 100) / 100;
    /* Wide open on a tired, neglected boiler is where joints let go. Care is
       squared so that looking after her genuinely protects her: cared-for and
       flat out is a risk you can take once, neglected and flat out is a coin
       toss you will lose. Anything at or under half regulator is safe, which is
       the whole of Meera's advice made mechanical. */
    const strain = Math.max(0, regulatorFrac - 0.55) / 0.45;
    return (loco.blowoutBase ?? 0) * strain * Math.pow(1.25 - care, 2)
         * (1.35 - boiler * 0.8) * (steamFrac > 0.8 ? 1.3 : 1);
}

/* ── Settlement ──────────────────────────────────────────────────────────── */

export function settleRun(camp, chapter, result) {
    const R = result;
    const lines = [];        // money
    const gw = [];           // goodwill
    let money = 0, good = 0;

    const cars = R.cars || [];
    const people  = cars.filter(c => CARS[c]?.kind === 'people');
    const science = cars.filter(c => CARS[c]?.kind === 'science');
    const freight = cars.filter(c => CARS[c]?.kind === 'freight');

    /* ── Money. Science pays; people do not, and never have. ── */
    const revenue = cars.reduce((a, c) => a + (CARS[c]?.pay || 0), 0) + (chapter.run.pay || 0);
    money += revenue;
    if (revenue) lines.push({ label: `${chapter.run.title} — waybills`, amount: revenue });

    /* ── Goodwill. ── */
    if (R.success) {
        // Comfort matters to people in a way it never does to a hopper.
        const smooth = Math.max(0.35, 1 - R.peakShock * 0.8);
        const punctual = R.time <= chapter.run.schedule ? 1
                       : (R.time <= chapter.run.hardLimit ? 0.6 : 0.15);

        let peopleGw = 0;
        for (const c of people) peopleGw += CARS[c].goodwill * smooth * punctual;
        peopleGw = Math.round(peopleGw);
        if (peopleGw > 0) {
            good += peopleGw;
            gw.push({ label: `${people.length} vehicle${people.length > 1 ? 's' : ''} of people, carried well`, amount: peopleGw });
        }

        // Competence earns trust, just less of it.
        let sciGw = 0;
        if (R.cargoLost < 0.02) for (const c of science) sciGw += CARS[c].goodwill * 0.6;
        sciGw = Math.round(sciGw);
        if (sciGw > 0) { good += sciGw; gw.push({ label: 'Science freight delivered intact', amount: sciGw }); }

        const frGw = Math.round(freight.reduce((a, c) => a + CARS[c].goodwill, 0) * 0.5);
        if (frGw > 0) { good += frGw; gw.push({ label: 'The ordinary traffic, on time', amount: frGw }); }

        if (chapter.run.festival) { good += 10; camp.stats.festivals++;
            gw.push({ label: `${chapter.run.festival} — the whole valley travelled`, amount: 10 }); }
        if (chapter.run.heritage) { good += 8; camp.stats.heritage++;
            gw.push({ label: 'The Missus out in front of a crowd', amount: 8 }); }
        if (chapter.run.rescue)   { good += 12; camp.stats.rescues++;
            gw.push({ label: 'The road cleared and the line reopened', amount: 12 }); }
    } else {
        good -= 14;
        gw.push({ label: 'The train did not arrive', amount: -14 });
    }

    /* ── What it costs to behave like an accountant. ── */
    if (R.refusedPeople > 0) {
        const pen = R.refusedPeople * 5;
        good -= pen;
        gw.push({ label: `${R.refusedPeople} passenger vehicle${R.refusedPeople > 1 ? 's' : ''} left standing on the platform`, amount: -pen });
    }
    if (R.cargoLost > 0.01) {
        const pen = Math.round(revenue * R.cargoLost);
        money -= pen;
        good -= Math.round(R.cargoLost * 6);
        lines.push({ label: 'Damaged lading', amount: -pen });
    }
    if (R.abbDamaged) {
        camp.abbIntact = false;
        good -= 18;
        gw.push({ label: 'The ABB device was shaken', amount: -18 });
    }

    /* ── Punctuality, safety, fuel. ── */
    if (R.time <= chapter.run.schedule) {
        const bonus = Math.round(revenue * 0.12);
        money += bonus; camp.rep += 3; camp.stats.onTime++;
        if (bonus) lines.push({ label: 'In the slot', amount: bonus });
    } else if (R.time > chapter.run.hardLimit) {
        const pen = Math.round(revenue * 0.35);
        money -= pen; camp.rep -= 6; good -= 4;
        if (pen) lines.push({ label: 'Missed the slot entirely', amount: -pen });
    } else camp.rep -= 1;

    if (R.spads > 0) {
        money -= 900 * R.spads; camp.rep -= 14 * R.spads; good -= 6 * R.spads;
        camp.stats.spads += R.spads;
        lines.push({ label: `Signal passed at danger ×${R.spads}`, amount: -900 * R.spads });
    }
    if (R.overspeedSecs > 1.5) {
        const pen = Math.min(1800, Math.round(R.overspeedSecs * 22 + R.worstOverspeed * 30));
        money -= pen; camp.rep -= Math.min(10, Math.round(R.overspeedSecs / 4) + 2);
        lines.push({ label: `Overspeed — ${Math.round(R.overspeedSecs)}s`, amount: -pen });
    }
    if (R.crossingStrike) {
        money -= 2400; camp.rep -= 10; good -= 12;
        lines.push({ label: 'Struck a vehicle on a crossing', amount: -2400 });
        gw.push({ label: 'A crossing strike, in front of everybody', amount: -12 });
    }
    if (R.blowout) {
        money -= 1500;
        lines.push({ label: 'The Missus blew a joint — gasket set and two days', amount: -1500 });
    }
    const fuelCost = Math.round(R.fuelUsed * 1.35);
    if (fuelCost > 0) { money -= fuelCost; lines.push({ label: 'Fuel', amount: -fuelCost }); }

    /* ── Apply. ── */
    camp.stats.emergencies += R.emergencies;
    camp.stats.runs++;
    camp.stats.miles += R.miles;
    camp.hauled.people += people.length;
    camp.hauled.science += science.length;
    camp.hauled.freight += freight.length;

    const ls = camp.locos[chapter.run.loco];
    if (ls) {
        const bias = LOCOS[chapter.run.loco].wearBias ?? 1;
        for (const k of ['traction', 'brakes', 'prime', 'cooling'])
            ls.cond[k] = clamp(ls.cond[k] - R.wear[k] * bias);
        ls.hours += R.time / 3600;
        if (ls.care !== undefined) ls.care = clamp(ls.care - (R.blowout ? 22 : 8));
    }

    // The Fox and Gundu are why anybody turns up at four in the morning.
    const cheer = ['rs3', 'sw1500'].map(id => locoHealth(camp.locos[id]))
                                   .reduce((a, b) => a + b, 0) / 2;
    camp.crew = clamp(camp.crew + (R.success ? 2 : -8) + (cheer > 75 ? 2 : cheer < 40 ? -2 : 0));

    const dest = chapter.run.to;
    if (camp.towns[dest] !== undefined)
        camp.towns[dest] = clamp(camp.towns[dest] + (R.success ? good * 0.5 : -8));

    const perfect = R.success && R.spads === 0 && R.emergencies === 0 &&
                    R.cargoLost === 0 && R.time <= chapter.run.schedule;
    if (perfect) {
        camp.stats.perfect++; camp.rep += 4; good += 3; money += 300;
        lines.push({ label: 'A clean trip', amount: 300 });
        gw.push({ label: 'Nothing to write up', amount: 3 });
    }

    /* ── The drift. Run nothing but science and the valley stops needing you,
          slowly, without anybody being rude about it. ── */
    const h = camp.hauled;
    const total = h.people + h.science + h.freight;
    if (total > 6 && h.people / total < 0.22) {
        good -= 4;
        gw.push({ label: 'Almost nothing but contract freight lately', amount: -4 });
    }

    camp.money += money;
    camp.goodwill = clamp(camp.goodwill + good);
    camp.rep = clamp(camp.rep);
    camp.crew = clamp(camp.crew);

    camp.log.push({ chapter: chapter.title, time: R.time, success: R.success, net: money, goodwill: good });

    return { lines, gw, net: money, goodwillDelta: good, perfect, settled: true };
}

export function applyEffect(camp, eff) {
    if (!eff) return;
    if (eff.money) camp.money += eff.money;
    if (eff.rep) camp.rep = clamp(camp.rep + eff.rep);
    if (eff.goodwill) camp.goodwill = clamp(camp.goodwill + eff.goodwill);
    if (eff.flag) camp.flags[eff.flag] = true;
    if (eff.care && camp.locos.e33) camp.locos.e33.care = clamp(camp.locos.e33.care + eff.care);
    if (eff.morale) {
        for (const [k, v] of Object.entries(eff.morale)) {
            if (k === 'crew') camp.crew = clamp(camp.crew + v * 4);
            else if (camp.towns[k] !== undefined) camp.towns[k] = clamp(camp.towns[k] + v * 3);
        }
    }
}

export const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function currentChapter(camp) { return CHAPTERS[camp.chapter] ?? null; }

export function valleyHealth(camp) {
    const m = Object.values(camp.towns);
    return m.reduce((a, b) => a + b, 0) / m.length;
}

/** A one-line read on how the railway is doing, for the depot header. */
export function standing(camp) {
    if (camp.money < 0)      return { text: 'Insolvent. The bank is not the problem; the fuel is.', cls: 'bad' };
    if (camp.goodwill > 78)  return { text: 'The valley has stopped thinking of you as a railway. It thinks of you as theirs.', cls: 'good' };
    if (camp.goodwill > 58)  return { text: 'People plan their day around your timetable, which is the highest compliment there is', cls: 'good' };
    if (camp.goodwill > 38)  return { text: 'Holding on', cls: '' };
    if (camp.goodwill > 20)  return { text: 'People are starting to make other arrangements', cls: 'warn' };
    return { text: 'The valley is leaving, and it will not say so first', cls: 'bad' };
}

export { LOCOS };
