import { Container } from "pixi.js";
import {
	CATICORN_PALETTE_COUNT,
	drawCage,
	drawCaticorn,
	drawShackle,
} from "../art";
import {
	BINDING_FADE,
	CATICORN_BOB_AMPLITUDE,
	CATICORN_BOB_SPEED,
	CATICORN_SCALE,
	RESCUE_FLOAT_SPEED,
} from "../const";
import type { CaticornSpec, WorldContext } from "../types";
import { Entity } from "./Entity";

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
	// Caged captives have a taller collision box so the player can land on (and
	// stomp) the cage roof; shackled ones use the caticorn's own height.
	protected readonly height: number;

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

	/**
	 * Palette index into the rescuable-caticorn pool. Derived deterministically
	 * from the spawn x so captives in a level vary in colour, and reused for the
	 * happy redraw so a caticorn keeps its colour when freed.
	 */
	private readonly paletteIndex: number;

	constructor(spec: CaticornSpec, accent?: string) {
		super(new Container(), { x: spec.x, y: spec.y });
		this.containment = spec.containment;
		// Caged captives get a taller box (covers the cage) so a stomp on the
		// cage roof registers; shackled ones keep the small caticorn box.
		this.height = spec.containment === "cage" ? 52 : 30;
		this.baseY = spec.y;

		// Deterministic per-captive colour from the spawn position (no Math.random).
		// Hash the x first — raw `x % N` clusters because spawn x's are spaced by a
		// fixed span, so they share a residue and every captive came out the same
		// colour. A multiply-mix scatters adjacent positions across the palette.
		const h = Math.floor(spec.x) * 2654435761;
		this.paletteIndex = (h >>> 3) % CATICORN_PALETTE_COUNT;

		this.cat = drawCaticorn(false, this.paletteIndex);
		this.cat.scale.set(CATICORN_SCALE);
		this.view.addChild(this.cat);

		// Cage/shackle iron tints toward the cave accent so the binding matches.
		this.binding =
			spec.containment === "cage" ? drawCage(accent) : drawShackle(accent);
		this.view.addChild(this.binding);
	}

	/** Build a Caticorn from a spec, tinting its binding toward the cave accent. */
	static create(spec: CaticornSpec, accent?: string): Caticorn {
		return new Caticorn(spec, accent);
	}

	update(ctx: WorldContext): void {
		this.phase += ctx.dt * CATICORN_BOB_SPEED;
		if (this.rescued) {
			// Gently drift the baseline upward while continuing to bob.
			this.baseY -= RESCUE_FLOAT_SPEED * ctx.dt;
		}
		this.pos.y = this.baseY + Math.sin(this.phase) * CATICORN_BOB_AMPLITUDE;

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
		const happy = drawCaticorn(true, this.paletteIndex);
		this.cat.addChild(...happy.removeChildren());
		// Break the binding: it fades out over the next moments.
		if (this.binding) {
			this.bindingFade = BINDING_FADE;
		}
		this.pos.y -= 12;
		this.baseY -= 12;
	}
}
