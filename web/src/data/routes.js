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
    kottapuram:{ s: 0,      name: 'Kottapuram Central', short: 'KTP', kind: 'city',
                 note: 'Eleven platforms, four hundred thousand people, and none of it ours.' },
    perambur:  { s: 1_850,  name: 'Perambur Road',      short: 'PBR', kind: 'suburb',
                 note: 'Where the city stops pretending it is not a city.' },
    vandalur:  { s: 3_400,  name: 'Vandalur Gate',      short: 'VDR', kind: 'suburb',
                 note: 'The last level crossing before the country starts.' },
    halloway:  { s: 4200,      name: 'Halloway Junction', short: 'HAL', kind: 'interchange',
                 note: 'Continental Pacific territory. Their signals, their patience.' },
    marrow:    { s: 7400,  name: 'Marrow Bend',       short: 'MRB', kind: 'hq',
                 note: 'Enginehouse, one platform, and the office above the freight room.' },
    tannery:   { s: 11200,  name: 'Tannery Flats',     short: 'TAN', kind: 'industry',
                 note: 'The mill. The last big employer in the valley.' },
    coldspring:{ s: 17700, name: 'Coldspring',        short: 'CSP', kind: 'town',
                 note: 'Four hundred people and a clinic that serves four thousand.' },
    kestrel:   { s: 21200, name: 'Kestrel Gap',       short: 'KGP', kind: 'depot',
                 note: 'Fuel, the radio relay, and the wind coming through the pass.' },
    ostrand:   { s: 23700, name: 'Ostrand',           short: 'OST', kind: 'end',
                 note: 'End of track. Peregrine\'s lab is the road switchbacking up behind it.' },
};

/* Grade, as rise over run, applying from `s` until the next entry. */
const GRADE = [
    { s: 0,      g:  0.0000 },   // Kottapuram, flat as a table
    { s: 1_400,  g:  0.0018 },
    { s: 2_600,  g: -0.0012 },   // under the flyover
    { s: 3_500,  g:  0.0040 },
    { s: 4_000,  g:  0.0025 },
    { s: 4200,      g:  0.0000 },
    { s: 5100,    g:  0.0045 },
    { s: 6000,  g:  0.0020 },
    { s: 6650,  g: -0.0015 },   // the dip at the river
    { s: 7250,  g:  0.0035 },
    { s: 8400,  g:  0.0060 },
    { s: 9500,  g:  0.0025 },
    { s: 10600,  g: -0.0020 },
    { s: 11500,  g:  0.0080 },
    { s: 12600,  g:  0.0120 },
    { s: 13300,  g:  0.0175 },
    { s: 14000,  g:  0.0220 },   // Sabre Hill proper
    { s: 15100, g:  0.0205 },
    { s: 15500, g:  0.0060 },
    { s: 15850, g:  0.0000 },   // summit board
    { s: 16150, g: -0.0110 },
    { s: 17100, g: -0.0070 },
    { s: 17550, g:  0.0000 },
    { s: 18100, g:  0.0090 },
    { s: 19300, g:  0.0140 },
    { s: 20300, g:  0.0180 },
    { s: 21000, g:  0.0040 },
    { s: 21400, g: -0.0055 },
    { s: 22800, g: -0.0090 },
];

/* Permanent speed restrictions. `v` in m/s; anything not covered runs at the
   line speed of 29 m/s (65 mph), which nothing we own can reach anyway. */
const LIMITS = [
    { s0: 0,     s1: 900,   v: 6.5, why: 'Kottapuram platform roads' },
    { s0: 900,   s1: 2_100, v: 10,  why: 'Suburban lines — footpath crossings' },
    { s0: 2_100, s1: 2_700, v: 7,   why: 'Perambur market crossing' },
    { s0: 2_700, s1: 3_600, v: 11,  why: 'Vandalur curves' },
    { s0: 3_600, s1: 4_200, v: 14,  why: 'Leaving city limits' },
    { s0: 4200,      s1: 4900,    v: 8,    why: 'Halloway yard limits' },
    { s0: 6150,  s1: 6520,  v: 13.5, why: 'Sable River bridge' },
    { s0: 7150,  s1: 7800,  v: 8,    why: 'Marrow Bend yard limits' },
    { s0: 10950,  s1: 11600,  v: 9,    why: 'Tannery Flats — mill crossings' },
    { s0: 13800,  s1: 15600, v: 11,   why: 'Sabre curves' },
    { s0: 17400, s1: 18100, v: 8,    why: 'Coldspring station limits' },
    { s0: 20900, s1: 21550, v: 9,    why: 'Kestrel Gap depot' },
    { s0: 23250, s1: 23700, v: 6,    why: 'End of track' },
];

/* Passing loops. On a single-track railway these are the whole game: they are
   the only places two trains can be in the same mile and both survive. */
