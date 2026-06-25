import { Graphics } from "pixi.js";
import { drawPlayer, type PlayerVariant } from "../art";
import {
	GAME_HEIGHT,
	GRAVITY,
	JUMP_VELOCITY,
	PLAYER_H,
	PLAYER_W,
	type Vec2,
	type WorldContext,
} from "../types";
import { Entity } from "./Entity";

/** Horizontal acceleration when a direction is held (px/sec^2). */
const ACCEL = 2600;
/** Horizontal deceleration applied as friction when no input (px/sec^2). */
const FRICTION = 2200;

/** Grace window after leaving a ledge where a ground jump still fires (s). */
const COYOTE_TIME = 0.1;
/** Window before landing within which a jump press is remembered + fired (s). */
const JUMP_BUFFER = 0.1;
/** Upward-velocity multiplier when the jump key is released early (jump-cut). */
const JUMP_CUT = 0.45;
/** Below this |vy|, gravity is softened for a floaty apex hang. */
const APEX_THRESHOLD = 90;
/** Gravity multiplier near the jump apex (hang) and while falling (snappier). */
const APEX_GRAVITY = 0.6;
const FALL_GRAVITY = 1.45;

/** |vel.x| under which the player counts as standing still (for idle breathing). */
const IDLE_SPEED_THRESHOLD = 6;
/** Idle breathing angular speed (radians/sec) — slow, calm bob. */
const IDLE_BREATH_SPEED = 3.2;
/** Idle breathing amplitude as a fraction of scale.y (very subtle). */
const IDLE_BREATH_AMPLITUDE = 0.03;

/**
 * The player character: a caticorn rescuer with skid-eased horizontal movement,
 * gravity, jumping, world-bound clamping, and one-way platform landing.
 *
 * Position is bottom-centre (matching level spawn data). Horizontal motion
 * accelerates toward a target speed and eases to a stop via friction so the
 * character feels weighty rather than snapping on/off instantly.
 */
export class Player extends Entity {
	protected readonly halfWidth = PLAYER_W / 2;
	protected readonly height = PLAYER_H;

	/** True while standing on a platform; gates jumping. */
	onGround = false;
	/** Facing direction for sprite flip: 1 = right, -1 = left. */
	facing: 1 | -1 = 1;

	/** Jumps used since last leaving the ground (0..MAX_JUMPS). */
	private jumpsUsed = 0;
	/** True while the jump key was held last frame (for edge detection). */
	private jumpHeld = false;
	/** Ground jump + one air jump. */
	private static readonly MAX_JUMPS = 2;

	/** Current squash/stretch: 0 = neutral, >0 = stretch tall, <0 = squash flat. */
	private squash = 0;
	/** Accumulated phase for the idle breathing bob, advanced by dt while idle. */
	private idlePhase = 0;
	/** True after a landing this frame (Game reads + clears it for juice fx). */
	justLanded = false;
	/** Downward speed at the moment of the last landing (for shake/dust scale). */
	landImpactSpeed = 0;
	/** Whether the just-completed airtime included a double (air) jump. Lets the
	 * Game restrict the landing shake to double jumps / big falls only. */
	landedFromDoubleJump = false;
	/** Tracks whether the current airtime has used the second (air) jump. */
	private doubleJumpedThisAir = false;
	/** Time left in the coyote-jump grace window (s). */
	private coyoteTimer = 0;
	/** Time left to honour a buffered jump press (s). */
	private bufferTimer = 0;
	/** True while a real jump's rise can still be cut by releasing the key. */
	private cuttable = false;

	/** True while the poop effect is active (slowed, brown feet, no jumping). */
	private poopAffected = false;
	/** Brown overlay drawn over the feet while poop-affected (lazy-created). */
	private poopFeet: Graphics | null = null;

	/** Build a Player with its own art so callers don't import art helpers. */
	static create(spawn: Vec2, variant: PlayerVariant): Player {
		return new Player(drawPlayer(variant), spawn);
	}

