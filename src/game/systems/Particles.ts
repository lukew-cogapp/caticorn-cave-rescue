import type { Container } from "pixi.js";
import { drawParticle } from "../art";
import { MAX_PARTICLES, PARTICLE_LIFE } from "../const";

/** Visual style for a particle burst. */
export type ParticleKind = "spark" | "note" | "puff" | "dust";

/** A short-lived visual fleck animated by the system. */
interface Particle {
	view: Container;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
}

/**
 * Deterministic particle pool. Bursts fan out with index-derived angles (never
 * Math.random); particles arc under light gravity and fade+shrink over their
 * life. Views are parented into a provided world container.
 */
export class Particles {
	private items: Particle[] = [];

	/** @param world Container that burst views are added to. */
	constructor(private readonly world: Container) {}

	/**
	 * Drop all references. The world container is expected to be cleared by the
	 * caller (which detaches/destroys the views), so this just empties the pool.
	 */
	clear(): void {
		this.items = [];
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
	 * Advance every live particle: integrate under light gravity, fade and shrink
	 * over lifetime, and destroy + remove when spent.
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
	}
}
