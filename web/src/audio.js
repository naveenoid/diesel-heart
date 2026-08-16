/* ── Sound ────────────────────────────────────────────────────────────────────
   Everything is synthesised — no assets, nothing to load, nothing to 404 on a
   Pages deploy.

   The important one is the idle. A big four-stroke at idle is not a drone, it
   is a series of separate events you can count: dhuk. dhuk. dhuk. So it is
   built as scheduled impulses rather than a tone, because that difference is
   the entire character of the machine. */

class Sound {
    constructor() {
        this.ready = false;
        this.muted = false;
        this.ctx = null;
        this.nextThump = 0;
        this.nextClack = 0;
        this.nextChuff = 0;
        this.engine = { thump: 2.3, power: 0, speed: 0, kind: 'diesel', on: false };
    }

    /* Must be called from a user gesture or the context stays suspended. */
    init() {
        if (this.ready) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = this.ctx = new AC();

        this.master = ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(ctx.destination);

        // A little bus compression keeps the horn from clipping over the engine.
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 6;
        comp.connect(this.master);
        this.bus = comp;

        // Shared white-noise source for anything abrasive.
        const len = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;

        /* ── Engine drone: the load sound sitting under the thumps ── */
        this.droneOsc = ctx.createOscillator();
        this.droneOsc.type = 'sawtooth';
        this.droneOsc.frequency.value = 46;
        this.droneSub = ctx.createOscillator();
        this.droneSub.type = 'triangle';
        this.droneSub.frequency.value = 23;

        this.droneFilt = ctx.createBiquadFilter();
        this.droneFilt.type = 'lowpass';
        this.droneFilt.frequency.value = 180;
        this.droneFilt.Q.value = 3;

        this.droneGain = ctx.createGain();
        this.droneGain.gain.value = 0;

        this.droneOsc.connect(this.droneFilt);
        this.droneSub.connect(this.droneFilt);
        this.droneFilt.connect(this.droneGain);
        this.droneGain.connect(comp);
        this.droneOsc.start();
        this.droneSub.start();

        /* ── Rolling noise: rail roar, scaled by speed ── */
        this.rollSrc = ctx.createBufferSource();
        this.rollSrc.buffer = buf; this.rollSrc.loop = true;
        this.rollFilt = ctx.createBiquadFilter();
        this.rollFilt.type = 'bandpass';
        this.rollFilt.frequency.value = 320;
        this.rollFilt.Q.value = 0.6;
        this.rollGain = ctx.createGain();
        this.rollGain.gain.value = 0;
        this.rollSrc.connect(this.rollFilt);
        this.rollFilt.connect(this.rollGain);
        this.rollGain.connect(comp);
        this.rollSrc.start();

        /* ── Weather bed ── */
        this.wxSrc = ctx.createBufferSource();
        this.wxSrc.buffer = buf; this.wxSrc.loop = true;
        this.wxFilt = ctx.createBiquadFilter();
        this.wxFilt.type = 'highpass';
        this.wxFilt.frequency.value = 900;
        this.wxGain = ctx.createGain();
        this.wxGain.gain.value = 0;
        this.wxSrc.connect(this.wxFilt);
        this.wxFilt.connect(this.wxGain);
        this.wxGain.connect(comp);
        this.wxSrc.start();

        /* ── Brake squeal: a resonant band we open when the shoes bite ── */
        this.sqSrc = ctx.createBufferSource();
        this.sqSrc.buffer = buf; this.sqSrc.loop = true;
        this.sqFilt = ctx.createBiquadFilter();
        this.sqFilt.type = 'bandpass';
        this.sqFilt.frequency.value = 2400;
        this.sqFilt.Q.value = 22;
        this.sqGain = ctx.createGain();
        this.sqGain.gain.value = 0;
        this.sqSrc.connect(this.sqFilt);
        this.sqFilt.connect(this.sqGain);
        this.sqGain.connect(comp);
        this.sqSrc.start();

        this.ready = true;
        this.nextThump = ctx.currentTime;
        this.nextClack = ctx.currentTime;
        this.nextChuff = ctx.currentTime;
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setMuted(m) {
        this.muted = m;
        if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }

    /* ── One cylinder firing. Short, low, and physical. ── */
    thump(t, level = 1, pitch = 58) {
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(pitch * 1.9, t);
        o.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.09);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5 * level, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);

