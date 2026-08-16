/* ── The shed and the platform ────────────────────────────────────────────────
   Between trips there are two rooms.

   The shed is where money turns into machinery, and where the game asks its
   real question: do you fix it properly, or do you fix it by Monday? A proper
   overhaul costs what you do not have. A jugaad costs almost nothing and might
   let go halfway up Sabre Hill.

   The platform is where you find out what any of it was for. */

import { LOCOS, CARS, componentsFor, locoHealth } from '../data/roster.js';
import { REPAIRS, CARE_ACTIONS, TOWNS, standing, valleyHealth, baggageMass } from '../game/state.js';
import { buildRoute } from '../data/routes.js';
import { rulingSpeed, mph } from '../game/physics.js';
import { show, prompt, esc, money, condBar, clearOverlay } from './ui.js';
import { sound } from '../audio.js';

/* ── Depot ───────────────────────────────────────────────────────────────── */

export function depotScreen(camp, chapter) {
    return new Promise(resolve => {
        let sel = chapter?.run?.loco || 'wdm2';

        const render = () => {
            const ls = camp.locos[sel];
            const loco = LOCOS[sel];
            const st = standing(camp);

            const rosterCards = Object.keys(camp.locos).map(id => {
                const L = LOCOS[id], S = camp.locos[id];
                const h = locoHealth(S);
                const isToday = chapter?.run?.loco === id;
                return `
                <div class="card ${id === sel ? 'sel' : ''}" data-loco="${id}">
                    <div class="nm">${esc(L.road)} ${esc(L.name)}</div>
                    <div class="sub">${esc(L.cls)} · ${L.built}</div>
                    <div style="margin-top:8px">${condBar(h)}</div>
                    <div class="meta">
                        ${Math.round(h)}% overall${isToday ? ' · <span style="color:#d1a04a">rostered today</span>' : ''}
                        ${Object.values(S.bodges).length ? '<br><span class="warn">carrying a bodge</span>' : ''}
                    </div>
                </div>`;
            }).join('');

            const compRows = componentsFor(sel).map(c => {
                const v = ls.cond[c.id];
                const bodged = ls.bodges[c.id];
                return `
                <tr>
                    <td>${esc(c.name)}${bodged ? ' <span class="warn">·bodged</span>' : ''}</td>
                    <td style="width:120px">${condBar(v)}</td>
                    <td class="num ${v > 66 ? 'good' : v > 33 ? 'warn' : 'bad'}">${Math.round(v)}%</td>
                    <td style="font-size:11px;color:#8d8676">${esc(c.note)}</td>
                </tr>`;
            }).join('');

            const repairRows = REPAIRS.map(r => {
                const cur = ls.cond[r.comp];
                const gain = r.jugaad ? Math.min(100, cur + r.gain) - cur : 100 - cur;
                const pointless = gain < 1;
                const broke = camp.money < r.cost;
                const dis = pointless || broke;
                return `
                <tr>
                    <td>
                        <div style="color:${r.jugaad ? '#d1a04a' : '#d8cdb8'}">${esc(r.label)}</div>
                        <div style="font-size:11px;color:#8d8676">${esc(r.note)}${
                            r.jugaad ? ` <span class="warn">· ${Math.round(r.risk * 100)}% chance of failing under load</span>` : ''}${
                            r.steal && r.steal.loco !== sel ? ` <span class="bad">· costs ${esc(LOCOS[r.steal.loco].road)} ${r.steal.amount}%</span>` : ''}</div>
                    </td>
                    <td class="num">+${Math.round(gain)}</td>
                    <td class="num ${broke ? 'bad' : ''}">${money(-r.cost)}</td>
                    <td><button class="btn" data-fix="${esc(r.id)}"${dis ? ' disabled' : ''}>${
                        pointless ? 'no need' : broke ? 'no funds' : 'do it'}</button></td>
                </tr>`;
            }).join('');

            const townRows = Object.entries(TOWNS).map(([id, t]) => {
                const m = camp.towns[id] ?? 50;
                return `<tr><td>${esc(t.name)}</td><td class="num" style="color:#8d8676">${t.pop}</td>
                    <td style="width:110px">${condBar(m)}</td>
                    <td class="num ${m > 60 ? 'good' : m > 38 ? 'warn' : 'bad'}">${Math.round(m)}</td></tr>`;
            }).join('');

            const el = show(`
                <h2>Marrow Bend enginehouse</h2>
                <h1>The shed</h1>
                <p class="${st.cls}"><em>${esc(st.text)}</em></p>

                <table class="ledger" style="margin-top:12px">
                    <tr>
                        <td><strong>Goodwill</strong></td>
                        <td style="width:150px">${condBar(camp.goodwill)}</td>
                        <td class="num ${camp.goodwill > 58 ? 'good' : camp.goodwill > 30 ? 'warn' : 'bad'}"><strong>${Math.round(camp.goodwill)}</strong></td>
                        <td colspan="2" style="font-size:11px;color:#8d8676">
                            This is the score. Everything else is how you keep the doors open.</td>
                    </tr>
                    <tr>
                        <td>In hand</td>
                        <td class="num ${camp.money < 500 ? 'bad' : ''}">${money(camp.money)}</td>
                        <td colspan="3" style="font-size:11px;color:#8d8676">
                            Fuel, parts and wages. Below zero the railway stops.</td>
                    </tr>
                    <tr>
                        <td>Baggage today</td>
                        <td class="num ${baggageMass(camp) > 22000 ? 'warn' : 'good'}">${Math.round(baggageMass(camp) / 1000)} t</td>
                        <td colspan="3" style="font-size:11px;color:#8d8676">
                            What the valley has not finished asking of us. Goodwill lightens it.</td>
                    </tr>
                    <tr>
                        <td>Standing with CP</td>
                        <td style="width:110px">${condBar(camp.rep)}</td>
                        <td class="num ${camp.rep > 55 ? 'good' : camp.rep > 25 ? 'warn' : 'bad'}">${Math.round(camp.rep)}</td>
                        <td>Crew</td>
                        <td style="width:110px">${condBar(camp.crew)}</td>
                    </tr>
                </table>

                <h3>Roster</h3>
                <div class="cards">${rosterCards}</div>

                <h3>${esc(LOCOS[sel].road)} ${esc(LOCOS[sel].name)} — condition</h3>
                <table class="ledger">${compRows}</table>

                ${sel === 'e33' ? `
                <h3>Looking after her</h3>
                <table class="ledger">
                    <tr>
                        <td>Care</td>
                        <td style="width:150px">${condBar(ls.care ?? 0)}</td>
                        <td class="num ${(ls.care ?? 0) > 60 ? 'good' : (ls.care ?? 0) > 30 ? 'warn' : 'bad'}">${Math.round(ls.care ?? 0)}</td>
                        <td style="font-size:11px;color:#8d8676">
                            Below thirty she will blow a joint if you work her hard. She always gives warning; the warning is this number.</td>
                    </tr>
                    ${CARE_ACTIONS.map(a => `
                    <tr>
                        <td><div style="color:#d1a04a">${esc(a.label)}</div>
                            <div style="font-size:11px;color:#8d8676">${esc(a.note)}</div></td>
                        <td class="num">+${a.gain}</td>
                        <td class="num ${camp.money < a.cost ? 'bad' : ''}">${money(-a.cost)}</td>
                        <td><button class="btn" data-care="${esc(a.id)}"${camp.money < a.cost || (ls.care ?? 0) >= 100 ? ' disabled' : ''}>do it</button></td>
                    </tr>`).join('')}
                </table>` : ''}

                <h3>Work Meera can do this week</h3>
                <table class="ledger">
                    <tr><th>Repair</th><th>Gain</th><th>Cost</th><th></th></tr>
                    ${repairRows}
                </table>

                <h3>The valley</h3>
                <table class="ledger">${townRows}</table>

                <div class="btn-row">
                    <button class="btn primary" data-done>Close the shed</button>
                </div>
            `);

            el.querySelectorAll('[data-loco]').forEach(c => {
                c.onclick = () => { sel = c.dataset.loco; sound.blip(600, 0.05); render(); };
            });

            el.querySelectorAll('[data-fix]').forEach(b => {
                b.onclick = () => {
                    const r = REPAIRS.find(x => x.id === b.dataset.fix);
                    if (!r || camp.money < r.cost) return;
                    camp.money -= r.cost;
                    const cur = ls.cond[r.comp];
                    ls.cond[r.comp] = r.jugaad ? Math.min(100, cur + r.gain) : 100;
                    if (r.jugaad) ls.bodges[r.comp] = { risk: r.risk };
                    else delete ls.bodges[r.comp];
                    // Some fixes are robbing one machine to keep another going.
                    // That is the whole economy of a shortline, so make it real.
                    if (r.steal && camp.locos[r.steal.loco] && r.steal.loco !== sel) {
                        const victim = camp.locos[r.steal.loco];
                        victim.cond[r.steal.comp] = Math.max(0, victim.cond[r.steal.comp] - r.steal.amount);
                    }
                    sound.clunk();
                    render();
                };
            });

            el.querySelectorAll('[data-care]').forEach(b => {
                b.onclick = () => {
                    const a = CARE_ACTIONS.find(x => x.id === b.dataset.care);
                    if (!a || camp.money < a.cost) return;
                    camp.money -= a.cost;
                    ls.care = Math.min(100, (ls.care ?? 0) + a.gain);
                    if (a.goodwill) camp.goodwill = Math.min(100, camp.goodwill + a.goodwill);
                    sound.clunk();
                    render();
                };
            });

            el.querySelector('[data-done]').onclick = () => { clearOverlay(); resolve(); };
        };

        render();
    });
}

