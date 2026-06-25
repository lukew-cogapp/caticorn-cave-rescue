import type { Container } from "pixi.js";

/**
 * Deterministic screen shake. Drives a sine/cosine offset on a target display
 * object's pivot from an accumulating phase (no Math.random), decaying to zero.
 * Using the pivot keeps the target's x/y (e.g. a letterbox offset) untouched.
 */
export class ScreenShake {
	/** Remaining shake magnitude in px; decays to 0 each frame. */
	private mag = 0;
	/** Accumulating phase driving the deterministic offset. */
	private phase = 0;

	/** @param target Display object whose pivot is offset (typically the stage). */
	constructor(private readonly target: Container) {}

	/**
	 * Add an impulse. The largest active impulse wins rather than stacking, so
	 * chained events stay tasteful.
	 *
	 * @param intensity Peak offset in pixels for this shake.
	 */
	add(intensity: number): void {
		this.mag = Math.max(this.mag, intensity);
	}

	/** Reset to rest immediately (e.g. on level load). */
	reset(): void {
		this.mag = 0;
		this.target.pivot.set(0, 0);
	}

	/**
	 * Advance the shake: decay the magnitude and apply the offset; snap the pivot
	 * back to 0 once the shake has died out.
	 *
	 * @param dt Seconds since the last frame.
	 */
	update(dt: number): void {
		this.phase += dt;
		if (this.mag <= 0.01) {
			if (this.target.pivot.x !== 0 || this.target.pivot.y !== 0) {
				this.target.pivot.set(0, 0);
			}
			this.mag = 0;
			return;
		}
		const ox = Math.sin(this.phase * 90) * this.mag;
		const oy = Math.cos(this.phase * 70) * this.mag;
		this.target.pivot.set(ox, oy);
		// Exponential-ish decay, frame-rate independent.
		this.mag -= this.mag * Math.min(1, dt * 9);
	}
}
