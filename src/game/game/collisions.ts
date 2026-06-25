import type { Chiptune } from "../audio";
import {
	BECKON_COUNT,
	BECKON_INTERVAL,
	CAGE_STOMP_TOLERANCE,
	FALL_DAMAGE,
	FLUTE_HEAL,
	FREEZE_STOMP,
	HARD_LAND_SPEED,
	HIT_DAMAGE,
	LAND_DUST_BASE,
	LAND_DUST_BONUS,
	LAND_DUST_FULL_SPEED,
	POOP_LINGER,
	POOP_SLOW,
	RESCUE_BURST_COUNT,
	STOMP_BOUNCE,
	STOMP_TOLERANCE,
	WAYPOINT_TIME,
} from "../const";
import type { Caticorn } from "../entities/Caticorn";
import type { Exit } from "../entities/Exit";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";
import type { Particles } from "../systems/Particles";
import type { ScreenShake } from "../systems/ScreenShake";
import {
	type Rect,
	rectsOverlap,
	TRAMPOLINE_VELOCITY,
	type WorldContext,
} from "../types";
import type { GroundPoop } from "./poop";
import type { FluteEntry } from "./scene";

/**
 * Mutable run state the collision pass reads and writes. Scalar fields that the
 * pass mutates are carried on this object (the orchestrator owns it) so the
 * extracted logic stays free of the Game instance while preserving identical
 * ordering and side effects.
 */
export interface CollisionState {
	poopTimer: number;
	invulnTimer: number;
	freezeTimer: number;
	score: number;
	songStep: number;
	totalRescued: number;
	health: number;
	waypointTimer: number;
	/** Countdown to the next exit-beckon sparkle pulse (dt-driven, unlocked only). */
	beckonTimer: number;
}

/** Read-only collaborators + callbacks the collision pass needs. */
export interface CollisionDeps {
	player: Player;
	monsters: Monster[];
	caticorns: Caticorn[];
	flutes: FluteEntry[];
	poops: GroundPoop[];
	trampolines: Rect[];
	spikes: Rect[];
	exit: Exit;
	particles: Particles;
	shake: ScreenShake;
	audio: Chiptune;
	ctx: WorldContext;
	/** Push HUD state (after a score/rescue/health change). */
	emitHud(): void;
	/**
	 * Apply an in-place hit for `amount` health (i-frames, shake, sfx). Returns
	 * true if the run ended (caller bails this frame).
	 */
	takeHit(amount: number): boolean;
	/** Begin the ghost-death animation (fatal = run already over). */
	beginDeath(fatal?: boolean): void;
	/** Advance to the next level / win. */
	clearLevel(): void;
}

/**
 * Resolve every player-vs-world interaction for one frame in the exact order
 * the orchestrator previously inlined: trampolines, hard-landing dust, poop
 * slow-zones, monsters (stomp/hit), spikes, flutes, caticorn rescues, then the
 * exit. Order is load-bearing for determinism and is preserved verbatim.
 *
 * @returns true if the frame should stop early (death or level clear).
 */
