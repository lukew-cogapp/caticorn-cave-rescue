import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Grove-theme monster reskins. All three replace the base crawler/bat/lurker
 * shapes with mushroom-grove creatures. No `Math.random` / `Date.now` — all
 * geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Walking mushroom crawler (~32x28, bottom-centre origin, drawn upward).
 * A domed spotted cap sits high (stompable head), two stubby legs below a
 * squat fleshy stem-body. Earthy teal/beige palette with glowing spots.
 * Tinted toward `accent` on cap and body; spots and eyes stay vivid.
 */
export function drawMushroomCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const flesh = (hex: string) => tint(hex, accent, 0.3);
	const cap = (hex: string) => tint(hex, accent, 0.28);

	// --- Stubby legs (two pillar pairs, matches base crawler footprint) ---
	for (const lx of [-8, -2, 4, 10]) {
		// Leg shaft.
		g.roundRect(lx - 2, -7, 4, 7, 2).fill(flesh("#c8b890"));
		// Foot knob.
		g.circle(lx, -1, 2.5).fill(flesh("#b8a878"));
	}

	// --- Stem body (squat fleshy cylinder, sits above the legs) ---
	// Shadow/base cylinder.
	g.roundRect(-11, -20, 22, 14, 5).fill(flesh("#bfae88"));
	// Lit belly highlight.
	g.ellipse(0, -14, 8, 4).fill(flesh("#d8cc9e"));

	// --- Underside gill ring (faint lines under the cap overhang) ---
	for (let i = -4; i <= 4; i++) {
		const gx = i * 3.2;
		g.moveTo(gx, -20)
			.lineTo(gx + wobble(gx + 50, i + 5, 1), -22)
			.stroke({
				color: flesh("#a09070"),
				width: 0.8,
				cap: "round",
				alpha: 0.55,
			});
	}

	// --- Domed cap (the stompable head — sits above y=-20, tip at y≈-28) ---
	// Cap overhang edge (slightly wider than stem so the stomp silhouette is clear).
	g.ellipse(0, -21, 18, 4).fill(cap("#4a7c5c"));
	// Main dome.
	g.ellipse(0, -25, 16, 9).fill(cap("#3d6e4e"));
	// Lit highlight on the upper-left of the dome.
	g.ellipse(-4, -27, 8, 4).fill({ color: cap("#5a9670"), alpha: 0.7 });

	// --- Glowing spots on the cap (two fixed positions, deterministic) ---
	const spotGlow = tint("#b0ffcc", accent, 0.35);
	g.circle(-5, -26, 3).fill({ color: spotGlow, alpha: 0.85 });
	g.circle(5, -24, 2.2).fill({ color: spotGlow, alpha: 0.8 });
	g.circle(-1, -28, 1.5).fill({ color: spotGlow, alpha: 0.7 });
	// Spot dot centres (brighter core).
	g.circle(-5, -26, 1.6).fill({ color: 0xddfff0, alpha: 0.9 });
	g.circle(5, -24, 1.2).fill({ color: 0xddfff0, alpha: 0.9 });

	// --- Eyes under the cap rim (matching crawler eye y≈-13 placement) ---
	// White sclera.
	g.circle(-5, -13, 3.5).fill({ color: 0xffffff, alpha: 0.92 });
	g.circle(5, -13, 3.5).fill({ color: 0xffffff, alpha: 0.92 });
	// Iris — earthy teal.
	g.circle(-5, -13, 2.2).fill(tint("#2a6e54", accent, 0.3));
	g.circle(5, -13, 2.2).fill(tint("#2a6e54", accent, 0.3));
	// Pupil.
	g.circle(-5, -13, 1.1).fill(0x0d1a10);
	g.circle(5, -13, 1.1).fill(0x0d1a10);
	// Glint.
	g.circle(-4, -14, 0.8).fill({ color: 0xffffff, alpha: 0.85 });
	g.circle(6, -14, 0.8).fill({ color: 0xffffff, alpha: 0.85 });

	// --- Grumpy mouth with tiny nubby teeth ---
	g.moveTo(-5, -8).lineTo(5, -8).stroke({ color: 0x1a2e1e, width: 1.5 });
	g.poly([-4, -8, -2, -8, -3, -5]).fill(flesh("#d8cc9e"));
	g.poly([2, -8, 4, -8, 3, -5]).fill(flesh("#d8cc9e"));

	c.addChild(g);
	return c;
}

