/* ── The fleet ────────────────────────────────────────────────────────────────
   Four machines nobody else wanted, and everybody here has a name for.

     · Velaikkaran — வேலைக்காரன், "the one who does the work". He does all of
       it: freight, passengers, the festival extras, and the wreck train when
       there is a wreck. Nobody asks whether he is tired.
     · The Missus — 1928, Swiss, the pride of the fleet and the reason people
       come down to the fence. Pressure is a budget, and if you are careless
       with her she will blow a joint and stop the railway.
     · The Fox — quick, rust-coloured, wily, and older than anyone will admit.
     · Gundu — குண்டு, "roly-poly". Squat, slow, cheerful, never once failed
       to start.

   The differences live in numbers the physics reads every frame, because a
   personality that is only in the flavour text is a paint job. */

export const LOCOS = {

    wdm2: {
        id: 'wdm2',
        road: '#17',
        name: 'Velaikkaran',
        nick: 'Velai',
        cls: 'WDM-2',
        built: 1969,
        kind: 'diesel',
        blurb: 'Alco design, built under licence at Varanasi, worked a subcontinent ' +
               'for thirty years and came here on a scrapline manifest. Meera and her ' +
               'appa put him back together twice. He pulls whatever is in front of him.',
        mass: 112000,
        power: 1_940_000,          // 2,600 hp at the rail, near enough
        teMax: 300_000,
        maxSpeed: 33.5,            // m/s ≈ 75 mph
        notches: 8,
        dynamicBrake: 4,
        brakeForce: 0.62,
        heatGain: 1.55,
        heatShed: 0.95,
        heatRedline: 92,
        throttleLag: 1.5,
        fuelBurn: 0.55,
        idleThump: 2.35,           // the dhuk-dhuk-dhuk
        // He is the one who gets sent, so he is the one who wears out.
        wearBias: 1.35,
        carriesBaggage: true,
        rescueCapable: true,
        livery: { body: '#1d3f6b', roof: '#16304f', stripe: '#d1a04a', frame: '#20242a' },
        quirks: ['Runs hot above notch 6 — he will pull his own power back',
                 'Wears faster than the rest because he is always the one sent'],
    },

    e33: {
        id: 'e33',
        road: '#4',
        name: 'The Missus',
        nick: 'Missus',
        cls: 'SLM E 3/3',
        built: 1928,
        kind: 'steam',
        blurb: 'Winterthur, 1928. Came over in a container with a dead collector\'s ' +
               'estate, a crate of spares and a manual in Swiss German that took ' +
               'Meera four years and a dictionary. She is the pride of the fleet ' +
               'and she knows it.',
        mass: 45000,
        power: 300_000,
        teMax: 118_000,
        maxSpeed: 13.5,            // ≈ 30 mph
        notches: 8,                // regulator
        dynamicBrake: 0,
        brakeForce: 0.48,
        heatGain: 0, heatShed: 0, heatRedline: 100,
        throttleLag: 0.7,
        fuelBurn: 0,
        idleThump: 0.9,
        wearBias: 0.8,
        carriesBaggage: true,
        heritage: true,            // show trains: the goodwill she earns is enormous
        // Steam
        steamMax: 100,
        steamRecover: 3.6,
        steamDrain: 1.15,
        // Blowouts: hold her flat out on a tired boiler and a joint lets go.
        blowoutBase: 0.020,        // per second at full regulator; scaled hard by care
        livery: { body: '#22322c', roof: '#1a2622', stripe: '#8f2f28', frame: '#181b1f' },
        quirks: ['Pressure is a budget — spend it on the hills, not on the flat',
                 'Prone to blowing a joint if she is worked hard and not cared for',
                 'Heritage trains behind her are worth more goodwill than money'],
    },

    rs3: {
        id: 'rs3',
        road: '#22',
        name: 'The Fox',
        nick: 'Fox',
        cls: 'ALCO RS-3',
        built: 1953,
        kind: 'diesel',
        blurb: 'Rust-coloured since before anyone repainted her, quick on her feet ' +
               'and sly about it. Bought off a gravel pit in a state nobody visits. ' +
               'Dell claims she has moods; Dhanam Aunty claims she has opinions.',
        mass: 111000,
        power: 1_190_000,          // 1,600 hp
        teMax: 250_000,
        maxSpeed: 29,
        notches: 8,
        dynamicBrake: 0,
        brakeForce: 0.55,
        heatGain: 1.15,
        heatShed: 1.1,
        heatRedline: 95,
        throttleLag: 3.4,          // the famous Alco hesitation
        fuelBurn: 0.42,
        idleThump: 2.05,
        wearBias: 0.9,
        cheery: true,              // she and Gundu are why the crew keep turning up
        livery: { body: '#8a4a24', roof: '#5f3117', stripe: '#d8cdb8', frame: '#20242a' },
        quirks: ['Throttle response is a rumour — ask three seconds early',
                 'No dynamic brake. Plan the whole hill before you start down it'],
    },

    sw1500: {
        id: 'sw1500',
        road: '#1201',
        name: 'Gundu',
        nick: 'Gundu',
        cls: 'EMD SW1500',
        built: 1968,
        kind: 'diesel',
        blurb: 'Short, wide and permanently pleased with himself. A yard switcher ' +
               'doing road work because there is nobody else, and he has never once ' +
               'refused to start, in any weather, on any morning.',
        mass: 113000,
        power: 1_120_000,
        teMax: 245_000,
        maxSpeed: 20,              // ≈ 45 mph, geared for the yard
        notches: 8,
        dynamicBrake: 0,
        brakeForce: 0.6,
        heatGain: 0.8,
        heatShed: 1.35,
        heatRedline: 98,
        throttleLag: 1.1,
        fuelBurn: 0.34,
        idleThump: 2.6,
        wearBias: 0.75,
        cheery: true,
        livery: { body: '#2f5b46', roof: '#244636', stripe: '#e0c15a', frame: '#20242a' },
        quirks: ['Forty-five miles an hour and content',
                 'Never breaks. Never hurries. Never complains.'],
    },
};

