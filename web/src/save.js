/* ── Save ─────────────────────────────────────────────────────────────────────
   One slot, localStorage, written after every chapter. A short line does not
   keep duplicate records of anything. */

const KEY = 'diesel-heart/save/v4';

export function save(camp) {
    try {
        localStorage.setItem(KEY, JSON.stringify(camp));
        return true;
    } catch {
        return false;   // private browsing, quota, whatever — the game plays on
    }
}

export function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const c = JSON.parse(raw);
        return (c && c.version === 4) ? c : null;
    } catch {
        return null;
    }
}

export function wipe() {
    try { localStorage.removeItem(KEY); } catch { /* nothing to be done */ }
}

export function hasSave() { return load() !== null; }