const SIDINGS = [
    { s0: 700,   s1: 1_400, name: 'Kottapuram carriage road' },
    { s0: 2_150,  s1: 2_760, name: 'Perambur loop' },
    { s0: 3_500,  s1: 4_060, name: 'Vandalur loop' },
    { s0: 7180,  s1: 7820,  name: 'Marrow Bend loop' },
    { s0: 9550,  s1: 10250,  name: 'Wilder siding' },
    { s0: 11080,  s1: 11680,  name: 'Tannery Flats loop' },
    { s0: 14350, s1: 15020, name: 'Sabre siding' },
    { s0: 17480, s1: 18120, name: 'Coldspring loop' },
    { s0: 21020, s1: 21660, name: 'Kestrel Gap loop' },
];

/* Absolute signals at block boundaries. The blocks between them are what
   Halloway's dispatcher is actually allocating when he decides your day. */
const SIGNALS = [
    { s: 340,    name: 'KTP-6' },
    { s: 780,    name: 'KTP-9' },
    { s: 1_280,  name: 'PB-2'  },
    { s: 1_760,  name: 'PB-5'  },
    { s: 2_220,  name: 'PB-8'  },
    { s: 2_820,  name: 'VD-1'  },
    { s: 3_320,  name: 'VD-4'  },
    { s: 3_880,  name: 'VD-7'  },
    { s: 4820,    name: 'HJ-2'  },
    { s: 5900,  name: '4'     },
    { s: 7100,  name: '8'     },
    { s: 7880,  name: '11'    },
    { s: 9480,  name: '16'    },
    { s: 10300,  name: '19'    },
    { s: 11010,  name: '22'    },
    { s: 11740,  name: '24'    },
    { s: 13100,  name: '29'    },
    { s: 14280, name: '33'    },
    { s: 15080, name: '35'    },
    { s: 16400, name: '40'    },
    { s: 17410, name: '43'    },
    { s: 18180, name: '45'    },
    { s: 19600, name: '50'    },
    { s: 20950, name: '54'    },
    { s: 21720, name: '56'    },
    { s: 22900, name: '60'    },
];

/* Unmanned crossings. Whistle boards stand 240 m out; if you have not sounded
   the horn by the time you reach the road, whatever is on it is on it. */
const CROSSINGS = [
    { s: 1_150,  name: 'Kandan Street'   },
    { s: 2_320,  name: 'Perambur Market' },
    { s: 2_980,  name: 'Mill Lane gate'  },
    { s: 3_420,  name: 'Vandalur Gate'   },
    { s: 8800,  name: 'Poll Road'       },
    { s: 12500,  name: 'Erskine Crossing'},
    { s: 16600, name: 'Hollow Lane'     },
    { s: 20100, name: 'Gap Road'        },
    { s: 22600, name: 'Ostrand Mill Rd' },
];

/* Lineside furniture — scenery with a name, so the valley reads as a place
   rather than a texture. `type` selects the drawing routine. */
const LANDMARKS = [
    { s: 260,    type: 'citystation', name: 'Kottapuram Central', span: 420 },
    { s: 900,    type: 'tenements',   name: 'Kandan Street',      span: 520 },
    { s: 1_620,  type: 'gopuram',     name: 'Kandan temple' },
    { s: 2_320,  type: 'bazaar',      name: 'Perambur market',    span: 380 },
    { s: 2_620,  type: 'flyover',     name: 'The Perambur flyover', span: 300 },
    { s: 3_150,  type: 'tenements',   name: 'Vandalur lines',     span: 460 },
    { s: 3_900,  type: 'watertank',   name: 'Vandalur tank' },
    { s: 5250,  type: 'watertower', name: 'Halloway tank' },
    { s: 6340,  type: 'bridge',     name: 'Sable River',      span: 300 },
    { s: 7460,  type: 'enginehouse',name: 'Marrow Bend shed' },
    { s: 9180,  type: 'farm',       name: 'Ivers place' },
    { s: 11150,  type: 'mill',       name: 'Tannery mill',     span: 260 },
    { s: 12250,  type: 'shrine',     name: 'The trackside shrine' },
    { s: 13920,  type: 'rockcut',    name: 'Sabre cut',        span: 420 },
    { s: 15840, type: 'summit',     name: 'SABRE — 2,148 FT' },
    { s: 17000, type: 'trestle',    name: 'Hollow trestle',   span: 240 },
    { s: 17820, type: 'clinic',     name: 'Coldspring clinic' },
    { s: 19800, type: 'snowshed',   name: 'Kestrel snowshed', span: 340 },
    { s: 21300, type: 'fueldepot',  name: 'Gap fuel depot' },
    { s: 23100, type: 'lab',        name: 'Peregrine road' },
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
        /** Position on the canonical line — lets the renderer know where it is. */
        linePos(s) { return NODES[fromKey].s + this.dir * s; },
    };
}

/** Total climb over a route, in fictional metres — the briefing's warning. */
export function routeClimb(route) {
    let up = 0;
    for (let s = 0; s < route.length; s += 25) up += Math.max(0, route.gradeAt(s)) * 25;
    return up;
}