	update(ctx: WorldContext): void {
		const { keys, dt, level } = ctx;
		const left = keys.has("ArrowLeft") || keys.has("a");
		const right = keys.has("ArrowRight") || keys.has("d");
		const jump = keys.has("ArrowUp") || keys.has(" ") || keys.has("w");
		const maxSpeed = level.moveSpeed;

		// Skid/easing horizontal movement: accelerate toward target, else ease out.
		if (left && !right) {
			this.facing = -1;
			this.vel.x = Math.max(this.vel.x - ACCEL * dt, -maxSpeed);
		} else if (right && !left) {
			this.facing = 1;
			this.vel.x = Math.min(this.vel.x + ACCEL * dt, maxSpeed);
		} else {
			// No (or conflicting) input: decay toward zero, clamping through zero.
			const decay = FRICTION * dt;
			if (this.vel.x > 0) {
				this.vel.x = Math.max(0, this.vel.x - decay);
			} else if (this.vel.x < 0) {
				this.vel.x = Math.min(0, this.vel.x + decay);
			}
		}

		// Edge-triggered jump with coyote time, jump buffering, double jump, and
		// release-to-cut variable height.
		const jumpPressed = jump && !this.jumpHeld;
		const wasOnGround = this.onGround;
		if (this.onGround) {
			this.jumpsUsed = 0;
			this.doubleJumpedThisAir = false;
			this.coyoteTimer = COYOTE_TIME;
		} else {
			this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
		}
		// Remember a press briefly so one made just before landing still fires.
		this.bufferTimer = jumpPressed
			? JUMP_BUFFER
			: Math.max(0, this.bufferTimer - dt);

		// Poop-stuck feet can't jump (ground or air) until the effect wears off.
		if (this.bufferTimer > 0 && !this.poopAffected) {
			// The first jump is available from the ground OR within coyote time;
			// the second (air) jump is available until MAX_JUMPS is spent.
			const canGroundJump = this.jumpsUsed === 0 && this.coyoteTimer > 0;
			const canAirJump =
				this.jumpsUsed > 0 && this.jumpsUsed < Player.MAX_JUMPS;
			if (canGroundJump || canAirJump) {
				this.vel.y = JUMP_VELOCITY;
				this.onGround = false;
				this.coyoteTimer = 0;
				this.bufferTimer = 0;
				this.cuttable = true;
				// A ground-eligible first jump counts as jump #1; otherwise it's #2.
				this.jumpsUsed = canGroundJump ? 1 : this.jumpsUsed + 1;
				if (this.jumpsUsed >= 2) this.doubleJumpedThisAir = true;
				this.squash = 0.5; // pop tall on take-off
			}
		}
		// Variable height: releasing the key while still rising cuts the jump short.
		if (!jump && this.cuttable && this.vel.y < 0) {
			this.vel.y *= JUMP_CUT;
			this.cuttable = false;
		}
		if (this.vel.y >= 0) this.cuttable = false;
		this.jumpHeld = jump;

		// Gravity, scaled for a floaty apex and a snappier fall (Celeste-style).
		let gScale = 1;
		if (this.vel.y > 0) gScale = FALL_GRAVITY;
		else if (Math.abs(this.vel.y) < APEX_THRESHOLD) gScale = APEX_GRAVITY;
		this.vel.y += GRAVITY * gScale * dt;

		// Integrate horizontal position, clamped to world bounds.
		this.pos.x += this.vel.x * dt;
		const minX = PLAYER_W / 2;
		const maxX = level.worldWidth - PLAYER_W / 2;
		if (this.pos.x < minX) {
			this.pos.x = minX;
			this.vel.x = 0;
		} else if (this.pos.x > maxX) {
			this.pos.x = maxX;
			this.vel.x = 0;
		}

		// Integrate vertical position.
		const prevY = this.pos.y;
		this.pos.y += this.vel.y * dt;

		// One-way platform landing: only while falling, on a downward crossing of
		// a platform's top edge within its horizontal span (extended by halfWidth).
		this.onGround = false;
		const impact = this.vel.y;
		if (this.vel.y >= 0) {
			for (const p of level.platforms) {
				const top = p.y;
				const withinX =
					this.pos.x >= p.x - this.halfWidth &&
					this.pos.x <= p.x + p.w + this.halfWidth;
				const crossed = prevY <= top && this.pos.y >= top;
				if (withinX && crossed) {
					this.pos.y = top;
					this.vel.y = 0;
					this.onGround = true;
					break;
				}
			}
		}

		// Landing edge: squash flat, scaled by how hard the player hit.
		this.justLanded = false;
		if (this.onGround && !wasOnGround && impact > 60) {
			this.justLanded = true;
			this.landImpactSpeed = impact;
			this.landedFromDoubleJump = this.doubleJumpedThisAir;
			this.squash = -Math.min(0.45, impact / 1400);
		}

		// Ease squash toward neutral on the ground, or toward a velocity-driven
		// stretch in the air (juicy arc feel).
		const target = this.onGround
			? 0
			: Math.max(-0.3, Math.min(0.4, -this.vel.y / 1600));
		this.squash += (target - this.squash) * Math.min(1, dt * 12);

		// Idle breathing: a tiny vertical squash oscillation while standing still
		// on the ground. It only modulates scale.y (never the facing flip) and is
		// blended into the squash-driven scale below so it can't fight it.
		const idle =
			this.onGround &&
			Math.abs(this.vel.x) < IDLE_SPEED_THRESHOLD &&
			!left &&
			!right;
		let breath = 0;
		if (idle) {
			this.idlePhase += dt * IDLE_BREATH_SPEED;
			breath = Math.sin(this.idlePhase) * IDLE_BREATH_AMPLITUDE;
		} else {
			this.idlePhase = 0;
		}

		this.syncView();
		// Apply squash/stretch: positive = taller+thinner, negative = flatter+wider.
		// The idle breath adds a gentle multiplicative bob on top of scale.y only.
		this.view.scale.y = (1 + this.squash) * (1 + breath);
		this.view.scale.x = this.facing * (1 - this.squash * 0.5);
	}

