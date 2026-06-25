import { Application } from "pixi.js";
import type { PlayerVariant } from "./art";
import { Game } from "./Game";
import { GAME_HEIGHT, GAME_WIDTH, type HudCallback } from "./types";

export { CHARACTERS, type PlayerVariant } from "./art";
export type { HudCallback, HudState } from "./types";

/** Handle the host page uses to drive the game once booted. */
export interface GameHandle {
	/** Begin a run with the chosen character (called from the start screen). */
	start(variant: PlayerVariant, seed?: number): void;
	/** Restart from level 1 with the current character. */
	restart(): void;
	/** Resize renderer for fullscreen (CSS px). */
	resize(width: number, height: number): void;
	/** Restore default internal resolution (on exit fullscreen). */
	resetView(): void;
	destroy(): void;
}

/**
 * Boots the caticorn rescue platformer into the given canvas. The game waits in
 * an idle state until `start(variant)` is called from the character-select screen.
 */
export async function bootGame(
	canvas: HTMLCanvasElement,
	onHud: HudCallback,
): Promise<GameHandle> {
	const app = new Application();
	await app.init({
		canvas,
		width: GAME_WIDTH,
		height: GAME_HEIGHT,
		// Match the start-screen / boot-skeleton purple so there's no colour flash
		// before the first level paints over it.
		background: "#2e1065",
		antialias: true,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true,
	});

	const game = new Game(app, onHud);

	return {
		start: (variant, seed) => game.start(variant, seed),
		restart: () => game.restart(),
		resize: (w, h) => game.resize(w, h),
		resetView: () => game.resetView(),
		destroy: () => game.destroy(),
	};
}
