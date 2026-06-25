import type { Container } from "pixi.js";
import { drawParticle, drawRescueRing } from "../art";
import {
	MAX_PARTICLES,
	MAX_RINGS,
	PARTICLE_LIFE,
	RING_LIFE,
	RING_MAX_SCALE,
} from "../const";

/** Visual style for a particle burst. */
export type ParticleKind =
	| "spark"
	| "note"
	| "puff"
	| "dust"
	| "star"
	| "sparkle";

/** A short-lived visual fleck animated by the system. */
interface Particle {
	view: Container;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
}

/** An expanding celebratory ring: scales up from 1x to RING_MAX_SCALE + fades. */
interface Ring {
	view: Container;
	life: number;
}

/**
 * Deterministic particle pool. Bursts fan out with index-derived angles (never
 * Math.random); particles arc under light gravity and fade+shrink over their
 * life. A separate, tiny ring pool handles expanding rescue rings so they never
 * eat into the burst budget. Views are parented into a provided world container.
 */
export class Particles {
	private items: Particle[] = [];
	/** Separate pool so rings never starve the burst budget (own MAX_RINGS cap). */
	private rings: Ring[] = [];

	/** @param world Container that burst views are added to. */
	constructor(private readonly world: Container) {}

	/**
	 * Drop all references. The world container is expected to be cleared by the
	 * caller (which detaches/destroys the views), so this just empties the pools.
	 */
	clear(): void {
		this.items = [];
		this.rings = [];
	}

	/**
	 * Spawn `count` particles of `kind` at a world point with a deterministic
	 * radial spread. Ignored once the live cap is reached.
	 */
	burst(x: number, y: number, kind: ParticleKind, count: number): void {
		if (this.items.length >= MAX_PARTICLES) return;
		const n = Math.min(count, MAX_PARTICLES - this.items.length);
		for (let i = 0; i < n; i++) {
			const angle = (i / n) * Math.PI * 2;
			// Spread speed varies a touch by index for a less uniform ring.
			const speed = 80 + (i % 3) * 40;
			const view = drawParticle(kind);
			view.x = x;
			view.y = y;
			this.world.addChild(view);
			// "note" drifts upward musically; others fan out radially with a slight
			// upward bias so they read as a pop rather than a flat circle.
			const vx = Math.cos(angle) * speed;
			const vy =
				kind === "note" ? -90 - (i % 3) * 30 : Math.sin(angle) * speed - 60;
			this.items.push({
				view,
				vx,
				vy,
				life: PARTICLE_LIFE,
				maxLife: PARTICLE_LIFE,
			});
		}
	}

	/**
	 * Emit a mix of `count` star + spark particles at a world point, alternating
	 * by index. A more celebratory variant of {@link burst} for rescues; it shares
	 * the burst pool + cap.
	 */
	celebrate(x: number, y: number, count: number): void {
		if (this.items.length >= MAX_PARTICLES) return;
		const n = Math.min(count, MAX_PARTICLES - this.items.length);
		for (let i = 0; i < n; i++) {
			const angle = (i / n) * Math.PI * 2;
			const speed = 90 + (i % 4) * 35;
			// Alternate star/spark so the pop reads as varied confetti.
			const view = drawParticle(i % 2 === 0 ? "star" : "spark");
			view.x = x;
			view.y = y;
			this.world.addChild(view);
			this.items.push({
				view,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 70,
				life: PARTICLE_LIFE,
				maxLife: PARTICLE_LIFE,
			});
		}
	}

	/**
	 * Spawn ONE expanding ring at a world point. It scales from 1x to
	 * {@link RING_MAX_SCALE} while fading to zero over {@link RING_LIFE} seconds,
	 * then self-destroys. Uses its own pool (cap {@link MAX_RINGS}) so it never
	 * competes with gameplay bursts for the particle budget.
	 */
	ring(x: number, y: number): void {
		if (this.rings.length >= MAX_RINGS) return;
		const view = drawRescueRing();
		view.x = x;
		view.y = y;
		view.scale.set(1);
		this.world.addChild(view);
		this.rings.push({ view, life: RING_LIFE });
	}

	/**
	 * Advance every live particle + ring: integrate flecks under light gravity,
	 * fade and shrink over lifetime; scale rings up while fading; destroy + remove
	 * when spent.
	 *
	 * @param dt Seconds since the last frame.
	 */
	update(dt: number): void {
		for (let i = this.items.length - 1; i >= 0; i--) {
			const p = this.items[i];
			p.life -= dt;
			if (p.life <= 0) {
				this.world.removeChild(p.view);
				p.view.destroy({ children: true });
				this.items.splice(i, 1);
				continue;
			}
			p.vy += 420 * dt; // gentle gravity so they arc and settle
			p.view.x += p.vx * dt;
			p.view.y += p.vy * dt;
			const k = p.life / p.maxLife; // 1 -> 0
			p.view.alpha = k;
			p.view.scale.set(0.4 + k * 0.6);
		}

		// Expanding rings: progress 0 -> 1 over RING_LIFE; scale grows linearly
		// from 1x toward RING_MAX_SCALE while alpha fades 1 -> 0.
		for (let i = this.rings.length - 1; i >= 0; i--) {
			const r = this.rings[i];
			r.life -= dt;
			if (r.life <= 0) {
				this.world.removeChild(r.view);
				r.view.destroy({ children: true });
				this.rings.splice(i, 1);
				continue;
			}
			const t = 1 - r.life / RING_LIFE; // 0 -> 1
			r.view.scale.set(1 + (RING_MAX_SCALE - 1) * t);
			r.view.alpha = 1 - t;
		}
	}
}
