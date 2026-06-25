/**
 * Tiny WebAudio chiptune engine for "Caticorn Cave Rescue".
 *
 * Pure oscillator-based 8-bit sound effects and jingles. No audio asset files.
 * Lazily creates a single {@link AudioContext} on first use so that importing
 * this module is safe during SSR (e.g. Astro's build), where `window` does not
 * exist. All public methods no-op when there is no AudioContext available.
 */

/** Supported oscillator waveforms for chiptune voices. */
type Wave = "square" | "triangle" | "sawtooth";

/** Window augmented with the legacy prefixed AudioContext constructor. */
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Master output gain, kept modest so the chiptune isn't harsh. */
const MASTER_GAIN = 0.2;

/**
 * Note-name → frequency in Hz, equal temperament referenced to A4 = 440 Hz.
 *
 * @param note - Scientific pitch name, e.g. "C4", "A#4", "G5".
 * @returns Frequency in Hz (falls back to 440 for an unrecognised name).
 */
function freq(note: string): number {
	const semitones: Record<string, number> = {
		C: -9,
		"C#": -8,
		D: -7,
		"D#": -6,
		E: -5,
		F: -4,
		"F#": -3,
		G: -2,
		"G#": -1,
		A: 0,
		"A#": 1,
		B: 2,
	};
	const match = /^([A-G]#?)(\d)$/.exec(note);
	if (!match) {
		return 440;
	}
	const name = match[1];
	const octave = Number(match[2]);
	const n = semitones[name] + (octave - 4) * 12;
	return 440 * 2 ** (n / 12);
}

/**
 * Tiny chiptune engine. Lazily creates a single AudioContext on first use
 * (must be triggered from a user gesture or after the game starts, which it is).
 */
export class Chiptune {
	/** The single shared AudioContext, created lazily on first sound. */
	private ctx: AudioContext | null = null;

	/**
	 * Lazily obtain (or create) the AudioContext.
	 *
	 * @returns The AudioContext, or `null` when running without a DOM (SSR) or
	 *   when WebAudio is unavailable.
	 */
	private getCtx(): AudioContext | null {
		if (typeof window === "undefined") {
			return null;
		}
		if (this.ctx) {
			return this.ctx;
		}
		const Ctor =
			window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
		if (!Ctor) {
			return null;
		}
		this.ctx = new Ctor();
		return this.ctx;
	}

	/**
	 * Resume the AudioContext. Browsers start it suspended until a user gesture;
	 * call this once from a click/keypress handler so sound can play. No-op when
	 * there is no AudioContext (SSR or unsupported browser).
	 */
	resume(): void {
		const ctx = this.getCtx();
		if (ctx && ctx.state === "suspended") {
			void ctx.resume();
		}
	}

	/**
	 * Schedule a single note: OscillatorNode → GainNode → destination, with a
	 * fast attack and a decay before the note ends to avoid clicks.
	 *
	 * @param ctx - The active AudioContext.
	 * @param frequency - Pitch in Hz.
	 * @param start - Start time relative to `ctx.currentTime`, in seconds.
	 * @param duration - Note length in seconds.
	 * @param wave - Oscillator waveform.
	 * @param gain - Peak gain for this note (before the master volume).
	 */
	private note(
		ctx: AudioContext,
		frequency: number,
		start: number,
		duration: number,
		wave: Wave,
		gain: number,
	): void {
		const t = ctx.currentTime + start;
		const osc = ctx.createOscillator();
		const env = ctx.createGain();

		osc.type = wave;
		osc.frequency.setValueAtTime(frequency, t);

		// Short attack/decay envelope to avoid clicks at note edges.
		const attack = Math.min(0.01, duration * 0.2);
		const peak = gain * MASTER_GAIN;
		env.gain.setValueAtTime(0, t);
		env.gain.linearRampToValueAtTime(peak, t + attack);
		env.gain.linearRampToValueAtTime(0.0001, t + duration);

		osc.connect(env);
		env.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + duration + 0.02);
	}

	/**
	 * Short happy jingle for clearing one level.
	 *
	 * Cheerful ascending arpeggio C5 E5 G5 → C6 on a triangle lead, resolving on
	 * the high tonic. ~1.2s total. No-op without an AudioContext.
	 */
	levelWin(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		const wave: Wave = "triangle";
		const seq: Array<[string, number, number]> = [
			["C5", 0.0, 0.18],
			["E5", 0.18, 0.18],
			["G5", 0.36, 0.18],
			["C6", 0.54, 0.55],
		];
		for (const [n, start, dur] of seq) {
			this.note(ctx, freq(n), start, dur, wave, 0.8);
		}
		// A sparkle of the fifth above the final tonic for a little shine.
		this.note(ctx, freq("G6"), 0.54, 0.55, "square", 0.25);
	}

	/**
	 * Longer triumphant fanfare for finishing the whole game.
	 *
	 * Three phrases over ~3.4s: an opening flourish, a rising melody, and a final
	 * C-major arpeggio held as a chord, with a second oscillator a third/fifth
	 * below for harmony. No-op without an AudioContext.
	 */
	gameWin(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		const lead: Wave = "square";
		const harmony: Wave = "triangle";

		// Phrase 1: opening flourish.
		const flourish: Array<[string, number, number]> = [
			["G4", 0.0, 0.12],
			["C5", 0.12, 0.12],
			["E5", 0.24, 0.12],
			["G5", 0.36, 0.3],
		];
		for (const [n, start, dur] of flourish) {
			this.note(ctx, freq(n), start, dur, lead, 0.7);
		}

		// Phrase 2: rising melody with a sustained harmony underneath.
		const melody: Array<[string, number, number]> = [
			["E5", 0.8, 0.2],
			["F5", 1.0, 0.2],
			["G5", 1.2, 0.2],
			["A5", 1.4, 0.2],
			["G5", 1.6, 0.2],
			["C6", 1.8, 0.45],
		];
		for (const [n, start, dur] of melody) {
			this.note(ctx, freq(n), start, dur, lead, 0.65);
		}
		// Held harmony notes (a third / sixth below) for body.
		this.note(ctx, freq("C5"), 0.8, 0.8, harmony, 0.4);
		this.note(ctx, freq("E5"), 1.6, 0.65, harmony, 0.4);

		// Phrase 3: final ascending C-major arpeggio resolving to a held chord.
		const arp: Array<[string, number, number]> = [
			["C5", 2.4, 0.16],
			["E5", 2.56, 0.16],
			["G5", 2.72, 0.16],
			["C6", 2.88, 0.16],
		];
		for (const [n, start, dur] of arp) {
			this.note(ctx, freq(n), start, dur, lead, 0.7);
		}
		// Final triumphant chord: tonic triad + octave, two waveforms layered.
		const chordStart = 3.04;
		const chordDur = 0.6;
		for (const n of ["C5", "E5", "G5"]) {
			this.note(ctx, freq(n), chordStart, chordDur, harmony, 0.35);
		}
		this.note(ctx, freq("C6"), chordStart, chordDur, lead, 0.6);
	}

	/**
	 * Plays one note of a cute, rainbowy rising tune when a caticorn is rescued.
	 * Pass the rescue index within the level so each pickup climbs a major
	 * pentatonic scale (and wraps up an octave) — collecting them in a row plays
	 * a little melody, note per caticorn. A soft octave sparkle sits on top.
	 *
	 * @param step Zero-based index of this rescue in the current level.
	 */
	rescue(step = 0): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		// C major pentatonic, ascending, wrapping an octave higher each cycle.
		const scale = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6", "A6"];
		const lead = scale[step % scale.length];
		const octaveUp = Math.floor(step / scale.length); // subtle extra lift
		const f = freq(lead) * 2 ** octaveUp;
		this.note(ctx, f, 0.0, 0.12, "triangle", 0.6);
		// Magical sparkle a perfect-octave above, quieter + shorter.
		this.note(ctx, f * 2, 0.02, 0.09, "square", 0.18);
	}

	/**
	 * Optional buzz when a life is lost.
	 *
	 * Short descending square buzz (A3 → D#3) with a slight detune feel, ~0.25s.
	 * No-op without an AudioContext.
	 */
	hurt(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.note(ctx, freq("A3"), 0.0, 0.12, "square", 0.7);
		this.note(ctx, freq("D#3"), 0.12, 0.13, "square", 0.7);
	}

	/**
	 * Schedule a note whose pitch glides from `fromHz` to `toHz` over its
	 * duration (a portamento sweep), for boings and zips. Same click-safe
	 * envelope as {@link note}.
	 */
	private sweep(
		ctx: AudioContext,
		fromHz: number,
		toHz: number,
		start: number,
		duration: number,
		wave: Wave,
		gain: number,
	): void {
		const t = ctx.currentTime + start;
		const osc = ctx.createOscillator();
		const env = ctx.createGain();
		osc.type = wave;
		osc.frequency.setValueAtTime(fromHz, t);
		osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), t + duration);
		const attack = Math.min(0.01, duration * 0.2);
		const peak = gain * MASTER_GAIN;
		env.gain.setValueAtTime(0, t);
		env.gain.linearRampToValueAtTime(peak, t + attack);
		env.gain.linearRampToValueAtTime(0.0001, t + duration);
		osc.connect(env);
		env.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + duration + 0.02);
	}

	/**
	 * Light blip on jump: a quick upward triangle chirp. Kept quiet + short so
	 * it never gets annoying when spammed. No-op without an AudioContext.
	 */
	jump(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.sweep(ctx, freq("E5"), freq("A5"), 0, 0.09, "triangle", 0.35);
	}

	/**
	 * Punchy thunk when stomping a monster or a cage: a fast downward square
	 * sweep with a click of body. No-op without an AudioContext.
	 */
	stomp(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.sweep(ctx, freq("G4"), freq("C3"), 0, 0.14, "square", 0.55);
		this.note(ctx, freq("C3"), 0, 0.06, "triangle", 0.5);
	}

	/**
	 * Springy "boing" when bouncing off a trampoline: an upward triangle sweep
	 * with a wobble feel from a layered square. No-op without an AudioContext.
	 */
	trampoline(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.sweep(ctx, freq("C4"), freq("C6"), 0, 0.22, "triangle", 0.5);
		this.sweep(ctx, freq("G4"), freq("G5"), 0.04, 0.16, "square", 0.18);
	}

	/**
	 * Soft healing shimmer when a flute is collected: a gentle rising perfect
	 * fifth with an octave sparkle. No-op without an AudioContext.
	 */
	flute(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.note(ctx, freq("G5"), 0.0, 0.16, "triangle", 0.4);
		this.note(ctx, freq("D6"), 0.08, 0.18, "triangle", 0.4);
		this.note(ctx, freq("G6"), 0.12, 0.2, "square", 0.15);
	}

	/**
	 * Low squelch when stepping in poop: a short detuned downward blob.
	 * No-op without an AudioContext.
	 */
	squish(): void {
		const ctx = this.getCtx();
		if (!ctx) {
			return;
		}
		this.sweep(ctx, freq("D3"), freq("A2"), 0, 0.16, "sawtooth", 0.3);
	}
}
