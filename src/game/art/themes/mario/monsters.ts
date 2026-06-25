import { Container, Graphics } from "pixi.js";
import { tint } from "../../util";

/**
 * Full reskins for the three monster kinds in the mario (Sunny Block Plains)
 * theme. All geometry is fixed; no `Math.random` / `Date.now`. Tinted lightly
 * toward `accent` where sensible to pick up the level mood.
 *
 * Coordinate conventions match the base monster shapes:
 *   crawler / bat  — bottom-centre origin, drawn upward (negative y).
 *   lurker         — ceiling-attach origin (y = 0), drawn downward (positive y).
 */

/**
 * Brown mushroom-capped walker: wide flat cap on a squat body, angry inward
 * eyebrows, beady eyes, a thin mouth, two tiny feet. Ground walker; head is
 * the wide flat cap on top, which makes it very obviously stompable.
 * Footprint roughly matches the base crawler (~32 wide × ~28 tall).
 *
 * @param accent - Optional theme accent hex to tint the cap toward.
 * @returns A Pixi Container at bottom-centre origin, body drawn upward.
 */
export function drawMarioGoomba(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Warm brown palette, lightly tinted toward accent.
	const capDark = tint("#7a3a10", accent, 0.12);
	const capMid = tint("#a05218", accent, 0.12);
	const capLight = tint("#c47040", accent, 0.1);
	const bodyCol = tint("#b86030", accent, 0.14);
	const bodyShad = tint("#7a3a10", accent, 0.14);
	const toeCol = tint("#8c4820", accent, 0.12);

	// Feet — two stubby rounded blobs just below the body, poke out sideways.
	g.ellipse(-10, -3, 8, 5).fill(toeCol);
	g.ellipse(10, -3, 8, 5).fill(toeCol);

	// Squat body: a rounded rectangle, slightly narrower than the cap.
	g.roundRect(-12, -18, 24, 16, 6).fill(bodyCol);
	// Belly shading — darker oval low on the body.
	g.ellipse(0, -10, 8, 5).fill(bodyShad);

	// Wide flat mushroom cap overhangs the body on both sides.
	// Underside shadow curve first so it sits behind the cap fill.
	g.ellipse(0, -20, 20, 5).fill(capDark);
	// Cap dome.
	g.ellipse(0, -22, 18, 10).fill(capMid);
	// Cap highlight near the crown.
	g.ellipse(-4, -26, 8, 4).fill(capLight);

	// Angry eyebrows: two thick inward-angled strokes.
	g.moveTo(-11, -17)
		.lineTo(-5, -14)
		.stroke({ color: 0x1a0800, width: 2.5, alpha: 0.9, cap: "round" });
	g.moveTo(11, -17)
		.lineTo(5, -14)
		.stroke({ color: 0x1a0800, width: 2.5, alpha: 0.9, cap: "round" });

	// Eyes: small white sclera + dark pupil.
	g.circle(-6, -12, 3.5).fill(0xfff0d0);
	g.circle(6, -12, 3.5).fill(0xfff0d0);
	g.circle(-5, -12, 1.8).fill(0x1a0800);
	g.circle(7, -12, 1.8).fill(0x1a0800);

	// Thin grumpy mouth.
	g.moveTo(-5, -7)
		.lineTo(5, -7)
		.stroke({ color: 0x1a0800, width: 1.2, alpha: 0.8, cap: "round" });

	c.addChild(g);
	return c;
}

/**
 * Winged shell flyer: a rounded green/red shell body with a yellow trim border,
 * two stubby bat-like wings fanning left/right, small white eyes, and tiny feet
 * dangling below. Drawn centred (bottom = feet at y=0). Footprint roughly
 * matches the base bat (~36 wide × ~22 tall body area).
 *
 * @param accent - Optional theme accent hex to tint the shell toward.
 * @returns A Pixi Container at bottom-centre origin, body drawn upward.
 */
