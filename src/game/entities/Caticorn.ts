import { Container } from "pixi.js";
import { drawCage, drawCaticorn, drawShackle } from "../art";
import type { CaticornSpec, WorldContext } from "../types";
import { Entity } from "./Entity";

/** Idle bob amplitude in pixels. */
const BOB_AMPLITUDE = 4;
/** Bob angular speed in radians/sec. */
const BOB_SPEED = 2.5;
/** Upward drift speed once rescued, in px/sec (cheerful escape). */
const RESCUE_FLOAT_SPEED = 70;
/** Captive caticorns are drawn a bit smaller than the hero. */
const CATICORN_SCALE = 0.8;
/** Seconds a broken binding (cage/shackle) takes to fade out. */
const BINDING_FADE = 0.5;

/** How a caticorn is held. */
export type Containment = "shackle" | "cage";

/**
 * A captured caticorn waiting to be rescued. Idle-bobs in place while captive.
 * "shackle" captives free on contact; "cage" captives must be stomped. On rescue
 * the caticorn swaps to a happy face and floats up while the binding (cage or
 * shackle) breaks and fades away.
 *
 * Position is bottom-centre. The bob is a sine offset around a tracked baseline
 * so the underlying position stays stable for collision tests.
 */
export class Caticorn extends Entity {
	protected readonly halfWidth = 14;
	protected readonly height = 30;

	/** True once collected by the player. */
	rescued = false;
	/** How this caticorn is held. */
	readonly containment: Containment;

	/** Inner caticorn sprite (scaled small), separate from the binding. */
	private readonly cat: Container;
	/** The cage/shackle overlay; fades out when broken. */
	private binding: Container | null;
	/** Remaining fade time for a broken binding, or 0. */
	private bindingFade = 0;

	/** Baseline y the idle bob oscillates around. */
	private baseY: number;
	/** Accumulated phase, advanced by dt each frame. */
	private phase = 0;

	constructor(spec: CaticornSpec) {
		super(new Container(), { x: spec.x, y: spec.y });
		this.containment = spec.containment;
		this.baseY = spec.y;

		this.cat = drawCaticorn();
		this.cat.scale.set(CATICORN_SCALE);
		this.view.addChild(this.cat);

		this.binding = spec.containment === "cage" ? drawCage() : drawShackle();
		this.view.addChild(this.binding);
	}

	/** Build a Caticorn from a spec. */
	static create(spec: CaticornSpec): Caticorn {
		return new Caticorn(spec);
	}

	update(ctx: WorldContext): void {
		this.phase += ctx.dt * BOB_SPEED;
		if (this.rescued) {
			// Gently drift the baseline upward while continuing to bob.
			this.baseY -= RESCUE_FLOAT_SPEED * ctx.dt;
		}
		this.pos.y = this.baseY + Math.sin(this.phase) * BOB_AMPLITUDE;

		// Fade out a broken binding, then drop it.
		if (this.binding && this.bindingFade > 0) {
			this.bindingFade -= ctx.dt;
			this.binding.alpha = Math.max(0, this.bindingFade / BINDING_FADE);
			if (this.bindingFade <= 0) {
				this.view.removeChild(this.binding);
				this.binding.destroy({ children: true });
				this.binding = null;
			}
		}
		this.syncView();
	}

	/**
	 * Mark as rescued: swap to a happy face, break the binding (it fades), and
	 * start floating up quickly. Idempotent.
	 */
	rescue(): void {
		if (this.rescued) {
			return;
		}
		this.rescued = true;
		// Swap the small captive sprite for the cheerful rescued one.
		for (const child of this.cat.removeChildren()) {
			child.destroy();
		}
		const happy = drawCaticorn(true);
		this.cat.addChild(...happy.removeChildren());
		// Break the binding: it fades out over the next moments.
		if (this.binding) {
			this.bindingFade = BINDING_FADE;
		}
		this.pos.y -= 12;
		this.baseY -= 12;
	}
}