/* ── Rolling stock ────────────────────────────────────────────────────────────
   `kind` decides what a car is *for*, which is the whole economy:

     science  — pays. Delicate, exacting, and it keeps the lights on.
     people   — earns goodwill. Pays badly. This is the reason the railway is here.
     service  — neither; the wreck train, the baggage, the van.
     freight  — ordinary revenue, ordinary gratitude.

   `fragility` drives the shock meter. `goodwill` is what delivering it intact
   does to the valley's opinion of you. */

export const CARS = {
    boxcar:   { id:'boxcar',   name:'Box car',        kind:'freight', mass: 62000, len: 15.2, pay: 340,  goodwill: 1, fragility: .15, desc:'Mill goods, dry stores, whatever fits.' },
    hopper:   { id:'hopper',   name:'Hopper',         kind:'freight', mass: 91000, len: 13.4, pay: 300,  goodwill: 1, fragility: .05, desc:'Aggregate down, feed up. Heavy and stupid.' },
    tank:     { id:'tank',     name:'Tank car',       kind:'freight', mass: 88000, len: 15.8, pay: 480,  goodwill: 1, fragility: .35, desc:'Heating oil for the Gap. Sloshes.' },
    flat:     { id:'flat',     name:'Flat car',       kind:'freight', mass: 48000, len: 16.5, pay: 260,  goodwill: 1, fragility: .25, desc:'Timber, plant, awkward loads.' },
    gondola:  { id:'gondola',  name:'Gondola',        kind:'freight', mass: 74000, len: 14.6, pay: 290,  goodwill: 0, fragility: .05, desc:'Scrap out. Pays for itself, barely.' },
    reefer:   { id:'reefer',   name:'Reefer',         kind:'freight', mass: 58000, len: 15.2, pay: 520,  goodwill: 3, fragility: .30, perish: true,
                desc:'Cold chain. In summer, late is the same as spoiled.' },

    /* ── People. The point of the exercise. ── */
    coach:    { id:'coach',    name:'Coach',          kind:'people', mass: 44000, len: 21.3, pay: 210, goodwill: 9,  fragility: .55,
                desc:'Sixty-four people who notice exactly how you drive.' },
    combine:  { id:'combine',  name:'Combine',        kind:'people', mass: 42000, len: 19.8, pay: 190, goodwill: 7,  fragility: .50,
                desc:'Half seats, half parcels. The valley\'s post office.' },
    festival: { id:'festival', name:'Festival extra', kind:'people', mass: 49000, len: 21.3, pay: 240, goodwill: 16, fragility: .60,
                desc:'Standing room from Kottapuram to the Gap. Nobody minds.' },
    wedding:  { id:'wedding',  name:'Wedding saloon', kind:'people', mass: 46000, len: 21.3, pay: 300, goodwill: 18, fragility: .72,
                desc:'A muhurtham does not move because the railway is late.' },
    medical:  { id:'medical',  name:'Medical van',    kind:'people', mass: 34000, len: 14.0, pay: 260, goodwill: 14, fragility: .70,
                desc:'Oxygen, plasma, the clinic\'s whole month.' },

    /* ── Science. Pays for everything else. ── */
    cryo:     { id:'cryo',     name:'Cryo flat',      kind:'science', mass: 71000, len: 18.3, pay: 2400, goodwill: 4, fragility: .95,
                desc:'Peregrine Instruments. Shock-logged end to end.' },
    lab:      { id:'lab',      name:'Instrument van', kind:'science', mass: 52000, len: 17.4, pay: 1700, goodwill: 3, fragility: .85,
                desc:'Calibrated in Zurich, and it would like to stay that way.' },
    isotope:  { id:'isotope',  name:'Isotope flask',  kind:'science', mass: 84000, len: 13.6, pay: 3100, goodwill: 5, fragility: .78,
                desc:'Escorted, sealed, and on a clock that is not ours.' },

    /* ── The one that never travels alone. ── */
    abb:      { id:'abb',      name:'The ABB device', kind:'science', mass: 63000, len: 16.8, pay: 0, goodwill: 6, fragility: .99,
                critical: true,
                desc:'A traction converter out of Baden, three decades ahead of this ' +
                     'railway. One day it is the backbone. Today it is the most ' +
                     'fragile thing you have ever been asked to move.' },

    /* ── Service. ── */
    caboose:  { id:'caboose',  name:'Caboose',        kind:'service', mass: 26000, len: 10.4, pay: 0, goodwill: 0, fragility: .40,
                desc:'Dell\'s office. Not negotiable.' },
    baggage:  { id:'baggage',  name:'Baggage car',    kind:'service', mass: 30000, len: 15.0, pay: 0, goodwill: 0, fragility: .30,
                baggage: true,
                desc:'Everything the railway has not finished carrying. It gets ' +
                     'lighter the better the valley thinks of us.' },
    crane:    { id:'crane',    name:'Breakdown crane',kind:'service', mass: 96000, len: 17.2, pay: 0, goodwill: 0, fragility: .20,
                desc:'Rusted where it stands until the day it is the only thing that matters.' },
    tool:     { id:'tool',     name:'Tool van',       kind:'service', mass: 41000, len: 14.6, pay: 0, goodwill: 0, fragility: .25,
                desc:'Jacks, packing, chain, and Meera\'s good spanners.' },
};