export function resolveCollisions(
	state: CollisionState,
	deps: CollisionDeps,
): boolean {
	const { player, particles, shake, audio, ctx } = deps;
	const dt = ctx.dt;
	const pBox = player.aabb();

	// Trampoline: landing on the pad while descending launches the player
	// high. Snap feet to the pad top so the bounce starts from its surface.
	if (player.velY >= 0) {
		for (const tramp of deps.trampolines) {
			if (rectsOverlap(pBox, tramp)) {
				player.pos.y = tramp.y;
				player.bounce(TRAMPOLINE_VELOCITY);
				player.view.y = player.pos.y;
				particles.burst(player.pos.x, player.pos.y, "puff", 8);
				shake.add(3);
				break;
			}
		}
	}

	// Hard landing: a fast touchdown kicks up dust. The camera "ground pound"
	// shake is reserved for double-jump landings, so an ordinary jump never
	// rattles the screen.
	if (player.justLanded && player.landImpactSpeed > HARD_LAND_SPEED) {
		// Scale the puff with impact: a heavier touchdown kicks up more dust.
		const impact = Math.min(1, player.landImpactSpeed / LAND_DUST_FULL_SPEED);
		const dustCount = Math.round(LAND_DUST_BASE + impact * LAND_DUST_BONUS);
		// At the player's feet (pos.y is bottom-centre).
		particles.burst(player.pos.x, player.pos.y, "dust", dustCount);
		if (player.landedFromDoubleJump) {
			const t = Math.min(1, player.landImpactSpeed / 1400);
			shake.add(2 + t * 3);
		}
	}

	// Poop: stepping on one (re)starts a lingering effect that keeps the
	// player slowed, brown-footed and unable to jump for POOP_LINGER seconds
	// after they leave it.
	for (const poop of deps.poops) {
		if (rectsOverlap(pBox, poop.box)) {
			state.poopTimer = POOP_LINGER;
			break;
		}
	}
	if (state.poopTimer > 0) {
		state.poopTimer -= dt;
		player.setPoopAffected(true);
		// Drag the player's speed down while the effect lasts.
		player.pos.x -= player.vel.x * dt * (1 - POOP_SLOW);
		player.vel.x *= POOP_SLOW;
		player.view.x = player.pos.x;
	} else {
		player.setPoopAffected(false);
	}

	// Hit a monster. Dead monsters are inert (skipped); so are non-lethal ones
	// (e.g. the overhead lurker). A live lethal monster is a stomp if the
	// player is falling onto its head, else it's a hit (unless invulnerable).
	for (const m of deps.monsters) {
		if (m.isDead() || !m.isLethal()) continue;
		const mBox = m.aabb();
		if (!rectsOverlap(pBox, mBox)) continue;
		const playerBottom = pBox.y + pBox.h;
		const stomp = player.velY > 0 && playerBottom <= mBox.y + STOMP_TOLERANCE;
		if (stomp) {
			m.kill();
			state.score += 1;
			player.bounce(STOMP_BOUNCE);
			particles.burst(m.pos.x, m.pos.y - mBox.h / 2, "puff", 8);
			shake.add(3);
			state.freezeTimer = FREEZE_STOMP;
			// Advance the rising tune (shared with caticorn rescues).
			audio.rescue(state.songStep++);
			deps.emitHud();
		} else if (state.invulnTimer <= 0) {
			if (deps.takeHit(HIT_DAMAGE)) return true; // drained the last health
		}
	}

	// Impaled on a ceiling spike: a heavier hit (1/3), not an instant death.
	if (state.invulnTimer <= 0) {
		for (const spike of deps.spikes) {
			if (rectsOverlap(pBox, spike)) {
				if (deps.takeHit(FALL_DAMAGE)) return true;
				break;
			}
		}
	}

	// Flutes drift in a lazy Lissajous loop around their home point so they
	// dodge a lazy grab; the collision box tracks the sprite.
	for (const flute of deps.flutes) {
		if (flute.taken) continue;
		flute.phase += dt;
		const dx = Math.sin(flute.phase * 1.3) * 26;
		const dy = Math.cos(flute.phase * 0.9) * 18;
		const fx = flute.homeX + dx;
		const fy = flute.homeY + dy;
		flute.view.x = fx;
		flute.view.y = fy;
		flute.box.x = fx - 14;
		flute.box.y = fy - 36;
		if (rectsOverlap(pBox, flute.box)) {
			flute.taken = true;
			flute.view.visible = false;
			state.health = Math.min(1, state.health + FLUTE_HEAL);
			particles.burst(
				flute.box.x + flute.box.w / 2,
				flute.box.y + 8,
				"note",
				6,
			);
			// Flutes also advance the run-long rising tune.
			audio.rescue(state.songStep++);
			deps.emitHud();
		}
	}

	// Rescue caticorns. Shackled ones free on contact; caged ones must be
	// stomped (landed on from above while falling), like breaking the cage.
	for (const cat of deps.caticorns) {
		if (cat.rescued) continue;
		const cBox = cat.aabb();
		if (!rectsOverlap(pBox, cBox)) continue;
		if (cat.containment === "cage") {
			// Caged box already covers the cage (taller aabb); a stomp is the
			// player descending onto its roof, not bumping it from the side.
			const fromAbove =
				player.velY > 0 && pBox.y + pBox.h <= cBox.y + CAGE_STOMP_TOLERANCE;
			if (!fromAbove) continue;
			player.bounce(STOMP_BOUNCE); // little hop off the broken cage
		}
		cat.rescue();
		state.totalRescued += 1;
		state.score += 1;
		// Celebratory pop: a star + spark confetti mix plus one expanding ring.
		const cx = cat.pos.x;
		const cy = cBox.y + cBox.h / 2;
		particles.celebrate(cx, cy, RESCUE_BURST_COUNT);
		particles.ring(cx, cy);
		// Advance the rising tune (shared with monster kills).
		audio.rescue(state.songStep++);
		deps.emitHud();
	}

	// Exit unlocks once all are freed; reaching it clears the level.
	const allFreed = deps.caticorns.every((c) => c.rescued);
	deps.exit.setUnlocked(allFreed);
	deps.exit.update(ctx);

	// Beckon: once unlocked, periodically emit a couple of sparkles drifting up
	// from around the gate to draw the eye. Timer is dt-driven (never every
	// frame) and only runs while unlocked; reset the timer so it fires promptly
	// the moment the exit unlocks.
	if (allFreed) {
		state.beckonTimer -= dt;
		if (state.beckonTimer <= 0) {
			state.beckonTimer = BECKON_INTERVAL;
			const eBox = deps.exit.aabb();
			const ex = eBox.x + eBox.w / 2;
			const ey = eBox.y + eBox.h / 2;
			for (let i = 0; i < BECKON_COUNT; i++) {
				// Spread the pair across the gate width by index (deterministic).
				const fx = ex + ((i + 0.5) / BECKON_COUNT - 0.5) * eBox.w;
				particles.burst(fx, ey, "sparkle", 1);
			}
		}
	} else {
		state.beckonTimer = 0;
	}

	if (rectsOverlap(pBox, deps.exit.aabb())) {
		if (allFreed) {
			deps.clearLevel();
			return true;
		}
		// Reached a locked exit: nudge the player toward who they missed.
		if (state.waypointTimer <= 0) audio.hurt();
		state.waypointTimer = WAYPOINT_TIME;
	}

	return false;
}