/* ── Composing the train ──────────────────────────────────────────────────────
   The decision the whole run hangs on, made before the run starts. Every extra
   car is revenue the valley needs and a slower, longer, slacker train on a hill
   that does not care about revenue.

   The ruling-grade readout is the honest answer: this is the speed she will
   actually settle at on the worst grade of the trip, with this much behind her.
   If it says four miles an hour, you have built the wrong train. */

export function composeScreen(camp, chapter) {
    const R = chapter.run;
    const loco = LOCOS[R.loco];
    const ls = camp.locos[R.loco];
    const route = buildRoute(R.from, R.to);

    // Worst sustained grade on the trip — what the train has to be built for.
    let ruling = 0, rulingAt = 0;
    for (let s = 0; s < route.length; s += 25) {
        const g = route.gradeSmooth(s);
        if (g > ruling) { ruling = g; rulingAt = s; }
    }

    const optional = (R.optional || []).map((id, i) => ({ key: `${id}#${i}`, id }));

    return new Promise(resolve => {
        const taken = new Set();

        const render = () => {
            const cars = [...R.cars.map(id => CARS[id]),
                          ...optional.filter(o => taken.has(o.key)).map(o => CARS[o.id])];
            // The baggage rides whether you like it or not, so it counts here.
            const bagKg = loco.carriesBaggage && !R.noBaggage ? baggageMass(camp) : 0;
            const trailing = cars.reduce((a, c) => a + c.mass, 0) + bagKg;
            const length = cars.reduce((a, c) => a + c.len, 0) + 22 + (bagKg ? CARS.baggage.len : 0);
            const revenue = cars.reduce((a, c) => a + c.pay, 0);
            const total = trailing + loco.mass;
            // Sustained, not flat out: what she will actually hold up there.
            const v = rulingSpeed(loco, total, ruling, R.adhesion || 'dry', ls, R.ambient ?? 30);
            const cap = R.maxCars ?? 99;
            const atCap = cars.length >= cap;        // no room for another
            const over  = cars.length > cap;         // should not happen; guard anyway

            const vCls = v < 2 ? 'bad' : v < 4.5 ? 'warn' : 'good';
            const vTxt = v < 0.5 ? 'SHE WILL STALL ON THE GRADE'
                                 : `${Math.round(mph(v))} mph sustained on the ruling grade`;

            const optCards = optional.map(o => {
                const c = CARS[o.id];
                const sel = taken.has(o.key);
                const blocked = !sel && atCap;
                return `
                <div class="card ${sel ? 'sel' : ''} ${blocked ? 'locked' : ''}" data-opt="${esc(o.key)}">
                    <div class="nm">${esc(c.name)}</div>
                    <div class="sub">${Math.round(c.mass / 1000)} t · ${c.len.toFixed(1)} m</div>
                    <div class="meta">
                        ${money(c.pay)}${c.fragility > 0.5 ? ' · <span class="warn">fragile</span>' : ''}<br>
                        ${esc(c.desc)}
                    </div>
                </div>`;
            }).join('');

            const fixedRows = R.cars.map(id => {
                const c = CARS[id];
                return `<tr><td>${esc(c.name)}</td><td class="num">${Math.round(c.mass / 1000)} t</td>
                        <td class="num">${money(c.pay)}</td><td style="font-size:11px;color:#8d8676">${esc(c.desc)}</td></tr>`;
            }).join('');

            const el = show(`
                <h2>Marrow Bend — making up the train</h2>
                <h1>${esc(R.title)}</h1>
                <p>${esc(R.orders)}</p>

                <h3>Booked — these are going whatever you decide</h3>
                <table class="ledger">${fixedRows}</table>

                <h3>On the team track — take what you can pull</h3>
                <div class="cards">${optCards}</div>

                <h3>What you have built</h3>
                ${(() => {
                    const ppl = cars.filter(c => c.kind === 'people').length;
                    const sci = cars.filter(c => c.kind === 'science').length;
                    const leftPpl = optional.filter(o => !taken.has(o.key) && CARS[o.id].kind === 'people').length;
                    if (!ppl && !leftPpl) return '';
                    if (!ppl) return '<p class="bad"><em>Not one vehicle of people. It will pay, and it will be ' +
                                     'noticed, and the noticing is what costs you.</em></p>';
                    if (leftPpl) return `<p class="warn"><em>${leftPpl} passenger vehicle${leftPpl > 1 ? 's' : ''} ` +
                                     'still on the platform. They will wait. That is the problem.</em></p>';
                    return `<p class="good"><em>${ppl} of ${ppl + sci} vehicles are people. Good.</em></p>`;
                })()}
                <table class="ledger">
                    <tr><td>Cars</td><td class="num ${over ? 'bad' : ''}">${cars.length}${R.maxCars ? ` / ${R.maxCars}` : ''}</td>
                        <td>Trailing</td><td class="num">${Math.round(trailing / 1000)} t</td>
                        <td>Length</td><td class="num">${Math.round(length)} m</td></tr>
                    <tr><td>Baggage (always)</td><td class="num ${bagKg > 22000 ? 'warn' : ''}">${Math.round(bagKg / 1000)} t</td>
                        <td colspan="4" style="font-size:11px;color:#8d8676">Goodwill lightens it. Nothing else does.</td></tr>
                    <tr><td>Revenue on offer</td><td class="num good">${money(revenue)}</td>
                        <td>Ruling grade</td><td class="num">${(ruling * 100).toFixed(1)}% at MP ${route.mpAt(rulingAt).toFixed(1)}</td>
                        <td colspan="2" class="${vCls}"><strong>${vTxt}</strong></td></tr>
                </table>
                ${v < 2 ? '<p class="bad"><em>Meera, without looking up: that is more than she will lift. ' +
                          'You will be backing down to the last siding in the dark.</em></p>' : ''}
                ${over ? '<p class="bad"><em>Longer than the loops. You would not fit in a siding, and today you need to.</em></p>' : ''}
            `);

            el.querySelectorAll('[data-opt]').forEach(card => {
                card.onclick = () => {
                    const k = card.dataset.opt;
                    if (taken.has(k)) taken.delete(k);
                    else if (!atCap) taken.add(k);
                    sound.blip(taken.has(k) ? 700 : 480, 0.05);
                    render();
                };
            });

            const row = document.createElement('div');
            row.className = 'btn-row';
            row.innerHTML = `<button class="btn primary" ${over ? 'disabled' : ''} data-go>Couple up and go</button>`;
            el.appendChild(row);
            el.querySelector('[data-go]').onclick = () => {
                clearOverlay();
                const left = optional.filter(o => !taken.has(o.key));
                resolve({
                    cars: [...R.cars, ...optional.filter(o => taken.has(o.key)).map(o => o.id)],
                    bonus: optional.filter(o => taken.has(o.key)).reduce((a, o) => a + CARS[o.id].pay, 0),
                    // People you decided not to carry are the whole moral of the game.
                    refusedPeople: left.filter(o => CARS[o.id].kind === 'people').length,
                });
            };
            el.scrollTop = 0;
        };

        render();
    });
}