export const COMPONENTS = [
    { id:'prime',   name:'Prime mover',    note:'Power. Nurse it and it nurses you.' },
    { id:'traction',name:'Traction motors',note:'Wheelslip eats these alive.' },
    { id:'brakes',  name:'Brake rigging',  note:'Every emergency application costs shoe.' },
    { id:'cooling', name:'Cooling group',  note:'Radiators, fans, the water pump.' },
];

/** For the Missus, the fourth component is her boiler rather than a radiator. */
export const STEAM_COMPONENTS = [
    { id:'prime',   name:'Motion and valve gear', note:'Rods, glands, eccentrics.' },
    { id:'traction',name:'Tyres and springs',     note:'She is ninety-seven years old.' },
    { id:'brakes',  name:'Brake rigging',         note:'Wooden blocks. They wear like wood.' },
    { id:'cooling', name:'Boiler and tubes',      note:'Care here is the difference between steam and a blowout.' },
];

export function componentsFor(locoId) {
    return locoId === 'e33' ? STEAM_COMPONENTS : COMPONENTS;
}

export function newLocoState(id) {
    return {
        id,
        cond: { prime: 100, traction: 100, brakes: 100, cooling: 100 },
        hours: 0,
        bodges: {},
        care: id === 'e33' ? 70 : 0,   // the Missus alone needs looking after
    };
}

export function locoHealth(ls) {
    const c = ls.cond;
    return (c.prime + c.traction + c.brakes + c.cooling) / 4;
}
