/* ── The shed and the platform ────────────────────────────────────────────────
   Between trips there are two rooms.

   The shed is where money turns into machinery, and where the game asks its
   real question: do you fix it properly, or do you fix it by Monday? A proper
   overhaul costs what you do not have. A jugaad costs almost nothing and might
   let go halfway up Sabre Hill.

   The platform is where you find out what any of it was for. */

import { LOCOS, COMPONENTS, locoHealth } from '../data/roster.js';
import { REPAIRS, TOWNS, standing, valleyHealth } from '../game/state.js';
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

            const compRows = COMPONENTS.map(c => {
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
                            r.jugaad ? ` <span class="warn">· ${Math.round(r.risk * 100)}% chance of failing under load</span>` : ''}</div>
                    </td>
                    <td class="num">+${Math.round(gain)}</td>
                    <td class="num ${broke ? 'bad' : ''}">${money(-r.cost)}</td>
                    <td><button class="btn" data-fix="${esc(r.id)}"${dis ? ' disabled' : ''}>${
                        pointless ? 'no need' : broke ? 'no funds' : 'do it'}</button></td>
                </tr>`;
            }).join('');

            const townRows = Object.entries(TOWNS).map(([id, t]) => {
                const m = camp.morale[id];
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
                        <td>In hand</td><td class="num ${camp.money < 500 ? 'bad' : ''}"><strong>${money(camp.money)}</strong></td>
                        <td>Standing with CP</td><td style="width:110px">${condBar(camp.rep)}</td>
                        <td>Crew</td><td style="width:110px">${condBar(camp.crew)}</td>
                    </tr>
                </table>

                <h3>Roster</h3>
                <div class="cards">${rosterCards}</div>

                <h3>${esc(LOCOS[sel].road)} ${esc(LOCOS[sel].name)} — condition</h3>
                <table class="ledger">${compRows}</table>

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
                    sound.clunk();
                    render();
                };
            });

            el.querySelector('[data-done]').onclick = () => { clearOverlay(); resolve(); };
        };

        render();
    });
}

/* ── Platform ────────────────────────────────────────────────────────────── */

/** Who is standing at Marrow Bend this morning, and what it costs if you fail. */
export async function platformScreen(camp, chapter) {
    const v = valleyHealth(camp);
    const worst = Object.entries(camp.morale).sort((a, b) => a[1] - b[1])[0];
    const best = Object.entries(camp.morale).sort((a, b) => b[1] - a[1])[0];

    const vignettes = [];
    if (camp.morale.coldspring < 45)
        vignettes.push('A woman from Coldspring asks, without accusation, whether the Thursday train is going to be Thursday this week.');
    if (camp.morale.tannery < 45)
        vignettes.push('Two mill hands are reading a notice about shift reductions. They stop when they see you.');
    if (camp.morale.marrow > 70)
        vignettes.push('Somebody has left a tin of biscuits on the ticket window with a note that just says <em>17</em>.');
    if (camp.crew < 40)
        vignettes.push('Dell is asleep sitting up in the caboose. Nobody wakes him.');
    if (camp.money < 800)
        vignettes.push('The fuel invoice is on the desk with a second, politer letter clipped to it.');
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
