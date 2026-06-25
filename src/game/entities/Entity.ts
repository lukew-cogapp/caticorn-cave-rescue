import type { Container } from "pixi.js";
import type { GameObject, Rect, Vec2, WorldContext } from "../types";

/**
 * Abstract base for everything that lives in the game world.
 *
 * Subclasses build their own Pixi display object (via the `art` helpers),
 * pass it to super(), and implement update() + the collision half-extents.
 * Position is bottom-centre, matching how levels specify spawn points.
 */
export abstract class Entity implements GameObject {
	readonly view: Container;
	pos: Vec2;
	/** Velocity in px/sec. Subclasses that don't move can leave it at zero. */
	vel: Vec2 = { x: 0, y: 0 };

	/** Collision box half-width and full height above the bottom-centre origin. */
	protected abstract readonly halfWidth: number;
	protected abstract readonly height: number;

	constructor(view: Container, pos: Vec2) {
		this.view = view;
		this.pos = { ...pos };
		this.syncView();
	}

	/** Advance simulation. Default applies no motion; override as needed. */
	abstract update(ctx: WorldContext): void;

	/** Collision box in world coords, derived from bottom-centre pos. */
	aabb(): Rect {
		return {
			x: this.pos.x - this.halfWidth,
			y: this.pos.y - this.height,
			w: this.halfWidth * 2,
			h: this.height,
		};
	}

	/** Copy logical position into the display object. Call at end of update(). */
	protected syncView(): void {
		this.view.x = this.pos.x;
		this.view.y = this.pos.y;
	}

	/** Remove from the scene graph and free GPU resources. */
	destroy(): void {
		this.view.destroy({ children: true });
	}
}
