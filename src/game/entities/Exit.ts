import { drawExit } from "../art";
import type { Vec2, WorldContext } from "../types";
import { Entity } from "./Entity";

/** Glow pulse angular speed in radians/sec. */
const PULSE_SPEED = 3;
/** Scale pulse amplitude (fraction added/subtracted from 1). */
const PULSE_AMPLITUDE = 0.04;

/**
 * The level exit. Stays dimmed until all caticorns are rescued, then brightens
 * and gently pulses to draw the player toward it. Purely visual state; the Game
 * loop decides when the player has reached and triggered it.
 */
export class Exit extends Entity {
	protected readonly halfWidth = 22;
	protected readonly height = 56;

	/** True once all caticorns are rescued and the exit is usable. */
	unlocked = false;

	/** Accumulated phase for the glow pulse, advanced by dt each frame. */
	private phase = 0;

	/** Build an Exit with its own art so callers don't import art helpers. */
	static create(pos: Vec2): Exit {
		return new Exit(drawExit(), pos);
	}

	update(ctx: WorldContext): void {
		this.view.alpha = this.unlocked ? 1 : 0.4;
		if (this.unlocked) {
			this.phase += ctx.dt * PULSE_SPEED;
			const s = 1 + Math.sin(this.phase) * PULSE_AMPLITUDE;
			this.view.scale.set(s);
		} else {
			this.view.scale.set(1);
		}
		this.syncView();
	}

	/** Set the unlocked state (call when rescue count reaches the level total). */
	setUnlocked(v: boolean): void {
		this.unlocked = v;
	}
}
