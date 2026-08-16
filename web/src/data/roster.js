/* ── Roster ───────────────────────────────────────────────────────────────────
   Four machines nobody else wanted.

   Each one has to *drive* differently, or the fiction is a paint job. So the
   differences live in numbers the physics reads every frame:

     · Bahadur   — huge power, runs hot. Punish the notch and she cooks.
     · Rusty     — Alco lag. The turbo takes its time; throttle is a suggestion.
     · Pip       — honest and weak. Tonnage is the enemy, not the machine.
     · Grossmutter — steam. Boiler pressure is a budget you spend and refill.

   Mass is in kg, power in watts, forces in newtons. Display converts. */

export const LOCOS = {

    wdm2: {
        id: 'wdm2',
        road: '#17',
        name: 'Bahadur',
        cls: 'WDM-2',
        built: 1969,
        kind: 'diesel',
        blurb: 'Alco design, built under licence, worked a subcontinent for thirty ' +
               'years and came here on a scrapline manifest. Meera and her father ' +
               'put her back together twice.',
        mass: 112000,
        power: 1_940_000,          // 2,600 hp at the rail, near enough
        teMax: 300_000,            // starting tractive effort, N
        maxSpeed: 33.5,            // m/s ≈ 75 mph
        notches: 8,
        dynamicBrake: 4,           // notches of dynamic braking below zero
        brakeForce: 0.62,          // m/s² at full service, loco contribution
        // Thermal: the whole personality. heatGain scales with notch³ so the top
        // two notches are where she starts to hurt.
        heatGain: 1.55,
        heatShed: 0.95,
        heatRedline: 92,
        throttleLag: 1.5,          // seconds to reach commanded power
        fuelBurn: 0.55,            // litres per second at notch 8
        idleThump: 2.35,           // Hz — the dhuk-dhuk-dhuk
        livery: { body: '#1d3f6b', roof: '#16304f', stripe: '#d1a04a', frame: '#20242a' },
        quirks: ['Runs hot above notch 6', 'Will pull anything you couple to her'],
    },

    rs3: {
        id: 'rs3',
        road: '#22',
        name: 'Rusty',
        cls: 'ALCO RS-3',
        built: 1953,
        kind: 'diesel',
        blurb: 'Smokes like a house fire and always has. Bought off a gravel ' +
               'pit in a state nobody visits. Dell claims she has moods.',
        mass: 111000,
        power: 1_190_000,          // 1,600 hp
        teMax: 250_000,
        maxSpeed: 29,              // ≈ 65 mph
        notches: 8,
        dynamicBrake: 0,           // no dynamics — you brake with air or not at all
        brakeForce: 0.55,
        heatGain: 1.15,
        heatShed: 1.1,
        heatRedline: 95,
        throttleLag: 3.4,          // the famous Alco hesitation
        fuelBurn: 0.42,
        idleThump: 2.05,
        livery: { body: '#6d4326', roof: '#4c2f1b', stripe: '#c8b89a', frame: '#20242a' },
        quirks: ['Throttle response is a rumour', 'No dynamic brake — plan ahead'],
    },

    sw1500: {
        id: 'sw1500',
        road: '#1201',
        name: 'Pip',
        cls: 'EMD SW1500',
        built: 1968,
        kind: 'diesel',
        blurb: 'A switcher doing road work because there is nobody else. Slow, ' +
               'dull, and she has never once failed to start.',
        mass: 113000,
        power: 1_120_000,          // 1,500 hp
        teMax: 245_000,
        maxSpeed: 20,              // ≈ 45 mph — geared for the yard
        notches: 8,
        dynamicBrake: 0,
        brakeForce: 0.6,
        heatGain: 0.8,
        heatShed: 1.35,
        heatRedline: 98,
        throttleLag: 1.1,
        fuelBurn: 0.34,
        idleThump: 2.6,
        livery: { body: '#2f5b46', roof: '#244636', stripe: '#c8b89a', frame: '#20242a' },
        quirks: ['Geared low — 45 mph and content', 'Never breaks. Never hurries.'],
    },

    e33: {
        id: 'e33',
        road: '#4',
        name: 'Grossmutter',
        cls: 'SLM E 3/3',
        built: 1928,
        kind: 'steam',
        blurb: 'Came over in a container as part of a dead collector\'s estate, ' +
               'with a crate of spares and a manual nobody here can read. ' +
               'The town turns out when she lights up.',
        mass: 45000,
        power: 300_000,            // ~400 hp, and that is being generous
        teMax: 118_000,
        maxSpeed: 13.5,            // ≈ 30 mph
        notches: 8,                // regulator
        dynamicBrake: 0,
        brakeForce: 0.48,
        heatGain: 0,               // steam tracks boiler pressure instead
        heatShed: 0,
        heatRedline: 100,
        throttleLag: 0.7,          // a regulator opens when you open it
        fuelBurn: 0,
        idleThump: 0.9,
        // Steam-only parameters
        steamMax: 100,
        steamRecover: 3.6,         // %/s regained when the regulator is shut
        steamDrain: 1.15,          // scales with regulator opening
        livery: { body: '#22322c', roof: '#1a2622', stripe: '#8f2f28', frame: '#181b1f' },
        quirks: ['Boiler pressure is a budget — spend it on the hills',
                 'Thirty miles an hour, and she means it'],
    },
};

