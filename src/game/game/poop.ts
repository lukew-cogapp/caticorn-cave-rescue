import type { Container } from "pixi.js";
import { drawPoop } from "../art";
import { POOP_BOX, POOP_LIFE } from "../const";
import type { Player } from "../entities/Player";
import type { Particles } from "../systems/Particles";
import { GAME_HEIGHT, type Level, type Rect } from "../types";

/** A ground poop slow-zone: sprite + collision box + remaining lifetime. */
export interface GroundPoop {
	view: Container;
	box: Rect;
	life: number;
}

/** A poop falling from a lurker: sprite + vertical velocity + x. */
export interface FallingPoop {
	view: Container;
	vy: number;
	x: number;
}

/**
 * Spawn a poop sprite + slow-zone collision box at a world point (where a
 * ceiling lurker's drop landed). The poop fades out and is removed after
 * POOP_LIFE seconds. Defaults to the ground line when no y is given.
 */
export function dropPoopAt(
	world: Container,
	poops: GroundPoop[],
	x: number,
	y: number = GAME_HEIGHT - 30,
): void {
	const g = drawPoop();
	g.x = x;
	g.y = y;
	world.addChild(g);
	poops.push({
		view: g,
		box: {
			x: x - POOP_BOX.halfWidth,
			y: y - POOP_BOX.height,
			w: POOP_BOX.halfWidth * 2,
			h: POOP_BOX.height,
		},
		life: POOP_LIFE,
	});
}

/** Age ground poops; fade out the last second and remove when spent. */
export function updatePoops(
	world: Container,
	poops: GroundPoop[],
	dt: number,
): void {
	for (let i = poops.length - 1; i >= 0; i--) {
		const poop = poops[i];
		poop.life -= dt;
		if (poop.life <= 0) {
			world.removeChild(poop.view);
			poop.view.destroy({ children: true });
			poops.splice(i, 1);
		} else if (poop.life < 1) {
			poop.view.alpha = poop.life; // fade over the final second
		}
	}
}

/** Spawn a poop that falls from `y` and becomes a ground hazard on landing. */
export function spawnFallingPoop(
	world: Container,
	fallingPoops: FallingPoop[],
	x: number,
	y: number,
): void {
	const g = drawPoop();
	g.x = x;
	g.y = y;
	world.addChild(g);
	fallingPoops.push({ view: g, vy: 60, x });
}

/** Effects a falling poop applies when it lands on the player's head. */
export interface FallingPoopHooks {
	/** Apply the head-poop hit (slam, poop linger, damage, HUD, particles). */
	onPlayerHit(x: number, y: number): void;
	/** True if the head hit drained the last health (caller should bail). */
	isDead(): boolean;
}

/**
 * Advance falling poops. A poop lands on the first platform top it crosses
 * within that platform's horizontal span (so it can settle on raised
 * platforms, not just the floor). If it crosses no platform — i.e. it falls
 * through a pit gap — it drops off the bottom of the world and is discarded.
 *
 * @returns true if a head hit ended the run (caller should stop this frame).
 */
export function updateFallingPoops(
	world: Container,
	fallingPoops: FallingPoop[],
	poops: GroundPoop[],
	player: Player,
	particles: Particles,
	level: Level,
	dt: number,
	hooks: FallingPoopHooks,
): boolean {
	const pBox = player.aabb();
	for (let i = fallingPoops.length - 1; i >= 0; i--) {
		const fp = fallingPoops[i];
		const prevY = fp.view.y;
		fp.vy += 900 * dt; // gravity
		fp.view.y += fp.vy * dt;

		// A falling poop that hits the player slaps them straight down and
		// applies the poop slow, then is consumed (no ground hazard left).
		if (
			Math.abs(fp.x - player.pos.x) < 22 &&
			fp.view.y >= pBox.y &&
			fp.view.y <= pBox.y + pBox.h + 8
		) {
			hooks.onPlayerHit(fp.x, fp.view.y);
			world.removeChild(fp.view);
			fp.view.destroy({ children: true });
			fallingPoops.splice(i, 1);
			if (hooks.isDead()) {
				return true;
			}
			continue;
		}

		// Find the highest platform top this poop crossed this frame at its x.
		let landY: number | null = null;
		for (const p of level.platforms) {
			if (fp.x < p.x || fp.x > p.x + p.w) continue; // outside this platform
			if (prevY <= p.y && fp.view.y >= p.y) {
				if (landY === null || p.y < landY) landY = p.y;
			}
		}

		if (landY !== null) {
			// Settle as a ground hazard on the platform surface.
			world.removeChild(fp.view);
			fp.view.destroy({ children: true });
			fallingPoops.splice(i, 1);
			dropPoopAt(world, poops, fp.x, landY);
			particles.burst(fp.x, landY - 6, "dust", 5);
		} else if (fp.view.y > GAME_HEIGHT + 40) {
			// Fell through a gap and off the bottom: discard, no hazard.
			world.removeChild(fp.view);
			fp.view.destroy({ children: true });
			fallingPoops.splice(i, 1);
		}
	}
	return false;
}