	/** Reset to a spawn point with zero velocity (used on death/respawn). */
	respawn(spawn: Vec2): void {
		this.pos = { ...spawn };
		this.vel = { x: 0, y: 0 };
		this.onGround = false;
		this.jumpsUsed = 0;
		this.jumpHeld = false;
		this.syncView();
	}

	/** Launch upward at the given velocity (trampoline) and refresh air jumps. */
	bounce(velocity: number): void {
		this.vel.y = velocity;
		this.onGround = false;
		this.jumpsUsed = 0;
		// A trampoline launch isn't a held jump, so it can't be cut short.
		this.cuttable = false;
	}

	/** Slam the player straight down (e.g. struck by falling poop in mid-air). */
	slamDown(): void {
		this.vel.y = Math.max(this.vel.y, 900);
		this.cuttable = false;
	}

	/** Vertical velocity, for the Game loop to detect a falling landing. */
	get velY(): number {
		return this.vel.y;
	}

	/** True once the player has fallen entirely below the world. */
	fellOffWorld(): boolean {
		return this.pos.y - this.height > GAME_HEIGHT;
	}

	/**
	 * Toggle the poop effect: while active the player can't jump (handled in
	 * update) and a brown smear is drawn over the feet. The Game keeps this on
	 * for a second after the player leaves the poop.
	 */
	setPoopAffected(active: boolean): void {
		if (active === this.poopAffected) return;
		this.poopAffected = active;
		if (active) {
			if (!this.poopFeet) {
				this.poopFeet = new Graphics()
					.ellipse(-7, -1, 5, 3)
					.ellipse(7, -1, 5, 3)
					.fill("#6b4423");
			}
			this.view.addChild(this.poopFeet);
		} else if (this.poopFeet) {
			this.view.removeChild(this.poopFeet);
		}
	}
}