        o.connect(g); g.connect(this.bus);
        o.start(t); o.stop(t + 0.18);

        // A scrape of combustion noise on top of the tone.
        const n = ctx.createBufferSource();
        n.buffer = this.noiseBuf;
        n.playbackRate.value = 0.7;
        const nf = ctx.createBiquadFilter();
        nf.type = 'bandpass'; nf.frequency.value = 240; nf.Q.value = 1.4;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.16 * level, t);
        ng.gain.exponentialRampToValueAtTime(0.0006, t + 0.1);
        n.connect(nf); nf.connect(ng); ng.connect(this.bus);
        n.start(t); n.stop(t + 0.12);
    }

    /* ── Steam exhaust. Four beats a revolution, sharp then hissing away. ── */
    chuff(t, level = 1) {
        const ctx = this.ctx;
        const n = ctx.createBufferSource();
        n.buffer = this.noiseBuf;
        n.playbackRate.value = 1.1;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(1500, t);
        f.frequency.exponentialRampToValueAtTime(420, t + 0.22);
        f.Q.value = 1.1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.34 * level, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.3);
        n.connect(f); f.connect(g); g.connect(this.bus);
        n.start(t); n.stop(t + 0.32);
    }

    /* ── Rail joint ── */
    clack(t, level = 1) {
        const ctx = this.ctx;
        const n = ctx.createBufferSource();
        n.buffer = this.noiseBuf;
        n.playbackRate.value = 1.7;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 500; f.Q.value = 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.13 * level, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.055);
        n.connect(f); f.connect(g); g.connect(this.bus);
        n.start(t); n.stop(t + 0.07);
    }

    /* ── Horn: a chime whistle, three notes, and the doppler drop on release ── */
    horn(dur = 1.1) {
        if (!this.ready || this.muted) return;
        const ctx = this.ctx, t = ctx.currentTime;
        const freqs = [311, 392, 466, 587];
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.2, t + 0.05);
        g.gain.setValueAtTime(0.2, t + dur - 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        g.connect(this.bus);
        for (const f of freqs) {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(f, t);
            o.frequency.setValueAtTime(f, t + dur - 0.16);
            o.frequency.linearRampToValueAtTime(f * 0.965, t + dur);
            const og = ctx.createGain();
            og.gain.value = 0.25;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 2600;
            o.connect(og); og.connect(lp); lp.connect(g);
            o.start(t); o.stop(t + dur + 0.05);
        }
    }

    /* ── Discrete cues ── */
    blip(freq = 660, dur = 0.09, type = 'square', vol = 0.12) {
        if (!this.ready || this.muted) return;
        const ctx = this.ctx, t = ctx.currentTime;
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
        o.connect(g); g.connect(this.bus);
        o.start(t); o.stop(t + dur + 0.02);
    }

    radioCall()  { this.blip(880, 0.07); setTimeout(() => this.blip(1180, 0.09), 90); }
    alarm()      { this.blip(300, 0.5, 'sawtooth', 0.18); }
    good()       { this.blip(523, 0.1); setTimeout(() => this.blip(784, 0.16), 110); }
    bad()        { this.blip(180, 0.4, 'sawtooth', 0.16); }
    clunk()      { this.blip(90,  0.16, 'triangle', 0.2); }

    /** Set the engine's working state; called every frame from the run loop. */
    setEngine(e) { Object.assign(this.engine, e); }

    setWeather(kind) {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        const map = { rain: [0.055, 1500], snow: [0.02, 600], fog: [0.012, 350], clear: [0, 900] };
        const [g, f] = map[kind] ?? map.clear;
        this.wxGain.gain.setTargetAtTime(g, t, 0.6);
        this.wxFilt.frequency.setTargetAtTime(f, t, 0.6);
    }

    /**
     * Per-frame scheduler. Keeps the impulse trains a little ahead of the clock
     * so they stay rhythmically solid even when the frame rate is not.
     */
    tick() {
        if (!this.ready || this.muted) return;
        const ctx = this.ctx, now = ctx.currentTime;
        const e = this.engine;

        if (!e.on) {
            this.droneGain.gain.setTargetAtTime(0, now, 0.15);
            this.rollGain.gain.setTargetAtTime(0, now, 0.15);
            this.sqGain.gain.setTargetAtTime(0, now, 0.1);
            this.nextThump = Math.max(this.nextThump, now);
            this.nextChuff = Math.max(this.nextChuff, now);
            this.nextClack = Math.max(this.nextClack, now);
            return;
        }

        const p = e.power ?? 0;
        const v = e.speed ?? 0;

        if (e.kind === 'diesel') {
            // Idle thump rate rises with notch; so does the drone under it.
            const rate = e.thump * (1 + p * 1.45);
            const gap = 1 / Math.max(0.4, rate);
            const horizon = now + 0.25;
            let guard = 0;
            while (this.nextThump < horizon && guard++ < 24) {
                if (this.nextThump > now) this.thump(this.nextThump, 0.55 + p * 0.75, 48 + p * 26);
                this.nextThump += gap;
            }
            if (this.nextThump < now) this.nextThump = now;

            this.droneOsc.frequency.setTargetAtTime(44 + p * 62, now, 0.25);
            this.droneSub.frequency.setTargetAtTime(22 + p * 31, now, 0.25);
            this.droneFilt.frequency.setTargetAtTime(150 + p * 620, now, 0.25);
            this.droneGain.gain.setTargetAtTime(0.05 + p * 0.16, now, 0.2);
        } else {
            this.droneGain.gain.setTargetAtTime(0.012, now, 0.3);
            // Chuffs are tied to the wheels, so they slow down as she does.
            if (v > 0.4 && p > 0.03) {
                const rate = Math.max(0.5, v / 0.52 / (2 * Math.PI) * 4);
                const gap = 1 / rate;
                const horizon = now + 0.25;
                let guard = 0;
                while (this.nextChuff < horizon && guard++ < 24) {
                    if (this.nextChuff > now) this.chuff(this.nextChuff, 0.4 + p * 0.7);
                    this.nextChuff += gap;
                }
                if (this.nextChuff < now) this.nextChuff = now;
            } else {
                this.nextChuff = Math.max(this.nextChuff, now);
            }
        }

        // Rail roar
        this.rollGain.gain.setTargetAtTime(Math.min(0.13, v * 0.0055), now, 0.3);
        this.rollFilt.frequency.setTargetAtTime(220 + v * 16, now, 0.3);

        // Joints: one every ~18 m of rail
        if (v > 1) {
            const gap = 18 / v;
            const horizon = now + 0.2;
            let guard = 0;
            while (this.nextClack < horizon && guard++ < 20) {
                if (this.nextClack > now) this.clack(this.nextClack, Math.min(1, v / 14));
                this.nextClack += gap;
            }
            if (this.nextClack < now) this.nextClack = now;
        } else {
            this.nextClack = Math.max(this.nextClack, now);
        }

        // Squeal only when the shoes are on and she is actually moving.
        const sq = (e.brake ?? 0) * Math.min(1, v / 5) * (v > 0.6 ? 1 : 0);
        this.sqGain.gain.setTargetAtTime(sq * 0.05, now, 0.08);
        this.sqFilt.frequency.setTargetAtTime(1800 + (e.slip ?? 0) * 2200 + v * 22, now, 0.15);
    }
}

export const sound = new Sound();
