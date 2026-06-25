import type { Container } from "pixi.js";
import { drawExit, drawExitGlow } from "../art";
import type { Vec2, WorldContext } from "../types";
import { Entity } from "./Entity";

/** Angular speed of the subtle always-on glow shimmer (radians/sec). */
const SHIMMER_SPEED = 2.4;
/** Shimmer contribution to glow alpha (added on top of the proximity term). */
const SHIMMER_AMPLITUDE = 0.06;

/** Distance (px) at/under which the glow reads as fully near (nearness = 1). */
const NEAR_DISTANCE = 60;
/** Distance (px) at/over which the glow has faded to its dim floor. */
const FAR_DISTANCE = 400;

/** Glow alpha when the player is far away (and unlocked). */
const MIN_ALPHA = 0.25;
/** Glow alpha when the player is right on top of the exit (and unlocked). */
const MAX_ALPHA = 1;
/** Extra alpha cap while still locked: keep the portal dim/desaturated. */
const LOCKED_ALPHA_CAP = 0.3;

/** Glow scale at zero nearness. */
const MIN_GLOW_SCALE = 0.9;
/** Glow scale at full nearness (gentle bloom toward the player). */
const MAX_GLOW_SCALE = 1.18;

/**
 * The level exit. A static gate frame with an inner portal glow that brightens
 * as the player approaches. Stays dimmed/desaturated until all caticorns are
 * rescued, then allows the full proximity glow. The gate itself never animates;
 * only the inner glow responds to proximity (plus a faint always-on shimmer).
 *
 * Purely visual state; the Game loop decides when the player has reached and
 * triggered it.
 */
export class Exit extends Entity {
	protected readonly halfWidth = 22;
	protected readonly height = 56;

	/** True once all caticorns are rescued and the exit is usable. */
	unlocked = false;

	/** The inner portal glow child, animated by proximity + shimmer. */
	private readonly glow: Container;

	/** Accumulated phase for the glow shimmer, advanced by dt each frame. */
	private phase = 0;

	/**
	 * @param view - The static gate frame from drawExit().
	 * @param glow - The inner portal glow from drawExitGlow().
	 * @param pos - Bottom-centre world position.
	 */
	private constructor(view: Container, glow: Container, pos: Vec2) {
		super(view, pos);
		this.glow = glow;
		// Centre the glow on the gate (gate is drawn upward from bottom-centre).
		this.glow.x = 0;
		this.glow.y = -this.height / 2;
		this.view.addChild(this.glow);
	}

	/** Build an Exit with its own art so callers don't import art helpers. */
	static create(pos: Vec2): Exit {
		return new Exit(drawExit(), drawExitGlow(), pos);
	}

	update(ctx: WorldContext): void {
		// Proximity: distance from the player to the gate's centre.
		const gx = this.pos.x;
		const gy = this.pos.y - this.height / 2;
		const dx = ctx.player.pos.x - gx;
		const dy = ctx.player.pos.y - gy;
		const dist = Math.sqrt(dx * dx + dy * dy);

		// Map distance to a 0..1 nearness (1 = close, 0 = far), clamped.
		const span = FAR_DISTANCE - NEAR_DISTANCE;
		const nearness = Math.min(1, Math.max(0, (FAR_DISTANCE - dist) / span));

		// Subtle always-on shimmer so the portal feels alive even from afar.
		this.phase += ctx.dt * SHIMMER_SPEED;
		const shimmer = Math.sin(this.phase) * SHIMMER_AMPLITUDE;

		// Proximity is the dominant signal; shimmer just adds life on top.
		let alpha = MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * nearness + shimmer;
		// While locked, keep the glow dim/desaturated regardless of proximity.
		if (!this.unlocked) alpha = Math.min(alpha, LOCKED_ALPHA_CAP);
		this.glow.alpha = Math.min(MAX_ALPHA, Math.max(0, alpha));

		// Gentle bloom toward the player; the gate frame stays fixed.
		const scale = MIN_GLOW_SCALE + (MAX_GLOW_SCALE - MIN_GLOW_SCALE) * nearness;
		this.glow.scale.set(scale);

		this.syncView();
	}

	/** Set the unlocked state (call when rescue count reaches the level total). */
	setUnlocked(v: boolean): void {
		this.unlocked = v;
	}
}