/**
 * Flitting leaf-pod bat reskin (~36 wide, bottom-centre origin, drawn upward).
 * A seed-pod body flanked by two wide leaf wings, small vein-like ridges and a
 * gentle green glow. Centred flyer; the silhouette stays readable as a bat.
 * Tinted toward `accent` on body/wings; eye detail stays vivid.
 */
export function drawLeafBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const leaf = (hex: string) => tint(hex, accent, 0.35);
	const pod = (hex: string) => tint(hex, accent, 0.28);

	// --- Left leaf wing ---
	// Main leaf shape: wide, slightly swept back.
	g.poly([-4, -16, -22, -22, -20, -10, -26, -8, -8, -8]).fill(leaf("#3d7a4a"));
	// Lit vein on the left wing.
	g.moveTo(-6, -14)
		.quadraticCurveTo(-16, -18, -22, -22)
		.stroke({ color: leaf("#5aaa66"), width: 1, cap: "round", alpha: 0.65 });
	g.moveTo(-14, -12)
		.lineTo(-22, -10)
		.stroke({ color: leaf("#4a9458"), width: 0.8, cap: "round", alpha: 0.5 });

	// --- Right leaf wing ---
	g.poly([4, -16, 22, -22, 20, -10, 26, -8, 8, -8]).fill(leaf("#4a8e56"));
	// Lit vein on the right wing.
	g.moveTo(6, -14)
		.quadraticCurveTo(16, -18, 22, -22)
		.stroke({ color: leaf("#5aaa66"), width: 1, cap: "round", alpha: 0.65 });
	g.moveTo(14, -12)
		.lineTo(22, -10)
		.stroke({ color: leaf("#4a9458"), width: 0.8, cap: "round", alpha: 0.5 });

	// --- Seed-pod body (centred, slightly plumper than a bat body) ---
	// Outer soft glow haze.
	g.ellipse(0, -13, 13, 12).fill({ color: pod("#3a6642"), alpha: 0.4 });
	// Pod body.
	g.ellipse(0, -12, 10, 9).fill(pod("#4a7a52"));
	// Lit highlight.
	g.ellipse(-2, -15, 5, 4).fill({ color: pod("#6aaa72"), alpha: 0.7 });
	// Seam ridge down the pod centre.
	g.moveTo(0, -21)
		.lineTo(0 + wobble(10, 3, 1), -4)
		.stroke({ color: pod("#385e40"), width: 1.2, cap: "round", alpha: 0.55 });

	// --- Small leafy point ears at the top ---
	g.poly([-7, -20, -4, -26, -1, -19]).fill(leaf("#3d7a4a"));
	g.poly([7, -20, 4, -26, 1, -19]).fill(leaf("#4a8e56"));

	// --- Glowing eyes — deep teal irises ---
	g.circle(-4, -13, 3).fill(tint("#b0ffd0", accent, 0.25));
	g.circle(4, -13, 3).fill(tint("#b0ffd0", accent, 0.25));
	g.circle(-4, -13, 1.4).fill(0x0d1a10);
	g.circle(4, -13, 1.4).fill(0x0d1a10);
	// Glint.
	g.circle(-3, -14, 0.8).fill({ color: 0xffffff, alpha: 0.8 });
	g.circle(5, -14, 0.8).fill({ color: 0xffffff, alpha: 0.8 });

	// --- Tiny fang-like leaf-tip points at the mouth ---
	g.poly([-3, -7, -1, -7, -2, -3]).fill(leaf("#3d7a4a"));
	g.poly([1, -7, 3, -7, 2, -3]).fill(leaf("#4a8e56"));

	c.addChild(g);
	return c;
}

/**
 * Hanging spore-pod lurker (~34 wide, grown DOWNWARD from y=0). A glowing
 * fungal cluster clings to the ceiling — a fleshy attach-blob at y=0, a bulbous
 * central spore-pod body hanging below (~y=6..28), stubby root-tendril arms, and
 * two bioluminescent eyes at y=16 (matching the base lurker) looking downward.
 * Earthy teal/amber palette with glowing spots. Tinted toward `accent`.
 */
