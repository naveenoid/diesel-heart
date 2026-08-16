/* ── Diesel Heart ─────────────────────────────────────────────────────────────
   Boot, canvas fitting, the frame loop, and the shape of a campaign.

   The canvas is always 1280×720 in logical units and gets letterboxed to fit
   whatever it is running on. The DOM overlay is pinned to the canvas rect so
   panels sit exactly on the picture. */

import { CHAPTERS } from './data/story.js';
import { newCampaign, settleRun, applyEffect } from './game/state.js';
import { RunScene } from './game/run.js';
import { IdleScene, titleScreen, chapterCard, briefing, debrief, epilogue } from './scenes/screens.js';
import { depotScreen, platformScreen } from './scenes/depot.js';
import { mountOverlay, playDialogue, clearOverlay, prompt } from './scenes/ui.js';
import { sound } from './audio.js';
import * as SaveFile from './save.js';

const LOGICAL_W = 1280, LOGICAL_H = 720;

class App {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.overlay = document.getElementById('overlay');
        this.toast = document.getElementById('toast');
        this.scene = null;
        this.last = performance.now();
        this.runResolve = null;

        mountOverlay(this.overlay);

        window.addEventListener('resize', () => this.fit());
        window.addEventListener('keydown', e => this.onKey(e));
        // The audio context cannot start until the player touches something.
        const wake = () => { sound.init(); sound.resume(); };
        window.addEventListener('pointerdown', wake, { once: true });
        window.addEventListener('keydown', wake, { once: true });

        this.fit();
        requestAnimationFrame(ts => this.frame(ts));
    }

    /* ── Layout ──────────────────────────────────────────────────────────── */

    fit() {
        const pad = 0;
        const availW = window.innerWidth - pad, availH = window.innerHeight - pad;
        const scale = Math.min(availW / LOGICAL_W, availH / LOGICAL_H);
        const cssW = Math.floor(LOGICAL_W * scale), cssH = Math.floor(LOGICAL_H * scale);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(LOGICAL_W * dpr);
        this.canvas.height = Math.floor(LOGICAL_H * dpr);
        this.canvas.style.width = cssW + 'px';
        this.canvas.style.height = cssH + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Pin the overlay to the canvas
        const o = this.overlay.style;
        o.width = cssW + 'px';
        o.height = cssH + 'px';
        o.left = '50%'; o.top = '50%';
        o.transform = 'translate(-50%, -50%)';

        const t = this.toast.style;
        t.left = '50%';
        t.bottom = `${Math.max(12, (window.innerHeight - cssH) / 2 + 24)}px`;
    }

    /* ── Frame ───────────────────────────────────────────────────────────── */

    frame(ts) {
        const dt = Math.min(0.05, (ts - this.last) / 1000);
        this.last = ts;

        if (this.scene) {
            try {
                this.scene.update(dt);
                this.scene.draw(this.ctx);
            } catch (err) {
                console.error('scene error', err);
                this.scene = null;
                this.ctx.fillStyle = '#0a0b0d';
                this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
            }
        } else {
            this.ctx.fillStyle = '#0a0b0d';
            this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        }
        sound.tick();
        requestAnimationFrame(t => this.frame(t));
    }

    onKey(e) {
        // Do not steal keys while the player is in a menu button or a field.
        const tag = document.activeElement?.tagName;
        if (this.overlay.childElementCount > 0 && (tag === 'BUTTON' || tag === 'INPUT')) {
            if (e.key === 'Escape' && this.scene?.keydown) this.scene.keydown(e);
            return;
        }
        if (this.scene?.keydown) this.scene.keydown(e);
    }

    setScene(s) {
        if (this.scene?.stop) this.scene.stop();
        this.scene = s;
        if (s?.start) s.start();
    }

    say(text, cls = '') {
        const el = document.createElement('div');
        el.className = `toast-item ${cls}`;
        el.textContent = text;
        this.toast.appendChild(el);
        setTimeout(() => el.remove(), 4200);
    }

    /* ── Running a trip ──────────────────────────────────────────────────── */

    playRun(chapter, camp) {
        return new Promise(resolve => {
            this.runResolve = resolve;
            clearOverlay();
            this.setScene(new RunScene(this, chapter, camp));
        });
    }

    onRunComplete(result) {
        const r = this.runResolve;
        this.runResolve = null;
        if (r) r(result);
    }

    /* ── The campaign ────────────────────────────────────────────────────── */

    async boot() {
        for (;;) {
            this.setScene(new IdleScene({ hour: 4.3, title: true }));
            const choice = await titleScreen(SaveFile.hasSave());

            let camp;
            if (choice === 'continue') camp = SaveFile.load() || newCampaign();
            else { SaveFile.wipe(); camp = newCampaign(); }

            await this.campaign(camp);
        }
    }

    async campaign(camp) {
        while (camp.chapter < CHAPTERS.length) {
            const ch = CHAPTERS[camp.chapter];
            const n = camp.chapter + 1;

            // A still of the valley in the right weather, behind the words.
            this.setScene(new IdleScene({
                hour: ch.run.hour, weather: ch.run.weather,
                loco: ch.run.loco, cars: ch.run.cars.slice(0, 2),
            }));

            await chapterCard(ch, n);
            await playDialogue(ch.opening, eff => applyEffect(camp, eff));

            // The shed opens once the tutorial chapters are behind you.
            if (camp.chapter >= 2) await depotScreen(camp, ch);
            await platformScreen(camp, ch);
            await briefing(ch, camp);

            for (;;) {
                const result = await this.playRun(ch, camp);
                this.setScene(new IdleScene({
                    hour: ch.run.hour, weather: ch.run.weather,
                    loco: ch.run.loco, cars: ch.run.cars.slice(0, 2),
                }));

                if (result.success) {
                    const settlement = settleRun(camp, ch, result);
                    await debrief(ch, result, settlement, camp);
                    break;
                }

                const pick = await debrief(ch, result, { lines: [], net: 0, perfect: false, settled: false }, camp);
                if (pick === 'retry') continue;

                const settlement = settleRun(camp, ch, result);
                await debrief(ch, result, settlement, camp);
                break;
            }

            if (ch.closing) await playDialogue(ch.closing, eff => applyEffect(camp, eff));

            camp.chapter++;
            SaveFile.save(camp);

            if (ch.finale) {
                this.setScene(new IdleScene({ hour: 6.1, loco: 'wdm2', cars: ['medical', 'combine'] }));
                await epilogue(camp);
                return;
            }
        }
    }
}

const app = new App();
// Exposed so the scene can be inspected from the console (and from tests).
window.__dh = app;
app.boot().catch(err => {
    console.error(err);
    prompt(`<h1>Something let go</h1>
            <p>The game hit an error and stopped. The console has the detail.</p>
            <p><em>${String(err && err.message || err)}</em></p>`,
        [{ id: 'x', label: 'Reload', cls: 'primary' }]).then(() => location.reload());
});
