import type { Container } from "pixi.js";
import { drawMonster } from "../art";
import type { MonsterSpec, Platform, WorldContext } from "../types";
import { Entity } from "./Entity";

/**
 * Shared base for patrolling enemies. Holds the horizontal patrol state and
 * advances it each frame, reversing direction at the path edges and flipping
 * the view to face travel direction. Concrete subclasses add their own size and
 * any extra motion (e.g. the Bat's vertical bob).
 */
export abstract class Monster extends Entity {
	/** Centre of the patrol path (x), captured from spawn. */
	protected readonly originX: number;
	/** Half-width of the patrol path in pixels. */
	protected readonly range: number;
	/** Patrol speed in px/sec. */
	protected readonly speed: number;
	/** Current travel direction: 1 = right, -1 = left. */
	protected dir: 1 | -1 = 1;
	/** Once killed (stomped), the monster stops patrolling and plays a death fall. */
	private dead = false;

	constructor(view: Container, spec: MonsterSpec) {
		super(view, { x: spec.x, y: spec.y });
		this.originX = spec.x;
		this.range = spec.range;
		this.speed = spec.speed;
	}

	/**
	 * Mark this monster dead (e.g. after a stomp). Stops patrol and switches the
	 * subclass update() into a sink-spin-fade death animation. Idempotent: calling
	 * it again has no effect.
	 */
	kill(): void {
		this.dead = true;
	}

	/** True once {@link kill} has been called; the Game loop skips dead monsters. */
	isDead(): boolean {
		return this.dead;
	}

	/**
	 * Advance the death animation by dt: sink downward, spin, and fade the view
	 * toward fully transparent. Subclasses run this from update() while dead.
	 */
	protected animateDeath(dt: number): void {
		this.pos.y += 120 * dt;
		this.view.rotation += 6 * dt;
		this.view.alpha = Math.max(0, this.view.alpha - 2 * dt);
		this.syncView();
	}

	/**
	 * Advance horizontal patrol by dt, reversing at the path edges and updating
	 * facing. Returns nothing; subclasses call this then add their own motion.
	 */
	protected patrol(dt: number): void {
		this.pos.x += this.dir * this.speed * dt;
		const minX = this.originX - this.range;
		const maxX = this.originX + this.range;
		if (this.pos.x <= minX) {
			this.pos.x = minX;
			this.dir = 1;
		} else if (this.pos.x >= maxX) {
			this.pos.x = maxX;
			this.dir = -1;
		}
		this.view.scale.x = this.dir;
	}
}

/**
 * Ground-walking enemy. Patrols horizontally along its platform at spec.y with
 * no vertical motion.
 */
export class Crawler extends Monster {
	protected readonly halfWidth = 16;
	protected readonly height = 28;

	update(ctx: WorldContext): void {
		if (this.isDead()) {
			this.animateDeath(ctx.dt);
			return;
		}
		// Turn back at a ledge so crawlers never walk out over a pit. Probe a
		// little ahead of the leading edge for solid ground at foot level.
		if (!this.groundAhead(ctx.level.platforms)) {
			this.dir = this.dir === 1 ? -1 : 1;
			this.view.scale.x = this.dir;
		}
		this.patrol(ctx.dt);
		this.syncView();
	}

	/** True if a platform top supports the spot just ahead of the crawler. */
	private groundAhead(platforms: Platform[]): boolean {
		const probeX = this.pos.x + this.dir * (this.halfWidth + 4);
		const footY = this.pos.y;
		for (const p of platforms) {
			const onTop = Math.abs(p.y - footY) <= 2;
			const withinX = probeX >= p.x && probeX <= p.x + p.w;
			if (onTop && withinX) return true;
		}
		return false;
	}
}

/**
 * Floating enemy. Patrols horizontally and bobs vertically via a sine offset
 * applied around its spec.y baseline.
 */
export class Bat extends Monster {
	protected readonly halfWidth = 18;
	protected readonly height = 22;

	/** Vertical bob amplitude in pixels. */
	private static readonly BOB_AMPLITUDE = 22;
	/** Bob angular speed in radians/sec. */
	private static readonly BOB_SPEED = 3;

	/** Baseline y the bob oscillates around. */
	private readonly baseY: number;
	/** Accumulated phase, advanced by dt each frame. */
	private phase = 0;

	constructor(view: Container, spec: MonsterSpec) {
		super(view, spec);
		this.baseY = spec.y;
	}

	update(ctx: WorldContext): void {
		if (this.isDead()) {
			this.animateDeath(ctx.dt);
			return;
		}
		this.patrol(ctx.dt);
		this.phase += ctx.dt * Bat.BOB_SPEED;
		this.pos.y = this.baseY + Math.sin(this.phase) * Bat.BOB_AMPLITUDE;
		this.syncView();
	}
}

/** Build the right Monster subclass for a spec, wiring up its art. */
export function createMonster(spec: MonsterSpec): Monster {
	const view = drawMonster(spec.kind);
	return spec.kind === "bat" ? new Bat(view, spec) : new Crawler(view, spec);
}
