import type { Graphics } from "pixi.js";

/**
 * Day/night cycle: a slow wave drives the night overlay alpha. Uses
 * (1 - cos)/2 so it STARTS at full day (alpha 0) and eases into night, rather
 * than starting half-dark. Capped low so day stays bright.
 *
 * The overlay colour is set externally (re-filled in `loadLevel` per theme);
 * this function only animates the alpha so the per-theme tint carries through.
 *
 * @param nightOverlay The full-screen tint overlay (its alpha is written here).
 * @param phase Current accumulated phase in seconds (before this frame).
 * @param dt Clamped per-frame delta in seconds.
 * @param intensity Peak alpha multiplier (replaces the hard-coded 0.4). Lets
 *   each theme control how dark/eerie full night feels while keeping the same
 *   easing curve and deterministic timing.
 * @returns The new phase accumulator value (caller stores it back).
 */
export function updateDayNight(
	nightOverlay: Graphics,
	phase: number,
	dt: number,
	intensity: number,
): number {
	const nextPhase = phase + dt;
	const night = (1 - Math.cos(nextPhase * 0.16)) / 2; // 0 at start → 1
	nightOverlay.alpha = night * intensity;
	return nextPhase;
}