/* ── Platform ────────────────────────────────────────────────────────────── */

/** Who is standing at Marrow Bend this morning, and what it costs if you fail. */
export async function platformScreen(camp, chapter) {
    const v = valleyHealth(camp);
    const worst = Object.entries(camp.towns).sort((a, b) => a[1] - b[1])[0];
    const best = Object.entries(camp.towns).sort((a, b) => b[1] - a[1])[0];

    const vignettes = [];
    if (camp.towns.coldspring < 45)
        vignettes.push('A woman from Coldspring asks, without accusation, whether the Thursday train is going to be Thursday this week.');
    if (camp.towns.tannery < 45)
        vignettes.push('Two mill hands are reading a notice about shift reductions. They stop when they see you.');
    if (camp.towns.marrow > 70)
        vignettes.push('Somebody has left a tin of biscuits on the ticket window with a note that just says <em>17</em>.');
    if (camp.crew < 40)
        vignettes.push('Dell is asleep sitting up in the caboose. Nobody wakes him.');
    if (camp.money < 800)
        vignettes.push('The fuel invoice is on the desk with a second, politer letter clipped to it.');
    if (camp.goodwill > 70)
        vignettes.push('Dhanam Aunty has the tea out before you ask, and will not take the money. ' +
                       '<em>"Poitu vaanga"</em>, she says — go, and come back.');
    if (camp.goodwill < 30)
        vignettes.push('The bus company has put a timetable board up at the end of the platform. ' +
                       'Nobody has taken it down.');
    if (!vignettes.length)
        vignettes.push('The platform is quiet. Somebody has swept it, which nobody is paid to do.');

    const trainNote = chapter?.run
        ? `<p><strong>${esc(chapter.run.title)}</strong> — ${esc(chapter.run.orders)}</p>` : '';

    await prompt(`
        <h2>Marrow Bend platform</h2>
        <h1>Before the train</h1>
        ${vignettes.map(t => `<p>${t}</p>`).join('')}
        <hr class="rule">
        <table class="ledger">
            <tr><td>Valley confidence</td><td style="width:140px">${condBar(v)}</td>
                <td class="num ${v > 60 ? 'good' : v > 40 ? 'warn' : 'bad'}">${Math.round(v)}</td></tr>
            <tr><td>Holding up best</td><td colspan="2">${esc(TOWNS[best[0]].name)}</td></tr>
            <tr><td>Losing faith</td><td colspan="2" class="${worst[1] < 45 ? 'bad' : ''}">${esc(TOWNS[worst[0]].name)}</td></tr>
        </table>
        ${trainNote}
    `, [{ id: 'go', label: 'Go to the engine', cls: 'primary' }]);
}
