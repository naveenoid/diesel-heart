/* ── The Sable Valley line ────────────────────────────────────────────────────
   Twelve miles from the interchange to the end of track, and it climbs the
   whole way. Everything is authored once, west to east, ascending. A run slices
   a piece out of it and — if you are going downhill toward Halloway — mirrors
   it, so the simulation and the renderer only ever deal with a train moving
   left to right on rising or falling ground.

   Twelve miles is small enough that one trip is an evening's drive rather
   than a commute, and large enough that Sabre Hill sits in the middle of it. */

/* Distances are honest. A milepost, the briefing's mileage, the "to go"
   readout and the clock all reconcile, because the valley really is as long as
   it simulates: twelve miles of it, which is a short line's whole world. */
export const MILE = 1609.34;
export const LINE_LENGTH = 19_500;         // ≈ 12.1 miles, end to end

export const NODES = {
    halloway:  { s: 0,      name: 'Halloway Junction', short: 'HAL', kind: 'interchange',
                 note: 'Continental Pacific territory. Their signals, their patience.' },
    marrow:    { s: 3_200,  name: 'Marrow Bend',       short: 'MRB', kind: 'hq',
                 note: 'Enginehouse, one platform, and the office above the freight room.' },
    tannery:   { s: 7_000,  name: 'Tannery Flats',     short: 'TAN', kind: 'industry',
                 note: 'The mill. The last big employer in the valley.' },
    coldspring:{ s: 13_500, name: 'Coldspring',        short: 'CSP', kind: 'town',
                 note: 'Four hundred people and a clinic that serves four thousand.' },
    kestrel:   { s: 17_000, name: 'Kestrel Gap',       short: 'KGP', kind: 'depot',
                 note: 'Fuel, the radio relay, and the wind coming through the pass.' },
    ostrand:   { s: 19_500, name: 'Ostrand',           short: 'OST', kind: 'end',
                 note: 'End of track. Peregrine\'s lab is the road switchbacking up behind it.' },
};

/* Grade, as rise over run, applying from `s` until the next entry. */
const GRADE = [
    { s: 0,      g:  0.0000 },
    { s: 900,    g:  0.0045 },
    { s: 1_800,  g:  0.0020 },
    { s: 2_450,  g: -0.0015 },   // the dip at the river
    { s: 3_050,  g:  0.0035 },
    { s: 4_200,  g:  0.0060 },
    { s: 5_300,  g:  0.0025 },
    { s: 6_400,  g: -0.0020 },
    { s: 7_300,  g:  0.0080 },
    { s: 8_400,  g:  0.0120 },
    { s: 9_100,  g:  0.0175 },
    { s: 9_800,  g:  0.0220 },   // Sabre Hill proper
    { s: 10_900, g:  0.0205 },
    { s: 11_300, g:  0.0060 },
    { s: 11_650, g:  0.0000 },   // summit board
    { s: 11_950, g: -0.0110 },
    { s: 12_900, g: -0.0070 },
    { s: 13_350, g:  0.0000 },
    { s: 13_900, g:  0.0090 },
    { s: 15_100, g:  0.0140 },
    { s: 16_100, g:  0.0180 },
    { s: 16_800, g:  0.0040 },
    { s: 17_200, g: -0.0055 },
    { s: 18_600, g: -0.0090 },
];

/* Permanent speed restrictions. `v` in m/s; anything not covered runs at the
   line speed of 29 m/s (65 mph), which nothing we own can reach anyway. */
const LIMITS = [
    { s0: 0,      s1: 700,    v: 8,    why: 'Halloway yard limits' },
    { s0: 1_950,  s1: 2_320,  v: 13.5, why: 'Sable River bridge' },
    { s0: 2_950,  s1: 3_600,  v: 8,    why: 'Marrow Bend yard limits' },
    { s0: 6_750,  s1: 7_400,  v: 9,    why: 'Tannery Flats — mill crossings' },
    { s0: 9_600,  s1: 11_400, v: 11,   why: 'Sabre curves' },
    { s0: 13_200, s1: 13_900, v: 8,    why: 'Coldspring station limits' },
    { s0: 16_700, s1: 17_350, v: 9,    why: 'Kestrel Gap depot' },
    { s0: 19_050, s1: 19_500, v: 6,    why: 'End of track' },
];

