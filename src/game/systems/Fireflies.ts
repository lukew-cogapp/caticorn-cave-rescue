import { Container } from "pixi.js";
import { drawFirefly } from "../art";
import { GAME_HEIGHT } from "../types";

/** One drifting firefly with a deterministic wandering path + pulsing glow. */
interface Firefly {
	view: Container;
	homeX: number;
	homeY: number;
	phase: number;
	/** Per-firefly speed/range variation, derived from its index. */
	rangeX: number;
	rangeY: number;
	speed: number;
}

/**
 * Harmless decorative fireflies drifting in the cave. They live in a fixed
 * background layer (added to the scrolling world so they sit behind gameplay)
 * and wander on deterministic sine paths with a gentle glow pulse — no
 * Math.random, no collisions, purely ambient.
 */
export class Fireflies {
	/** Container the caller adds to the world (behind entities). */
	readonly view = new Container();
	private items: Firefly[] = [];

	/**
	 * Populate the layer with `count` fireflies spread across the world width.
	 * Call once per level (after clearing). Deterministic placement by index.
	 */
	spawn(worldWidth: number, count: number): void {
		this.clear();
		for (let i = 0; i < count; i++) {
			const g = drawFirefly();
			// Spread across the world, at varied heights in the upper/mid cave.
			const homeX = ((i + 0.5) / count) * worldWidth;
			const homeY = Math.min(60 + ((i * 47) % 180), GAME_HEIGHT - 90);
			g.x = homeX;
			g.y = homeY;
			this.view.addChild(g);
			this.items.push({
				view: g,
				homeX,
				homeY,
				phase: i * 1.3,
				rangeX: 30 + ((i * 17) % 40),
				rangeY: 18 + ((i * 11) % 24),
				speed: 0.5 + ((i * 7) % 5) / 10,
			});
		}
	}

	/** Remove + free all fireflies (call before rebuilding a level). */
	clear(): void {
		for (const f of this.items) f.view.destroy({ children: true });
		this.view.removeChildren();
		this.items = [];
	}

	/** Drift each firefly along its sine path and pulse its glow. */
	update(dt: number): void {
		for (const f of this.items) {
			f.phase += dt * f.speed;
			f.view.x = f.homeX + Math.sin(f.phase) * f.rangeX;
			f.view.y = f.homeY + Math.cos(f.phase * 0.7) * f.rangeY;
			f.view.alpha = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(f.phase * 2.3));
		}
	}
}
