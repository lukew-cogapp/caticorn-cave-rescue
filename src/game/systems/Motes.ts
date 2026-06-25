import { Container } from "pixi.js";
import { drawParticle } from "../art";
import {
	AMBIENT_PROFILES,
	AMBIENT_TRAVEL_SPAN,
	AMBIENT_TWINKLE_SPEED,
} from "../const";
import type { AmbientKind } from "../level/themes";
import { GAME_HEIGHT } from "../types";

/** One ambient drifter with a deterministic, looping path. */
interface Mote {
	view: Container;
	/** Spawn column across the world width; the drifter sways around it. */
	homeX: number;
	/** Base vertical position; the drifter travels from here and wraps back. */
	baseY: number;
	/** Per-drifter phase accumulator (sway + twinkle), advanced by dt each frame. */
	phase: number;
	/** Per-drifter sway speed + amplitude, derived from its index. */
	swaySpeed: number;
	swayRange: number;
	/** How far the drifter has travelled this loop (px); wraps at `travelSpan`. */
	travelled: number;
	/** Vertical distance a drifter covers before wrapping back to baseY. */
	travelSpan: number;
}

/**
 * Themed ambient drifter layer for cave atmosphere, distinct from the background
 * fireflies. It keeps a small fixed population alive (no spawning bursts) and
 * gives each cave a signature mood by drawing the theme's {@link AmbientKind}
 * particle (petal/gemsparkle/snow/fog/spore/ember) and moving it to suit:
 * petals + snow fall gently with sway, embers + spores rise, fog drifts slow and
 * wide, gemsparkle twinkles near in place. Drifters wrap back to their start so
 * the population is constant and never starves the gameplay particle pool (it
 * has its own, separate sprites). Parented to the scrolling world so they move
 * with the level.
 *
 * Deterministic: all motion derives from per-drifter indices + phase
 * accumulators advanced by the clamped per-frame dt. No Math.random, no
 * wall-clock.
 */
export class Motes {
	/** Container the caller adds to the world. */
	readonly view = new Container();
	private items: Mote[] = [];
	/** Motion profile of the currently-spawned ambient kind. */
	private profile = AMBIENT_PROFILES.petal;

	constructor() {
		// Drifters are pure atmosphere; never intercept input.
		this.view.eventMode = "none";
	}

	/**
	 * Populate the layer with `count` ambient drifters of `kind` spread across the
	 * world width. Call once per level (after clearing). Deterministic placement by
	 * index; the kind selects both the sprite and the motion profile.
	 */
	spawn(worldWidth: number, count: number, kind: AmbientKind): void {
		this.clear();
		this.profile = AMBIENT_PROFILES[kind];
		const span = AMBIENT_TRAVEL_SPAN;
		for (let i = 0; i < count; i++) {
			const g = drawParticle(kind);
			const homeX = ((i + 0.5) / count) * worldWidth;
			// Spread the starting heights through the lower/mid cave.
			const baseY = GAME_HEIGHT - 50 - ((i * 53) % 220);
			const travelSpan = span - ((i * 31) % 120);
			// Stagger each drifter's progress so they're not in a flat row.
			const travelled = (i * 37) % travelSpan;
			g.x = homeX;
			g.alpha = 0;
			this.view.addChild(g);
			this.items.push({
				view: g,
				homeX,
				baseY,
				phase: i * 1.7,
				swaySpeed: 0.4 + ((i * 7) % 5) / 10,
				swayRange: this.profile.sway * (0.6 + ((i * 13) % 8) / 10),
				travelled,
				travelSpan,
			});
		}
	}

	/** Remove + free all drifters (call before rebuilding a level). */
	clear(): void {
		for (const m of this.items) m.view.destroy({ children: true });
		this.view.removeChildren();
		this.items = [];
	}

	/**
	 * Travel + sway each drifter per its kind's motion profile, wrapping back to
	 * its base once it completes a loop, and fading it in/out at the loop ends so
	 * wraps aren't visible as pops. In-place kinds (profile dir 0) hold their
	 * vertical position and twinkle their alpha instead.
	 */
	update(dt: number): void {
		const { dir, speed } = this.profile;
		for (const m of this.items) {
			m.phase += dt * m.swaySpeed;
			m.travelled += dt * speed;
			if (m.travelled >= m.travelSpan) m.travelled -= m.travelSpan; // loop
			const sway = Math.sin(m.phase) * m.swayRange;
			m.view.x = m.homeX + sway;
			// dir +1 falls (y increases), -1 rises (y decreases), 0 stays put.
			m.view.y = m.baseY + dir * m.travelled;
			if (dir === 0) {
				// Twinkle in place: pulse alpha between a dim floor and the peak.
				const tw = (Math.sin(m.phase * AMBIENT_TWINKLE_SPEED) + 1) / 2;
				m.view.alpha = this.profile.alpha * (0.35 + 0.65 * tw);
			} else {
				// Triangular fade across the loop: invisible at the ends, full mid-way.
				const t = m.travelled / m.travelSpan; // 0 -> 1
				const fade = 1 - Math.abs(t * 2 - 1); // 0 at ends, 1 at midpoint
				m.view.alpha = this.profile.alpha * fade;
			}
		}
	}
}
