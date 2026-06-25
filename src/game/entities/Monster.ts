import type { Container } from "pixi.js";
import { drawMonster } from "../art";
import {
	BAT_BOB_AMPLITUDE,
	BAT_BOB_SPEED,
	LUKE_HALF_WIDTH,
	LUKE_HEIGHT,
	LUKE_SWING_ACTIVE,
	LUKE_SWING_INTERVAL,
	LUKE_SWING_WINDUP,
	LUKE_SWORD_REACH,
	LURKER_DROP_INTERVAL,
	LURKER_SWAY,
} from "../const";
import type { ThemeStyle } from "../level/themes";
import type { MonsterSpec, Platform, Rect, WorldContext } from "../types";
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

	/** Whether touching this monster harms the player. Overridden by harmless ones. */
	isLethal(): boolean {
		return true;
	}

	/** Poll for a pending poop drop (Lurker only); null for monsters that don't drop. */
	consumeDrop(): number | null {
		return null;
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
	protected readonly halfWidth: number = 16;
	protected readonly height: number = 28;

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
	protected groundAhead(platforms: Platform[]): boolean {
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
 * Final-cave boss. Walks and turns at ledges exactly like a {@link Crawler}
 * (same patrol + ground-probe), but is taller (caticorn-sized) and periodically
 * swings a sword.
 *
 * The swing runs on a deterministic, dt-driven cycle of length
 * {@link LUKE_SWING_INTERVAL}: rest, then a {@link LUKE_SWING_WINDUP} wind-up
 * (sword drawn extended as a telegraph, but the hitbox is still normal), then a
 * {@link LUKE_SWING_ACTIVE} active slash (hitbox widened by
 * {@link LUKE_SWORD_REACH} on his facing side — the only window the sword can
 * hit), then back to rest. The extended-sword pose covers wind-up + active so
 * the widened hitbox is always telegraphed, keeping it fair. Stompable on the
 * head like any monster; side/sword contact damages the player.
 */
export class Luke extends Crawler {
	protected override readonly halfWidth = LUKE_HALF_WIDTH;
	protected override readonly height = LUKE_HEIGHT;

	/** Time accumulated within the current swing cycle (seconds, dt-driven). */
	private swingClock = 0;
	/** Rest pose (sword upright); visible except during wind-up + active. */
	private readonly restView: Container;
	/** Swing pose (sword extended); visible during wind-up + active. */
	private readonly swingView: Container;

	constructor(view: Container, spec: MonsterSpec) {
		super(view, spec);
		// The container passed in holds the two prebuilt poses (see createMonster):
		// child 0 = rest, child 1 = swing. Hold references so we can toggle cheaply.
		this.restView = view.children[0] as Container;
		this.swingView = view.children[1] as Container;
		this.swingView.visible = false;
	}

	/** True once the wind-up has elapsed and the slash hitbox is live. */
	private get swingActive(): boolean {
		const windupStart =
			LUKE_SWING_INTERVAL - LUKE_SWING_WINDUP - LUKE_SWING_ACTIVE;
		const activeStart = windupStart + LUKE_SWING_WINDUP;
		return this.swingClock >= activeStart;
	}

	/** True during wind-up + active — the window the sword is drawn extended. */
	private get swingTelegraph(): boolean {
		const windupStart =
			LUKE_SWING_INTERVAL - LUKE_SWING_WINDUP - LUKE_SWING_ACTIVE;
		return this.swingClock >= windupStart;
	}

	override update(ctx: WorldContext): void {
		if (this.isDead()) {
			this.animateDeath(ctx.dt);
			return;
		}
		// Identical crawler movement: turn at ledges, then patrol.
		if (!this.groundAhead(ctx.level.platforms)) {
			this.dir = this.dir === 1 ? -1 : 1;
			this.view.scale.x = this.dir;
		}
		this.patrol(ctx.dt);

		// Advance the deterministic swing cycle and swap the pose at the telegraph.
		this.swingClock += ctx.dt;
		if (this.swingClock >= LUKE_SWING_INTERVAL)
			this.swingClock -= LUKE_SWING_INTERVAL;
		const telegraph = this.swingTelegraph;
		this.restView.visible = !telegraph;
		this.swingView.visible = telegraph;

		this.syncView();
	}

	/**
	 * Collision box. Identical to a crawler's at rest, but during the active
	 * slash it widens on Luke's facing side by {@link LUKE_SWORD_REACH} so the
	 * extended sword can strike the player.
	 */
	override aabb(): Rect {
		const base = super.aabb();
		if (!this.swingActive) return base;
		// `dir` is +1 facing right, -1 facing left; extend the box on that side.
		if (this.dir === 1) {
			base.w += LUKE_SWORD_REACH;
		} else {
			base.x -= LUKE_SWORD_REACH;
			base.w += LUKE_SWORD_REACH;
		}
		return base;
	}
}

/**
 * Floating enemy. Patrols horizontally and bobs vertically via a sine offset
 * applied around its spec.y baseline.
 */
export class Bat extends Monster {
	protected readonly halfWidth = 18;
	protected readonly height = 22;

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
		this.phase += ctx.dt * BAT_BOB_SPEED;
		this.pos.y = this.baseY + Math.sin(this.phase) * BAT_BOB_AMPLITUDE;
		this.syncView();
	}
}

/**
 * Ceiling-dweller. Clings to the ceiling and drifts slowly, always toward the
 * player's current x (never starts in the spawn zone — enforced at placement).
 * Periodically drops a poop straight down. It is not lethal on contact (it lives
 * out of reach overhead); the hazard is the poop it leaves on the floor.
 */
export class Lurker extends Monster {
	protected readonly halfWidth = 15;
	protected readonly height = 26;

	private dropTimer = LURKER_DROP_INTERVAL;
	private swayPhase = 0;
	/** World x of a pending poop drop, or null when nothing to drop this frame. */
	private pendingDrop: number | null = null;

	/** Overhead and out of reach: contact is harmless, the dropped poop isn't. */
	override isLethal(): boolean {
		return false;
	}

	update(ctx: WorldContext): void {
		if (this.isDead()) {
			this.animateDeath(ctx.dt);
			return;
		}
		// Drift slowly toward the player's x, then add a small idle sway so it
		// reads as alive. `speed` is intentionally low for the ceiling stalker.
		const targetX = ctx.player.pos.x;
		const step = this.speed * ctx.dt;
		if (Math.abs(targetX - this.pos.x) > step) {
			this.pos.x += Math.sign(targetX - this.pos.x) * step;
			this.view.scale.x = targetX < this.pos.x ? -1 : 1;
		}
		this.swayPhase += ctx.dt;
		this.pos.x += Math.cos(this.swayPhase * 1.5) * LURKER_SWAY * ctx.dt;
		// Keep within the world bounds.
		this.pos.x = Math.max(40, Math.min(ctx.level.worldWidth - 40, this.pos.x));

		// Drop poop on a fixed cadence.
		this.dropTimer -= ctx.dt;
		if (this.dropTimer <= 0) {
			this.dropTimer = LURKER_DROP_INTERVAL;
			this.pendingDrop = this.pos.x;
		}
		this.syncView();
	}

	/**
	 * If a poop drop is due, return its world x once and clear it; otherwise null.
	 * The Game loop polls this to spawn poop on the ground below.
	 */
	consumeDrop(): number | null {
		const x = this.pendingDrop;
		this.pendingDrop = null;
		return x;
	}
}

/**
 * Build the right Monster subclass for a spec, wiring up its art.
 *
 * @param spec - Monster placement data (kind, position, patrol range, speed).
 * @param accent - Optional theme accent `#rrggbb` to recolour the body toward.
 * @param style - Optional visual theme that layers a per-cave flourish on the
 *   sprite (e.g. crystal shards, icy rim, ghostly translucency). Physics and
 *   gameplay behaviour are unaffected.
 */
export function createMonster(
	spec: MonsterSpec,
	accent?: string,
	style?: ThemeStyle,
): Monster {
	const view = drawMonster(spec.kind, accent, style);
	switch (spec.kind) {
		case "bat":
			return new Bat(view, spec);
		case "lurker":
			return new Lurker(view, spec);
		case "luke":
			return new Luke(view, spec);
		default:
			return new Crawler(view, spec);
	}
}
