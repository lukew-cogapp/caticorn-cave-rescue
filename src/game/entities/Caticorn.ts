import type { Container } from "pixi.js";
import { drawCaticorn } from "../art";
import type { CaticornSpec, WorldContext } from "../types";
import { Entity } from "./Entity";

/** Idle bob amplitude in pixels. */
const BOB_AMPLITUDE = 4;
/** Bob angular speed in radians/sec. */
const BOB_SPEED = 2.5;
/** Upward drift speed once rescued, in px/sec (cheerful escape). */
const RESCUE_FLOAT_SPEED = 70;

/**
 * A captured caticorn waiting to be rescued. Idle-bobs in place while captive;
 * once rescued it dims, nudges upward, and gently floats up while still bobbing.
 *
 * Position is bottom-centre. The bob is a sine offset around a tracked baseline
 * so the underlying position stays stable for collision tests.
 */
export class Caticorn extends Entity {
	protected readonly halfWidth = 16;
	protected readonly height = 34;

	/** True once collected by the player. */
	rescued = false;

	/** Baseline y the idle bob oscillates around. */
	private baseY: number;
	/** Accumulated phase, advanced by dt each frame. */
	private phase = 0;

	constructor(view: Container, spec: CaticornSpec) {
		super(view, { x: spec.x, y: spec.y });
		this.baseY = spec.y;
	}

	/** Build a Caticorn with its own art so callers don't import art helpers. */
	static create(spec: CaticornSpec): Caticorn {
		return new Caticorn(drawCaticorn(), spec);
	}

	update(ctx: WorldContext): void {
		this.phase += ctx.dt * BOB_SPEED;
		if (this.rescued) {
			// Gently drift the baseline upward while continuing to bob.
			this.baseY -= RESCUE_FLOAT_SPEED * ctx.dt;
		}
		this.pos.y = this.baseY + Math.sin(this.phase) * BOB_AMPLITUDE;
		this.syncView();
	}

	/**
	 * Mark as rescued: swap the sad trapped face for a happy one and start
	 * floating up quickly. Idempotent.
	 */
	rescue(): void {
		if (this.rescued) {
			return;
		}
		this.rescued = true;
		// Swap to the cheerful rescued sprite by replacing the view's contents.
		for (const child of this.view.removeChildren()) {
			child.destroy();
		}
		const happy = drawCaticorn(true);
		this.view.addChild(...happy.removeChildren());
		this.pos.y -= 12;
		this.baseY -= 12;
	}
}
