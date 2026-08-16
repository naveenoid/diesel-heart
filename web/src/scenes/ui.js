/* ── Overlay UI ───────────────────────────────────────────────────────────────
   The canvas gets the railway; the DOM gets everything with words in it.
   Dialogue, paperwork and briefings are all real text, selectable and legible,
   which canvas text never quite is. */

import { sound } from '../audio.js';
import { CHARACTERS } from '../data/story.js';

let host = null;

export function mountOverlay(el) { host = el; }

export function clearOverlay() { if (host) host.innerHTML = ''; }

/** Put a panel on screen. Returns the element so callers can wire it up. */
export function show(html, cls = 'panel') {
    clearOverlay();
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = html;
    host.appendChild(div);
    return div;
}

export function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

/** '*text*' is a stage direction; '**text**' is emphasis. */
function fmtLine(raw) {
    let s = esc(raw);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (s.startsWith('*') && s.endsWith('*') && s.length > 2) {
        return `<div class="line stage-dir">${s.slice(1, -1).replace(/\*(.+?)\*/g, '<em>$1</em>')}</div>`;
    }
    s = s.replace(/\*(.+?)\*/g, '<em class="stage-dir">$1</em>');
    return `<div class="line">${s}</div>`;
}

/**
 * Play a sequence of dialogue beats. Beats with `choices` stop and wait.
 * Resolves with the list of effects the player picked.
 */
export function playDialogue(beats, onEffect) {
    return new Promise(resolve => {
        let i = 0;
        const chosen = [];

        const step = () => {
            if (i >= beats.length) { clearOverlay(); resolve(chosen); return; }
            const beat = beats[i];

            if (beat.choices) { renderChoices(beat); return; }

            const c = CHARACTERS[beat.who] || { name: beat.who, role: '' };
            const body = (beat.lines || []).map(fmtLine).join('');
            const el = show(`
                ${c.name ? `<div class="who">${esc(c.name)}</div>` : ''}
                ${c.role ? `<div class="role">${esc(c.role)}</div>` : ''}
                ${body}
                <div class="btn-row"><button class="btn primary" data-next>Continue</button></div>
            `, 'panel dlg');
            el.querySelector('[data-next]').onclick = () => { sound.blip(520, 0.05); i++; step(); };
            el.querySelector('[data-next]').focus({ preventScroll: true });
            el.scrollTop = 0;
        };

        const renderChoices = (beat) => {
            const el = show(`
                <div class="who">You</div>
                <div class="role">Whoever is left to do it</div>
                <div class="choices">
                    ${beat.choices.map((c, n) =>
                        `<button class="btn choice" data-c="${n}">${esc(c.text)}</button>`).join('')}
                </div>
            `, 'panel dlg');
            el.querySelectorAll('[data-c]').forEach(btn => {
                btn.onclick = () => {
                    const c = beat.choices[+btn.dataset.c];
                    sound.blip(660, 0.06);
                    chosen.push(c.effect || {});
                    if (onEffect) onEffect(c.effect);
                    i++;
                    if (c.reply) { beats = [...beats.slice(0, i), c.reply, ...beats.slice(i)]; }
                    step();
                };
            });
        };

        step();
    });
}

/** A modal with arbitrary content and one or more buttons. Resolves the id. */
export function prompt(html, buttons, cls = 'panel') {
    return new Promise(resolve => {
        const el = show(`${html}<div class="btn-row">${
            buttons.map(b => `<button class="btn ${b.cls || ''}" data-b="${esc(b.id)}"${b.disabled ? ' disabled' : ''}>${esc(b.label)}</button>`).join('')
        }</div>`, cls);
        el.querySelectorAll('[data-b]').forEach(btn => {
            btn.onclick = () => { sound.blip(560, 0.05); clearOverlay(); resolve(btn.dataset.b); };
        });
        // Focus for keyboard use, but never let it scroll a long briefing to
        // the bottom before the player has read the top of it.
        const first = el.querySelector('.btn:not([disabled])');
        if (first) first.focus({ preventScroll: true });
        el.scrollTop = 0;
    });
}

export function money(n) {
    const s = Math.abs(Math.round(n)).toLocaleString('en-US');
    return `${n < 0 ? '−' : ''}$${s}`;
}

export function condBar(pct) {
    const cls = pct > 66 ? '' : pct > 33 ? 'warn' : 'bad';
    return `<div class="bar"><i class="${cls}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
}
