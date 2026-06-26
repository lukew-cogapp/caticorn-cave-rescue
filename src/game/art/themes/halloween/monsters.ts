import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Halloween-theme monster reskins. All three replace the base crawler/bat/lurker
 * shapes with festive, kid-friendly Halloween creatures. No `Math.random` /
 * `Date.now` — all geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Jack-o'-lantern crawler (~32x28, bottom-centre origin, drawn upward).
 * A round orange pumpkin body with a carved glowing face and a small stem.
 * Four stubby legs beneath keep the stompable ground-walker silhouette intact.
 * Tinted lightly toward `accent` on the body; carved face cuts stay dark.
 */
export function drawJackOLanternCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const pumpkin = (hex: string) => tint(hex, accent, 0.18);

	// --- Legs (four stubby pairs below the body) ---
	for (const lx of [-10, -3, 4, 11]) {
		g.roundRect(lx - 1.5, -6, 3, 7, 1.5).fill(pumpkin("#c04c08"));
	}

	// --- Pumpkin body ---
	// Glow bloom underneath (warm candle-light radiating out).
	g.ellipse(0, -14, 24, 16).fill({ color: 0xff8800, alpha: 0.18 });

	// Main orange oval body.
	g.ellipse(0, -16, 16, 14).fill(pumpkin("#e8620a"));

	// Pumpkin ribbing — two faint vertical seam shadows.
	g.ellipse(-6, -16, 4, 12).fill({ color: 0x000000, alpha: 0.1 });
	g.ellipse(6, -16, 4, 12).fill({ color: 0x000000, alpha: 0.1 });

	// Lit edge highlight on the upper-left of the body.
	g.ellipse(-5, -22, 6, 4).fill({ color: 0xffa040, alpha: 0.38 });

	// --- Stem (dark green nub on top) ---
	g.roundRect(-2.5, -31, 5, 7, 2).fill(pumpkin("#2e5a18"));
	// Tiny leaf curl off the stem.
	g.ellipse(-5, -29, 3, 1.8).fill({ color: 0x3a7020, alpha: 0.7 });

	// --- Carved face (dark cutouts, lit from within) ---
	// Inner candle glow — warm yellow fills the face cavity.
	g.ellipse(0, -15, 11, 9).fill({ color: 0xffc040, alpha: 0.28 });

	// Triangle eyes (pointing down).
	const eyeW = 4.5;
	const eyeH = 4;
	// Left eye.
	g.poly([-7, -20, -7 + eyeW, -20, -7 + eyeW * 0.5, -20 + eyeH]).fill({
		color: 0x0e0610,
		alpha: 0.9,
	});
	// Right eye.
	g.poly([2, -20, 2 + eyeW, -20, 2 + eyeW * 0.5, -20 + eyeH]).fill({
		color: 0x0e0610,
		alpha: 0.9,
	});

	// Glowing inner pupils (warm orange-yellow, peeks behind the dark cut).
	g.poly([
		-6.2,
		-19,
		-6.2 + eyeW * 0.7,
		-19,
		-6.2 + eyeW * 0.35,
		-19 + eyeH * 0.7,
	]).fill({ color: 0xffb020, alpha: 0.55 });
	g.poly([
		2.8,
		-19,
		2.8 + eyeW * 0.7,
		-19,
		2.8 + eyeW * 0.35,
		-19 + eyeH * 0.7,
	]).fill({ color: 0xffb020, alpha: 0.55 });

	// Jagged mouth — three alternating up/down tooth points.
	const mouthY = -11;
	const mw = 12;
	const tw = mw / 3;
	for (let t = 0; t < 3; t++) {
		const tx = -mw * 0.5 + t * tw;
		const up = t % 2 === 0;
		g.poly([
			tx,
			mouthY,
			tx + tw,
			mouthY,
			tx + tw * 0.5,
			mouthY + (up ? -3.5 : 3.5),
		]).fill({ color: 0x0e0610, alpha: 0.9 });
	}
	// Inner mouth glow.
	g.ellipse(0, -10, 5, 2).fill({ color: 0xffa820, alpha: 0.3 });

	c.addChild(g);
	return c;
}

/**
 * Floaty ghost bat reskin (~36 wide x 22 tall, bottom-centre origin, drawn
 * upward). A white wavy sheet drifts centre-screen like the bat flies, with
 * two big dark eyes. Slightly translucent for spectral feel without losing
 * readability. Accent tints the sheet very lightly so it warms toward orange.
 */
export function drawGhostBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Soft spectral translucency — keeps it clearly readable.
	c.alpha = 0.88;

	const sheet = (hex: string) => tint(hex, accent, 0.12);

	// Outer glow haze.
	g.ellipse(0, -14, 22, 19).fill({ color: sheet("#fff8ee"), alpha: 0.14 });

	// Wavy hem polygon: rounded top, two wavy scallops at the bottom hem.
	// Bottom hem near y=0 (bottom-centre origin), rounded cap at ~y=-27.
	const hemY = -4;
	const sheetPoly = [
		// Left side going up.
		-16,
		hemY - 1,
		-17,
		-16,
		// Rounded top.
		-12,
		-26,
		0,
		-28,
		12,
		-26,
		// Right side coming down.
		17,
		-16,
		16,
		hemY - 1,
		// Wavy hem scallops, right to left.
		12,
		hemY + 3,
		8,
		hemY - 1,
		3,
		hemY + 4,
		-2,
		hemY - 1,
		-7,
		hemY + 4,
		-12,
		hemY - 1,
		-16,
		hemY - 1,
	];

	// Main sheet body.
	g.poly(sheetPoly).fill({ color: sheet("#f0f4f8"), alpha: 0.84 });

	// Inner lit highlight at the upper sheet for volume.
	g.ellipse(0, -20, 10, 7).fill({ color: sheet("#ffffff"), alpha: 0.32 });

	// Subtle shadow at the lower body (darkens toward the hem).
	g.ellipse(0, -8, 12, 6).fill({ color: sheet("#c8d8e4"), alpha: 0.28 });

	// Soft rim stroke so the silhouette pops against dark backgrounds.
	g.poly(sheetPoly).stroke({
		color: sheet("#ffffff"),
		width: 0.8,
		alpha: 0.3,
	});

	// --- Eyes (two large dark cartoon spots) ---
	// Sclera.
	g.circle(-5, -16, 5).fill({ color: 0xffffff, alpha: 0.95 });
	g.circle(5, -16, 5).fill({ color: 0xffffff, alpha: 0.95 });
	// Dark iris.
	g.circle(-5, -16, 3.2).fill(0x0d0d1a);
	g.circle(5, -16, 3.2).fill(0x0d0d1a);
	// Highlight glint.
	g.circle(-4, -17, 1.1).fill({ color: 0xffffff, alpha: 0.9 });
	g.circle(6, -17, 1.1).fill({ color: 0xffffff, alpha: 0.9 });

	c.addChild(g);
	return c;
}

