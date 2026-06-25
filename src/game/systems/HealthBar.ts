import { Container, Graphics } from "pixi.js";

/** Width/height of the floating bar in world px. */
const W = 30;
const H = 5;

/**
 * A small health bar that floats above the player's head. Colour ramps
 * green → yellow → orange → red as health drops. The fill is only redrawn when
 * the value changes; positioning happens every frame (cheap).
 */
export class HealthBar {
	readonly view = new Container();
	private readonly bg = new Graphics();
	private readonly fill = new Graphics();
	private last = -1;

	constructor() {
		this.view.addChild(this.bg, this.fill);
		this.view.eventMode = "none";
		// Static backdrop (drawn once): dark rounded capsule centred on origin.
		this.bg
			.roundRect(-W / 2 - 1, -H / 2 - 1, W + 2, H + 2, 3)
			.fill({ color: 0x1a1124, alpha: 0.7 });
	}

	/** Colour for a 0..1 health fraction: green → yellow → orange → red. */
	private static colour(frac: number): number {
		if (frac > 0.6) return 0x4ade80; // green
		if (frac > 0.4) return 0xfacc15; // yellow
		if (frac > 0.2) return 0xfb923c; // orange
		return 0xef4444; // red
	}

	/** Place the bar above a world point (the player's head) and refresh fill. */
	update(x: number, y: number, health: number): void {
		this.view.x = x;
		this.view.y = y;
		const frac = Math.max(0, Math.min(1, health));
		if (frac !== this.last) {
			this.last = frac;
			this.fill.clear();
			if (frac > 0) {
				this.fill
					.roundRect(-W / 2, -H / 2, W * frac, H, 2)
					.fill(HealthBar.colour(frac));
			}
		}
	}
}