/* Passing loops. On a single-track railway these are the whole game: they are
   the only places two trains can be in the same mile and both survive. */
const SIDINGS = [
    { s0: 2_980,  s1: 3_620,  name: 'Marrow Bend loop' },
    { s0: 5_350,  s1: 6_050,  name: 'Wilder siding' },
    { s0: 6_880,  s1: 7_480,  name: 'Tannery Flats loop' },
    { s0: 10_150, s1: 10_820, name: 'Sabre siding' },
    { s0: 13_280, s1: 13_920, name: 'Coldspring loop' },
    { s0: 16_820, s1: 17_460, name: 'Kestrel Gap loop' },
];

/* Absolute signals at block boundaries. The blocks between them are what
   Halloway's dispatcher is actually allocating when he decides your day. */
const SIGNALS = [
    { s: 620,    name: 'HJ-2'  },
    { s: 1_700,  name: '4'     },
    { s: 2_900,  name: '8'     },
    { s: 3_680,  name: '11'    },
    { s: 5_280,  name: '16'    },
    { s: 6_100,  name: '19'    },
    { s: 6_810,  name: '22'    },
    { s: 7_540,  name: '24'    },
    { s: 8_900,  name: '29'    },
    { s: 10_080, name: '33'    },
    { s: 10_880, name: '35'    },
    { s: 12_200, name: '40'    },
    { s: 13_210, name: '43'    },
    { s: 13_980, name: '45'    },
    { s: 15_400, name: '50'    },
    { s: 16_750, name: '54'    },
    { s: 17_520, name: '56'    },
    { s: 18_700, name: '60'    },
];

/* Unmanned crossings. Whistle boards stand 240 m out; if you have not sounded
   the horn by the time you reach the road, whatever is on it is on it. */
const CROSSINGS = [
    { s: 4_600,  name: 'Poll Road'       },
    { s: 8_300,  name: 'Erskine Crossing'},
    { s: 12_400, name: 'Hollow Lane'     },
    { s: 15_900, name: 'Gap Road'        },
    { s: 18_400, name: 'Ostrand Mill Rd' },
];

/* Lineside furniture — scenery with a name, so the valley reads as a place
   rather than a texture. `type` selects the drawing routine. */
const LANDMARKS = [
    { s: 1_050,  type: 'watertower', name: 'Halloway tank' },
    { s: 2_140,  type: 'bridge',     name: 'Sable River',      span: 300 },
    { s: 3_260,  type: 'enginehouse',name: 'Marrow Bend shed' },
    { s: 4_980,  type: 'farm',       name: 'Ivers place' },
    { s: 6_950,  type: 'mill',       name: 'Tannery mill',     span: 260 },
    { s: 8_050,  type: 'shrine',     name: 'The trackside shrine' },
    { s: 9_720,  type: 'rockcut',    name: 'Sabre cut',        span: 420 },
    { s: 11_640, type: 'summit',     name: 'SABRE — 2,148 FT' },
    { s: 12_800, type: 'trestle',    name: 'Hollow trestle',   span: 240 },
    { s: 13_620, type: 'clinic',     name: 'Coldspring clinic' },
    { s: 15_600, type: 'snowshed',   name: 'Kestrel snowshed', span: 340 },
    { s: 17_100, type: 'fueldepot',  name: 'Gap fuel depot' },
    { s: 18_900, type: 'lab',        name: 'Peregrine road' },
];

/* ── Route construction ───────────────────────────────────────────────────── */

function lookupStep(list, p, key = 'g') {
    let v = list[0][key];
    for (const e of list) { if (p >= e.s) v = e[key]; else break; }
    return v;
}