/**
 * Hanging spider lurker (~36 wide, grown DOWNWARD from y=0). A round plump
 * spider body hangs from the ceiling on a silk thread, with eight spindly legs
 * radiating outward. Body has two simple eyes looking downward at y≈16 to match
 * the base lurker eye position. Tinted toward `accent` (orange-purple palette).
 */
export function drawSpiderLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const spider = (hex: string) => tint(hex, accent, 0.25);

	// --- Silk thread from ceiling (y=0) down to the abdomen top (~y=8) ---
	g.moveTo(0, 0)
		.lineTo(0, 8)
		.stroke({ color: spider("#d0c8c0"), width: 1.2, alpha: 0.7 });

	// Small ceiling anchor blob.
	g.ellipse(0, 2, 4, 2.5).fill(spider("#b0a898"));

	// --- Abdomen (lower body, rounder + larger, hangs below) ---
	// Abdomen: large round belly (~y=18..32).
	g.circle(0, 22, 12).fill(spider("#2a1840"));
	// Abdomen highlight — top-left sheen.
	g.ellipse(-4, 17, 5, 3.5).fill({ color: spider("#6a4880"), alpha: 0.5 });
	// Hourglass marking on the abdomen (small orange warning spot, kid-friendly).
	const spotCol = tint("#ff7a18", accent, 0.2);
	g.ellipse(0, 22, 4, 3).fill({ color: spotCol, alpha: 0.8 });
	g.ellipse(0, 22, 2, 5).fill({ color: spotCol, alpha: 0.6 });

	// --- Cephalothorax (head/thorax, smaller upper part, ~y=8..18) ---
	g.circle(0, 13, 8).fill(spider("#361e50"));
	// Faint head sheen.
	g.ellipse(-2, 10, 4, 2.5).fill({ color: spider("#7050a0"), alpha: 0.4 });

	// --- Eight legs radiating from the thorax ---
	// Four legs each side, fanning out from the thorax junction (~y=13).
	// Angles chosen to give the classic spider spread without exceeding the
	// base lurker footprint (~±20 x from centre).
	// Each leg: two-segment (upper + lower) with a slight deterministic bend.
	const legData: Array<[number, number, number, number]> = [
		// [startX, endX, tipY, side bend]
		[-7, -20, 6, -2],
		[-7, -22, 12, 1],
		[-7, -20, 18, 2],
		[-6, -15, 22, 1],
		[7, 20, 6, 2],
		[7, 22, 12, -1],
		[7, 20, 18, -2],
		[6, 15, 22, -1],
	];
	for (let i = 0; i < legData.length; i++) {
		const [sx, ex2, ey, bend] = legData[i];
		const midX = (sx + ex2) / 2 + wobble(ex2, i + 3, 2);
		const midY = (13 + ey) / 2 + bend;
		// Upper segment.
		g.moveTo(sx, 13)
			.lineTo(midX, midY)
			.stroke({ color: spider("#1e1030"), width: 1.8, cap: "round" });
		// Lower segment.
		g.moveTo(midX, midY)
			.lineTo(ex2, ey)
			.stroke({ color: spider("#2a183c"), width: 1.4, cap: "round" });
		// Tiny foot claw nub.
		g.circle(ex2, ey, 1.2).fill(spider("#3a2855"));
	}

	// --- Eyes (two glowing dots at y≈16, matching base lurker eye position) ---
	// Outer glow ring — warm orange to fit the Halloween palette.
	const eyeGlow = tint("#ff8820", accent, 0.4);
	g.circle(-4, 16, 4.5).fill({ color: eyeGlow, alpha: 0.3 });
	g.circle(5, 16, 4.5).fill({ color: eyeGlow, alpha: 0.3 });
	// Iris.
	g.circle(-4, 16, 3.2).fill(eyeGlow);
	g.circle(5, 16, 3.2).fill(eyeGlow);
	// Dark pupil.
	g.circle(-4, 16, 1.5).fill(0x0a0814);
	g.circle(5, 16, 1.5).fill(0x0a0814);
	// Highlight glint.
	g.circle(-3, 15, 0.9).fill({ color: 0xffffff, alpha: 0.7 });
	g.circle(6, 15, 0.9).fill({ color: 0xffffff, alpha: 0.7 });

	// --- Web strand hint dangling below the abdomen (decorative) ---
	g.moveTo(0, 34)
		.lineTo(0, 38)
		.stroke({ color: spider("#d0c8c0"), width: 0.8, alpha: 0.45 });

	c.addChild(g);
	return c;
}