/* ── Rolling stock ────────────────────────────────────────────────────────────
   `fragility` drives the shock meter: 0 shrugs off a slam, 1 is a cryostat that
   resents being coupled to at all. `needs` names the town that suffers if the
   car does not arrive. */

export const CARS = {
    boxcar:   { id:'boxcar',   name:'Box car',         mass: 62000, len: 15.2, pay: 340,  fragility: .15, cls:'freight', desc:'Mill goods, dry stores, whatever fits.' },
    hopper:   { id:'hopper',   name:'Hopper',          mass: 91000, len: 13.4, pay: 300,  fragility: .05, cls:'freight', desc:'Aggregate down, feed up. Heavy and stupid.' },
    tank:     { id:'tank',     name:'Tank car',        mass: 88000, len: 15.8, pay: 480,  fragility: .35, cls:'freight', desc:'Heating oil for the Gap. Sloshes.' },
    flat:     { id:'flat',     name:'Flat car',        mass: 48000, len: 16.5, pay: 260,  fragility: .25, cls:'freight', desc:'Timber, plant, awkward loads.' },
    reefer:   { id:'reefer',   name:'Reefer',          mass: 58000, len: 15.2, pay: 520,  fragility: .30, cls:'freight', desc:'Cold chain. Late is the same as spoiled.' },
    coach:    { id:'coach',    name:'Coach',           mass: 44000, len: 21.3, pay: 410,  fragility: .55, cls:'pax',     desc:'People. They notice how you drive.' },
    combine:  { id:'combine',  name:'Combine',         mass: 42000, len: 19.8, pay: 330,  fragility: .50, cls:'pax',     desc:'Half seats, half baggage. The valley\'s post office.' },
    caboose:  { id:'caboose',  name:'Caboose',         mass: 26000, len: 10.4, pay: 0,    fragility: .40, cls:'service', desc:'Dell\'s office. Not negotiable.' },
    medical:  { id:'medical',  name:'Medical van',     mass: 34000, len: 14.0, pay: 260,  fragility: .70, cls:'special', desc:'Oxygen, plasma, the clinic\'s whole month.', needs:'coldspring' },
    cryo:     { id:'cryo',     name:'Cryo flat',       mass: 71000, len: 18.3, pay: 2400, fragility: .95, cls:'special', desc:'Peregrine Instruments. Shock-logged end to end.' },
    gondola:  { id:'gondola',  name:'Gondola',         mass: 74000, len: 14.6, pay: 290,  fragility: .05, cls:'freight', desc:'Scrap out. Pays for itself, barely.' },
};

/* Component names, in the order Meera lists them on the whiteboard. */
export const COMPONENTS = [
    { id:'prime',   name:'Prime mover',    note:'Power. Nurse it and it nurses you.' },
    { id:'traction',name:'Traction motors',note:'Wheelslip eats these alive.' },
    { id:'brakes',  name:'Brake rigging',  note:'Every emergency application costs shoe.' },
    { id:'cooling', name:'Cooling group',  note:'Radiators, fans, the water pump.' },
];

export function newLocoState(id) {
    return {
        id,
        cond: { prime: 100, traction: 100, brakes: 100, cooling: 100 },
        hours: 0,
        // Jugaad fixes: cheap, fast, and each one carries a chance of letting go
        // mid-run. Keyed by component.
        bodges: {},
    };
}

export function locoHealth(ls) {
    const c = ls.cond;
    return (c.prime + c.traction + c.brakes + c.cooling) / 4;
}
