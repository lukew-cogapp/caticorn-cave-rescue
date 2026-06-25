import { Container } from "pixi.js";
import { drawParticle } from "../art";
import { MOTE_ALPHA, MOTE_RISE_SPEED, MOTE_SWAY } from "../const";
import { GAME_HEIGHT } from "../types";

/** One slow-drifting ambient mote with a deterministic, looping path. */
interface Mote {
	view: Container;
	/** Spawn column across the world width; the mote sways around it. */
	homeX: number;
	/** Base vertical position; the mote rises from here and wraps back down. */
	baseY: number;
	/** Per-mote phase accumulator (sway), advanced by dt each frame. */
	phase: number;
	/** Per-mote sway speed + amplitude, derived from its index. */
	swaySpeed: number;
	swayRange: number;
	/** How far the mote has risen this loop (px); wraps at `riseSpan`. */
	rise: number;
	/** Vertical distance a mote climbs before wrapping back to baseY. */
	riseSpan: number;
}

/**
 * Slow-drifting ambient cave motes for atmosphere, distinct from the background
 * fireflies. They keep a small fixed population alive (no spawning bursts),
 * drift gently upward + sideways on deterministic sine paths, and wrap back down
 * when they finish a rise — so the population is constant and never starves the
 * gameplay particle pool (it has its own, separate sprites). Parented to the
 * scrolling world so they move with the level.
 *
 * Deterministic: all motion derives from per-mote indices + a phase accumulator
 * advanced by the clamped per-frame dt. No Math.random, no wall-clock.
 */
export class Motes {
	/** Container the caller adds to the world. */
	readonly view = new Container();
	private items: Mote[] = [];

	constructor() {
		// Motes are pure atmosphere; never intercept input.
		this.view.eventMode = "none";
	}

	/**
	 * Populate the layer with `count` motes spread across the world width. Call
	 * once per level (after clearing). Deterministic placement by index.
	 */
	spawn(worldWidth: number, count: number): void {
		this.clear();
		for (let i = 0; i < count; i++) {
			const g = drawParticle("mote");
			const homeX = ((i + 0.5) / count) * worldWidth;
			// Spread the starting heights through the lower/mid cave.
			const baseY = GAME_HEIGHT - 50 - ((i * 53) % 220);
			const riseSpan = 140 + ((i * 31) % 120);
			// Stagger each mote's starting rise so they're not in a flat row.
			const rise = (i * 37) % riseSpan || 0;
			g.x = homeX;
			g.y = baseY - rise;
			g.alpha = 0;
			this.view.addChild(g);
			this.items.push({
				view: g,
				homeX,
				baseY,
				phase: i * 1.7,
				swaySpeed: 0.4 + ((i * 7) % 5) / 10,
				swayRange: MOTE_SWAY * (0.6 + ((i * 13) % 8) / 10),
				rise,
				riseSpan,
			});
		}
	}

	/** Remove + free all motes (call before rebuilding a level). */
	clear(): void {
		for (const m of this.items) m.view.destroy({ children: true });
		this.view.removeChildren();
		this.items = [];
	}

	/**
	 * Rise + sway each mote, wrapping back to its base once it tops out, and fade
	 * it in/out at the ends of the loop so wraps aren't visible as pops.
	 */
	update(dt: number): void {
		for (const m of this.items) {
			m.phase += dt * m.swaySpeed;
			m.rise += dt * MOTE_RISE_SPEED;
			if (m.rise >= m.riseSpan) m.rise -= m.riseSpan; // loop back down
			const sway = Math.sin(m.phase) * m.swayRange;
			m.view.x = m.homeX + sway;
			m.view.y = m.baseY - m.rise;
			// Triangular fade across the loop: invisible at the ends, full mid-rise.
			const t = m.rise / m.riseSpan; // 0 -> 1
			const fade = 1 - Math.abs(t * 2 - 1); // 0 at ends, 1 at midpoint
			m.view.alpha = MOTE_ALPHA * fade;
		}
	}
}