export function drawMarioParatroopa(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Shell palette — classic green with a yellow-tan border ring.
	const shellGreen = tint("#3aaa40", accent, 0.15);
	const shellDark = tint("#1e7028", accent, 0.15);
	const shellLight = tint("#70d060", accent, 0.1);
	const borderCol = tint("#e8c840", accent, 0.15);
	const wingCol = tint("#e8a030", accent, 0.15);
	const wingDark = tint("#b06a18", accent, 0.15);

	// Tiny dangling feet.
	g.ellipse(-5, -2, 5, 3).fill(tint("#f0d080", accent, 0.15));
	g.ellipse(5, -2, 5, 3).fill(tint("#f0d080", accent, 0.15));

	// Wings — two angled rounded blobs fanning outward. Drawn behind the shell.
	// Left wing.
	g.poly([-8, -14, -22, -22, -26, -12, -18, -8, -8, -8]).fill(wingCol);
	g.poly([-8, -14, -22, -22, -26, -12, -18, -8, -8, -8]).stroke({
		color: wingDark,
		width: 1,
		alpha: 0.5,
	});
	// Wing highlight near the top edge.
	g.moveTo(-10, -14)
		.lineTo(-20, -21)
		.stroke({ color: 0xfff0c0, width: 1.2, alpha: 0.5, cap: "round" });

	// Right wing (mirrored).
	g.poly([8, -14, 22, -22, 26, -12, 18, -8, 8, -8]).fill(wingCol);
	g.poly([8, -14, 22, -22, 26, -12, 18, -8, 8, -8]).stroke({
		color: wingDark,
		width: 1,
		alpha: 0.5,
	});
	g.moveTo(10, -14)
		.lineTo(20, -21)
		.stroke({ color: 0xfff0c0, width: 1.2, alpha: 0.5, cap: "round" });

	// Shell body outer border ring (slightly larger than the dome).
	g.ellipse(0, -14, 14, 13).fill(borderCol);
	// Shell dome fill.
	g.ellipse(0, -14, 12, 11).fill(shellGreen);
	// Shell segment cross lines (classic turtle-shell look).
	g.moveTo(-10, -14)
		.lineTo(10, -14)
		.stroke({ color: shellDark, width: 1, alpha: 0.55 });
	g.moveTo(0, -24)
		.lineTo(0, -5)
		.stroke({ color: shellDark, width: 1, alpha: 0.55 });
	// Highlight on the dome.
	g.ellipse(-3, -19, 5, 3).fill(shellLight);
	g.ellipse(-3, -19, 5, 3).fill({ color: 0xffffff, alpha: 0.18 });

	// White eyes peeking out at the front.
	g.circle(-5, -18, 3).fill(0xfffef0);
	g.circle(5, -18, 3).fill(0xfffef0);
	g.circle(-4, -18, 1.5).fill(0x1a1a00);
	g.circle(6, -18, 1.5).fill(0x1a1a00);

	c.addChild(g);
	return c;
}

/**
 * Ceiling piranha plant: a green tube stem attached at y=0, with a large
 * spotted red/white biting head growing downward. Drawn DOWNWARD from y=0 so
 * the caller places the container flush to the ceiling (same convention as the
 * base lurker). The biting head is the lowest part, growing away from the
 * ceiling. Footprint roughly matches the base lurker (~30 wide × ~34 tall
 * from ceiling).
 *
 * @param accent - Optional theme accent hex to tint the plant toward.
 * @returns A Pixi Container at ceiling-attach origin, drawn downward.
 */
export function drawMarioPiranhaPlant(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Green palette, lightly tinted toward accent.
	const stemGreen = tint("#2a9030", accent, 0.12);
	const stemLight = tint("#58c050", accent, 0.1);
	const headRed = tint("#c82020", accent, 0.12);
	const headDark = tint("#881010", accent, 0.12);
	const headLight = tint("#e04848", accent, 0.1);
	const lipWhite = tint("#f0f0e0", accent, 0.08);

	// Narrow green tube stem — attaches at the ceiling (y=0) and grows down.
	// The tube is 10px wide, 16px tall.
	g.roundRect(-5, 0, 10, 16, 3).fill(stemGreen);
	// Lit left edge on the stem.
	g.roundRect(-5, 0, 3, 16, 2).fill(stemLight);
	// Dark right shadow.
	g.roundRect(3, 0, 2, 16, 1).fill({ color: 0x0a2010, alpha: 0.35 });

	// Small collar/rim where the head meets the stem.
	g.roundRect(-8, 14, 16, 5, 2).fill(stemLight);
	g.roundRect(-8, 14, 16, 2, 2).fill({ color: 0xffffff, alpha: 0.3 });

	// Big round biting head. The head is ~28 wide × 20 tall, centred at x=0,
	// top at y=17, bottom at y=37.
	// Shadow behind the whole head.
	g.ellipse(1, 28, 15, 11).fill(headDark);
	// Main head dome.
	g.ellipse(0, 27, 14, 10).fill(headRed);
	// Highlight — lighter oval on upper-left of head.
	g.ellipse(-4, 23, 6, 4).fill(headLight);

	// White spots on the head (classic piranha plant markings).
	g.circle(-7, 25, 2.5).fill({ color: 0xffffff, alpha: 0.75 });
	g.circle(6, 22, 2).fill({ color: 0xffffff, alpha: 0.7 });
	g.circle(5, 31, 1.8).fill({ color: 0xffffff, alpha: 0.65 });

	// Open biting mouth at the bottom of the head.
	// Upper lip — white border at the top of the opening.
	g.ellipse(0, 33, 12, 4).fill(lipWhite);
	// Mouth cavity (dark opening).
	g.ellipse(0, 34, 10, 3).fill(0x1a0808);
	// Lower lip — white border below the opening.
	g.ellipse(0, 36, 12, 3).fill(lipWhite);

	// Two fangs pointing down from the upper jaw.
	g.poly([-5, 33, -3, 33, -4, 37]).fill(lipWhite);
	g.poly([3, 33, 5, 33, 4, 37]).fill(lipWhite);

	// Eyes — white sclera + dark pupil, above the mouth on the head face.
	g.circle(-5, 22, 3.5).fill(0xfffef0);
	g.circle(5, 22, 3.5).fill(0xfffef0);
	g.circle(-4, 22, 1.8).fill(0x1a0808);
	g.circle(6, 22, 1.8).fill(0x1a0808);

	c.addChild(g);
	return c;
}
