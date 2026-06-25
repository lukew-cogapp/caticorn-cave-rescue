import { Container, Graphics } from "pixi.js";

/**
 * Build a tiny glowing firefly drawn around its own centre (origin 0,0), ~6px
 * across: a soft warm halo with a bright yellow-green core. A Fireflies system
 * spawns and drifts these in the background; this just draws the dot.
 *
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawFirefly(): Container {
	const c = new Container();
	const g = new Graphics();
	// Soft outer halo (warm yellow-green).
	g.circle(0, 0, 3).fill({ color: 0xc6ff5e, alpha: 0.22 });
	// Inner glow.
	g.circle(0, 0, 1.8).fill({ color: 0xeaff8a, alpha: 0.55 });
	// Bright core.
	g.circle(0, 0, 0.9).fill({ color: 0xffffe0, alpha: 0.95 });
	c.addChild(g);
	return c;
}

/**
 * Build a tiny effect particle drawn around its OWN centre (origin 0,0), only a
 * few pixels across. The Game loop owns its lifetime: scaling, fading and moving
 * it. This just draws a compact, centred sprite.
 *
 * - `"spark"`: a bright gold/white 4-point plus-glint.
 * - `"note"`: a small warm-gold musical note (notehead + stem).
 * - `"puff"`: a soft pale-grey smoke puff of overlapping circles.
 * - `"dust"`: a small brown/tan speck cluster.
 *
 * @param kind - Which particle to draw.
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawParticle(
	kind: "spark" | "note" | "puff" | "dust",
): Container {
	const c = new Container();
	const g = new Graphics();

	if (kind === "spark") {
		// Soft gold halo, then a bright white 4-point plus glint.
		g.circle(0, 0, 4).fill({ color: 0xffe14d, alpha: 0.35 });
		g.poly([0, -5, 1, -1, 0, 0, -1, -1]).fill("#fff6c4");
		g.poly([0, 5, 1, 1, 0, 0, -1, 1]).fill("#fff6c4");
		g.poly([-5, 0, -1, 1, 0, 0, -1, -1]).fill("#fff6c4");
		g.poly([5, 0, 1, 1, 0, 0, 1, -1]).fill("#fff6c4");
		g.circle(0, 0, 1.2).fill("#ffffff");
	} else if (kind === "note") {
		// Stem rising from the notehead, with a small flag.
		g.rect(2, -8, 1.4, 8).fill("#e8b84b");
		g.moveTo(3.4, -8)
			.quadraticCurveTo(6, -7, 5, -4)
			.stroke({ color: "#e8b84b", width: 1.4, cap: "round" });
		// Filled, slightly tilted notehead.
		g.ellipse(0, 1, 3, 2.3).fill("#ffd884");
	} else if (kind === "puff") {
		// A couple of overlapping pale-grey circles for soft smoke.
		g.circle(-1.5, 0, 3.5).fill({ color: 0xd6d6de, alpha: 0.7 });
		g.circle(2, -1, 3).fill({ color: 0xe4e4ea, alpha: 0.7 });
		g.circle(0.5, 1.5, 2.5).fill({ color: 0xc8c8d2, alpha: 0.7 });
	} else {
		// Small brown/tan speck cluster.
		g.circle(0, 0, 1.6).fill("#8a6a40");
		g.circle(-2.5, 1, 1.1).fill("#6b4f2e");
		g.circle(2.5, -1, 1).fill("#a8835a");
		g.circle(1, 2.5, 0.9).fill("#6b4f2e");
	}

	c.addChild(g);
	return c;
}