/**
 * Slice the line between two nodes into a route the simulation can drive.
 * Distances in the returned object are "sim metres from the start of the run",
 * always increasing, regardless of compass direction.
 */
export function buildRoute(fromKey, toKey) {
    const a = NODES[fromKey].s, b = NODES[toKey].s;
    const dir = b > a ? 1 : -1;
    const len = Math.abs(b - a);

    // sim distance -> position on the canonical line
    const toLine = s => a + dir * s;
    const inRange = p => p >= Math.min(a, b) - 1 && p <= Math.max(a, b) + 1;
    const toSim = p => Math.abs(p - a);

    // Grade sampled onto the run. Going downhill flips the sign: the same
    // hillside that fought you this morning is trying to run away with you now.
    const grade = [];
    for (let s = 0; s <= len; s += 25) {
        grade.push(dir > 0 ? lookupStep(GRADE, toLine(s))
                           : -lookupStep(GRADE, toLine(s)));
    }

    const limits = LIMITS
        .filter(l => l.s1 >= Math.min(a, b) && l.s0 <= Math.max(a, b))
        .map(l => {
            const x0 = toSim(l.s0), x1 = toSim(l.s1);
            return { s0: Math.max(0, Math.min(x0, x1)), s1: Math.min(len, Math.max(x0, x1)), v: l.v, why: l.why };
        })
        .sort((p, q) => p.s0 - q.s0);

    const sidings = SIDINGS
        .filter(x => x.s1 >= Math.min(a, b) && x.s0 <= Math.max(a, b))
        .map(x => {
            const x0 = toSim(x.s0), x1 = toSim(x.s1);
            return { s0: Math.min(x0, x1), s1: Math.max(x0, x1), name: x.name };
        })
        .filter(x => x.s0 > 120 && x.s1 < len - 120)   // unusable if it straddles the start
        .sort((p, q) => p.s0 - q.s0);

    const pick = list => list.filter(x => inRange(x.s))
                             .map(x => ({ ...x, s: toSim(x.s) }))
                             .sort((p, q) => p.s - q.s);

    const stations = Object.entries(NODES)
        .filter(([, n]) => inRange(n.s))
        .map(([id, n]) => ({ ...n, id, s: toSim(n.s) }))
        .sort((p, q) => p.s - q.s);

    return {
        from: fromKey, to: toKey, dir, length: len,
        name: `${NODES[fromKey].name} → ${NODES[toKey].name}`,
        mp0: NODES[fromKey].s / MILE,
        mp1: NODES[toKey].s / MILE,
        grade, limits,
        sidings,
        signals:   pick(SIGNALS),
        crossings: pick(CROSSINGS),
        landmarks: pick(LANDMARKS),
        stations,

        /** Grade (rise/run) at sim distance s. Positive means uphill. */
        gradeAt(s) {
            const i = Math.max(0, Math.min(this.grade.length - 1, Math.round(s / 25)));
            return this.grade[i];
        },
        /** Smoothed grade, for tilting the world without the horizon snapping. */
        gradeSmooth(s) {
            let sum = 0, n = 0;
            for (let d = -150; d <= 150; d += 50) { sum += this.gradeAt(s + d); n++; }
            return sum / n;
        },
        /** Permitted speed at s, in m/s. */
        limitAt(s) {
            let v = 29;
            for (const l of this.limits) if (s >= l.s0 && s <= l.s1) v = Math.min(v, l.v);
            return v;
        },
        limitReason(s) {
            for (const l of this.limits) if (s >= l.s0 && s <= l.s1) return l.why;
            return null;
        },
        /** Fictional milepost for display. */
        mpAt(s) { return (NODES[fromKey].s + this.dir * s) / MILE; },
    };
}

/** Total climb over a route, in fictional metres — the briefing's warning. */
export function routeClimb(route) {
    let up = 0;
    for (let s = 0; s < route.length; s += 25) up += Math.max(0, route.gradeAt(s)) * 25;
    return up;
}
