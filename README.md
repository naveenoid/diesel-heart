# Diesel Heart

**The Sable Valley Railway. Twelve miles of track that shouldn't still exist, ‌
and four miles of somebody else's city at the bottom of it.**

You have four second-hand locomotives, one slot a day on somebody else's
mainline, and four towns that have no other road. Abel Quist ran this railway
for thirty-one years. He was buried on Tuesday. There is a train to Halloway on
Thursday.

**Play it:** [naveenoid.github.io/diesel-heart](https://naveenoid.github.io/diesel-heart)

---

## The score is goodwill, not money

This is the part that makes it a different game from a tycoon.

**Science freight pays.** Peregrine's cryo flats, the isotope flasks, the
instrument vans out of Baden. That money is what buys radiator cores and diesel
and Meera's good spanners. Without it the railway stops inside a month.

**People are what it's for.** Coaches, the combine with the valley's post in it,
the festival extras at Pongal, the wedding saloon, the medical van. They pay
badly and they are the reason any of this exists. Carrying them on time and
smoothly is where goodwill comes from. Delivering science intact earns some too
— competence is its own kind of trust — but never as much.

**And you cannot only run science.** The yard offers you passenger stock on most
trips. Leave it on the platform and the game does not stop you, it just quietly
notes it: people left standing, and a slow drift downward if contract freight is
all you ever couple to. Nobody is rude about it. That is how a short line dies.

**Goodwill is physical.** Velaikkaran and the Missus never travel light — the
baggage car goes wherever they go, full of parcels nobody collected and the
accumulated unfinished business of four towns. It weighs thirty tonnes when the
valley has no faith in you and under ten when it does, because by then most of
it has been dealt with by somebody who wanted to help. **Goodwill reduces
baggage.** You feel it on Sabre Hill.

---

## The fleet

| | Class | Built | |
|---|---|---|---|
| **#17 Velaikkaran** | WDM-2 | 1969 | வேலைக்காரன், *the one who does the work*. 2,600 hp and he does all of it — freight, passengers, the festival extras, the wreck train. Runs hot above notch 6. Wears out faster than the rest because he is always the one sent. |
| **#4 The Missus** | SLM E 3/3 | 1928 | Winterthur, and the pride of the fleet. Pulls the heritage trains and the whole valley comes down to look. Boiler pressure is a budget, and if you work her hard on a boiler nobody has washed out she will blow a joint. She needs *care*, and care is a number in the shed. |
| **#22 The Fox** | ALCO RS-3 | 1953 | Rust-coloured, quick, sly. Throttle response is a rumour. No dynamic brake. |
| **#1201 Gundu** | EMD SW1500 | 1968 | குண்டு, *roly-poly*. Squat, slow, permanently pleased with himself, has never once refused to start. |

The Fox and Gundu keep the crew going by being what they are. Let them fall
apart and morale goes with them.

**The ABB device** rides on the critical missions and is never left behind: a
traction converter out of Baden, three decades ahead of this railway, and one
day its backbone. Today it is the most fragile thing you have ever been asked to
move, and the ending changes depending on whether you got it there unshaken.

---

## What you actually do

Twelve chapters. Each is some people talking, one trip, and the consequences of
how you drove it.

### The run — side elevation

Your train in profile against a valley that climbs 2,148 feet. A driving
simulation wearing a side-scroller's clothes:

- **Weight.** A thousand tons does not stop because you would like it to.
- **Air.** The train brake applies slowly and releases more slowly. Emergency
  latches; the pipe takes seven seconds to recharge.
- **Adhesion.** Rain, snow and leaves cut the friction available. Exceed it and
  the wheels spin and the traction motors pay. Sand early, not after.
- **Heat.** Hold notch 8 up Sabre Hill and Velaikkaran pulls his own power back
  to survive, halfway up, with the train pushing you back down it.
- **Slack.** The couplers have play. Snatch and the shock runs the length of the
  train — and the thing at the back is sometimes a cryostat, sometimes a bride
  in nine yards of silk, and once it is Dell.
- **Steam.** The Missus has no heat gauge and no dynamic brake. Open her half
  and she makes more speed than open full, because on full she runs out.

### The missions

Not one kind of trip. Kottapuram Central at eight in the morning with four
unmanned crossings and a suburban unit every four minutes. The Pongal special,
seven hundred people going home, paying nothing. A wedding party to Kestrel Gap
at minus fourteen with the pass shut and a muhurtham that does not move. Fog and
a rockfall in the Sabre cut at midnight. The crane out to a derailment at two in
the morning, ninety-six tonnes of it, riding like a barn door.

### The dispatcher strip

You do not own this mainline. The strip along the top is the whole section at
once — gradient profile, every signal and loop, Continental Pacific's trains,
and a live marker for where you would stop if you braked now. Meets on single
track mean somebody takes the siding, and Hal has already decided it isn't CP.

### The shed

Money turns into machinery, and the game asks its real question: fix it
properly, or fix it by Monday? A jugaad costs almost nothing and carries a
stated chance of letting go under load. The injector swap really does rob the
Fox. And the Missus has her own column — washouts, tubes, glands, the hours
nobody bills for.

---

## Controls

| Key | Action |
|-----|--------|
| <kbd>W</kbd> / <kbd>S</kbd> | Throttle (or regulator) up and down. Below idle is the dynamic brake. |
| <kbd>A</kbd> / <kbd>D</kbd> | Train brake — release and apply. Air is slow. Plan for it. |
| <kbd>Space</kbd> | Emergency. Latches; <kbd>A</kbd> releases it, then seven seconds of almost nothing. |
| <kbd>H</kbd> | Horn. Every whistle board, every time. |
| <kbd>X</kbd> | Sanders. |
| <kbd>L</kbd> | Headlight. |
| <kbd>1</kbd> / <kbd>2</kbd> | Line the points: into the siding, or stay on the main. |
| <kbd>Esc</kbd> | Pause. |

---

## Project layout

```
web/
├── index.html · styles.css
└── src/
    ├── main.js            boot, canvas fitting, campaign flow
    ├── audio.js           synthesised engine, horn, weather — no assets
    ├── save.js            one localStorage slot
    ├── data/
    │   ├── roster.js      the fleet and the rolling stock
    │   ├── routes.js      the line: city, valley, grade, signals, loops
    │   └── story.js       twelve chapters of dialogue and run scenarios
    ├── game/
    │   ├── physics.js     tractive effort, air, adhesion, heat, steam, slack
    │   ├── state.js       goodwill, money, wear, baggage, care, blowouts
    │   └── run.js         the run — signals, meets, hazards, the ABB device
    ├── render/
    │   ├── world.js       sky, parallax, track, city, lineside, weather
    │   ├── trains.js      volume-shaded rolling stock, rods, exhaust
    │   └── hud.js         gauges and the dispatcher strip
    └── scenes/
        ├── ui.js          overlay panels and the dialogue system
        ├── screens.js     title, briefing, debrief, epilogue
        └── depot.js       the shed, the platform, making up the train
```

No build step and no dependencies. ES modules, so serve it over HTTP:

```bash
cd web && python3 -m http.server 8080
```

## Deploying

Push to `main`. The workflow publishes `web/` to GitHub Pages. First time only:
*Settings → Pages → Source →* **GitHub Actions**.

---

For more info, email: naveen.sk@gmail.com