export function drawSporePodLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const flesh = (hex: string) => tint(hex, accent, 0.3);
	const spore = (hex: string) => tint(hex, accent, 0.25);

	// --- Ceiling attach blob (matches base lurker anchor at y≈4) ---
	// Root-hair fringe clinging to ceiling.
	for (let i = -3; i <= 3; i++) {
		const rx = i * 5;
		const rlen = 3 + Math.abs(wobble(rx + 300, i + 17, 2));
		g.moveTo(rx, 0)
			.lineTo(rx + wobble(rx, i + 2, 1.5), rlen)
			.stroke({
				color: flesh("#4a3a1a"),
				width: 1.5,
				cap: "round",
				alpha: 0.7,
			});
	}
	// Attach blob itself.
	g.ellipse(0, 4, 14, 5).fill(flesh("#3a2e12"));

	// --- Main spore-pod body hanging below (matches base body rect y=6..28) ---
	// Outer glow haze — bioluminescent teal shimmer.
	g.ellipse(0, 17, 18, 14).fill({
		color: tint("#204a30", accent, 0.3),
		alpha: 0.55,
	});
	// Pod body — bulbous fungal sac.
	g.roundRect(-14, 6, 28, 22, 8).fill(flesh("#4a3c1e"));
	// Belly highlight.
	g.ellipse(0, 17, 9, 6).fill(flesh("#5e5030"));

	// --- Surface spots / pores (glowing, deterministic positions) ---
	const spotGlow = tint("#88ffcc", accent, 0.4);
	const sporePts: [number, number, number][] = [
		[-7, 10, 2.5],
		[6, 9, 2],
		[-4, 22, 3],
		[8, 20, 2],
		[1, 28, 1.8],
	];
	for (const [sx, sy, sr] of sporePts) {
		g.circle(sx, sy, sr + 1.5).fill({
			color: tint("#50d890", accent, 0.35),
			alpha: 0.35,
		});
		g.circle(sx, sy, sr).fill({ color: spotGlow, alpha: 0.8 });
		g.circle(sx, sy, sr * 0.55).fill({ color: 0xeefff8, alpha: 0.9 });
	}

	// --- Tendril arms (matches base lurker arm placement) ---
	// Left tendril.
	g.moveTo(-12, 10)
		.lineTo(-20, 4)
		.stroke({ color: flesh("#3a2e12"), width: 3.5, cap: "round" });
	// Left tip splits into two root-hair tines.
	g.moveTo(-20, 4)
		.lineTo(-24, 1)
		.stroke({ color: flesh("#4a3a1a"), width: 1.5, cap: "round" });
	g.moveTo(-20, 4)
		.lineTo(-23, 7)
		.stroke({ color: flesh("#4a3a1a"), width: 1.5, cap: "round" });
	// Right tendril.
	g.moveTo(12, 10)
		.lineTo(20, 4)
		.stroke({ color: flesh("#3a2e12"), width: 3.5, cap: "round" });
	g.moveTo(20, 4)
		.lineTo(24, 1)
		.stroke({ color: flesh("#4a3a1a"), width: 1.5, cap: "round" });
	g.moveTo(20, 4)
		.lineTo(23, 7)
		.stroke({ color: flesh("#4a3a1a"), width: 1.5, cap: "round" });

	// --- Dangling spore-cap fringe at bottom edge (y≈28..34) ---
	const fringeXs = [-10, -5, 0, 5, 10];
	for (let i = 0; i < fringeXs.length; i++) {
		const fx = fringeXs[i];
		const fh = 4 + wobble(fx + 400, i + 13, 2.5);
		// Mini cap dome.
		g.ellipse(fx, 28 + fh * 0.5, 3.5, fh * 0.6).fill(spore("#3d5e38"));
	}

	// --- Glowing eyes (at y=16, matching base lurker y=16, looking downward) ---
	const eyeGlow = tint("#7affc2", accent, 0.45);
	// Outer glow ring.
	g.circle(-5, 16, 5.5).fill({ color: eyeGlow, alpha: 0.3 });
	g.circle(6, 16, 5.5).fill({ color: eyeGlow, alpha: 0.3 });
	// Iris.
	g.circle(-5, 16, 4).fill(eyeGlow);
	g.circle(6, 16, 4).fill(eyeGlow);
	// Dark pupil slit.
	g.circle(-5, 16, 1.8).fill(0x081410);
	g.circle(6, 16, 1.8).fill(0x081410);
	// Bright highlight.
	g.circle(-4, 15, 1).fill({ color: 0xffffff, alpha: 0.8 });
	g.circle(7, 15, 1).fill({ color: 0xffffff, alpha: 0.8 });

	c.addChild(g);
	return c;
}
