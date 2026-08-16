# Diesel Heart

**The Sable Valley Railway. Twelve miles of track that shouldn't still exist.**

You have four second-hand locomotives, one slot a day on somebody else's
mainline, and four towns that have no other road. Abel Quist ran this railway
for thirty-one years. He was buried on Tuesday. There is a train to Halloway on
Thursday.

**Play it:** [naveenoid.github.io/diesel-heart](https://naveenoid.github.io/diesel-heart)

---

## What you actually do

A ten-chapter campaign. Each chapter is some people talking, one trip up or
down the valley, and the consequences of how you drove it.

### The run — side elevation

Your train in profile against a valley that climbs 2,148 feet. It is a driving
simulation wearing a side-scroller's clothes:

- **Weight.** Six hundred tons does not stop because you would like it to.
  Tractive effort falls off with speed, resistance rises with it, and grade is
  just gravity with a name.
- **Air.** The train brake applies slowly and releases more slowly. Emergency
  latches, and the pipe takes seven seconds to recharge — during which you have
  almost nothing.
- **Adhesion.** Rain, snow and leaves cut the friction available. Exceed it and
  the wheels spin, you go nowhere, and the traction motors pay for it. Sand
  early, not after.
- **Heat.** #17 makes 2,600 hp and cooks herself doing it. Past the redline she
  pulls her own power back to survive — usually halfway up Sabre Hill, with the
  train pushing you back down it.
- **Slack.** The couplers have play. Snatch at the throttle or the brake and the
  shock runs the length of the train. Sometimes the thing at the back is a
  cryostat. Once, it is a person.
- **Steam.** The 1928 Swiss tank engine has no heat gauge and no dynamic brake.
  Boiler pressure is a budget: open the regulator wide and you spend it faster
  than the fire makes it.

### The dispatcher strip

You do not own this mainline. The strip along the top is the whole section at
once — every signal, every passing loop, the gradient profile, and every
Continental Pacific train that is not yours. Meets happen on single track, which
means somebody takes the siding, and the dispatcher has already decided it isn't
CP. The amber dashed line is where you would stop if you put the brake in *now*.

Signals are absolute. A red passed is a SPAD, and a SPAD is how a short line
stops being a railway.

### The shed

Between trips, money turns into machinery — and the game asks its real question:
do you fix it properly, or do you fix it by Monday? An overhaul costs what you
do not have. A jugaad costs almost nothing and carries a stated chance of
letting go under load.

---

## Controls

| Key | Action |
|-----|--------|
| <kbd>W</kbd> / <kbd>S</kbd> | Throttle up · down. Below idle is the dynamic brake. |
| <kbd>A</kbd> / <kbd>D</kbd> | Train brake release · apply |
| <kbd>Space</kbd> | Emergency application (latches — <kbd>A</kbd> releases it once the pipe recharges) |
| <kbd>H</kbd> | Horn — every whistle board, every time |
| <kbd>X</kbd> | Sanders |
| <kbd>L</kbd> | Headlight |
| <kbd>1</kbd> / <kbd>2</kbd> | Line the points: into the siding · stay on the main |
| <kbd>Esc</kbd> | Pause |

---

## The roster

| | Class | Built | Character |
|---|---|---|---|
| **#17 Bahadur** | WDM-2 | 1969 | 2,600 hp and runs hot. The heart of the line. |
| **#22 Rusty** | ALCO RS-3 | 1953 | Throttle response is a rumour. No dynamic brake. |
| **#1201 Pip** | EMD SW1500 | 1968 | Forty-five miles an hour and content. Never fails. |
| **#4 Grossmutter** | SLM E 3/3 | 1928 | Steam. Pressure is a budget. The town turns out when she lights up. |

---

## Project layout

```
diesel-heart/
├── web/
│   ├── index.html
│   ├── styles.css
│   └── src/
│       ├── main.js            boot, canvas fitting, campaign flow
│       ├── audio.js           synthesised engine, horn, weather — no assets
│       ├── save.js            one localStorage slot
│       ├── data/
│       │   ├── roster.js      locomotives and rolling stock
│       │   ├── routes.js      the line: grade, signals, sidings, landmarks
│       │   └── story.js       ten chapters of dialogue and run scenarios
│       ├── game/
│       │   ├── physics.js     tractive effort, air, adhesion, heat, slack
│       │   ├── state.js       money, wear, reputation, the valley
│       │   └── run.js         the run scene — signals, meets, hazards
│       ├── render/
│       │   ├── world.js       sky, parallax, track, lineside, weather
│       │   ├── trains.js      locomotive and car sprites, rods, exhaust
│       │   └── hud.js         gauges and the dispatcher strip
│       └── scenes/
│           ├── ui.js          overlay panels and the dialogue system
│           ├── screens.js     title, briefing, debrief, epilogue
│           └── depot.js       the shed and the platform
└── .github/workflows/deploy.yml
```

No build step and no dependencies. It is ES modules, so it needs to be served
over HTTP rather than opened as a `file://` path:

```bash
cd web
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploying

Push to `main`. The workflow publishes `web/` to GitHub Pages. First time only:
*Settings → Pages → Source →* **GitHub Actions**.

---

For more info, email: naveen.sk@gmail.com
