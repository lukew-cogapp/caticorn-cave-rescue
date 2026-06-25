import type { Graphics } from "pixi.js";

/**
 * Day/night cycle: a slow wave drives the night overlay alpha. Uses
 * (1 - cos)/2 so it STARTS at full day (alpha 0) and eases into night, rather
 * than starting half-dark. Capped low so day stays bright.
 *
 * @param phase Current accumulated phase in seconds (before this frame).
 * @param dt Clamped per-frame delta in seconds.
 * @returns The new phase accumulator value (caller stores it back).
 */
export function updateDayNight(
	nightOverlay: Graphics,
	phase: number,
	dt: number,
): number {
	const nextPhase = phase + dt;
	const night = (1 - Math.cos(nextPhase * 0.16)) / 2; // 0 at start → 1
	nightOverlay.alpha = night * 0.4;
	return nextPhase;
}
