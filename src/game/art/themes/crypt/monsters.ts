import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Crypt-theme monster reskins. All three replace the base crawler/bat/lurker
 * shapes entirely with crypt-appropriate creatures. No `Math.random` /
 * `Date.now` — all geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Shambling skeleton crawler (~32x28, bottom-centre origin, drawn upward).
 * Bony off-white body with rib hints, a round skull head with dark eye sockets,
 * and four stubby leg-bones. Head sits on top so it reads stompable.
 * Tinted lightly toward `accent` on the bone body; eye sockets stay dark.
 */
export function drawSkeletonCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const bone = (hex: string) => tint(hex, accent, 0.22);

	// --- Leg bones (four stubby pillars below the pelvis) ---
	for (const lx of [-10, -3, 4, 11]) {
		// Bone shaft.
		g.roundRect(lx - 1.5, -8, 3, 8, 1.5).fill(bone("#d4cbb8"));
		// Rounded knob at bottom (ankle/foot joint).
		g.circle(lx, -1, 2.2).fill(bone("#bfb49e"));
		// Rounded knob at top (knee joint).
		g.circle(lx, -9, 2).fill(bone("#cfc4ac"));
	}

	// --- Pelvis / hip girdle ---
	g.ellipse(0, -12, 13, 5).fill(bone("#d4cbb8"));

	// --- Ribcage (narrow torso, 3 rib pairs) ---
	// Spine line down the centre.
	g.moveTo(0, -12)
		.lineTo(0, -22)
		.stroke({ color: bone("#bfb49e"), width: 1.5, cap: "round" });
	// Three rib arcs, evenly spaced up the torso.
	for (let i = 0; i < 3; i++) {
		const ry = -13 - i * 3;
		const rw = 10 - i * 1.5;
		// Left rib.
		g.moveTo(0, ry)
			.quadraticCurveTo(-rw * 1.1, ry - 1.5, -rw, ry + 2)
			.stroke({ color: bone("#c8bda8"), width: 1.6, cap: "round", alpha: 0.9 });
		// Right rib.
		g.moveTo(0, ry)
			.quadraticCurveTo(rw * 1.1, ry - 1.5, rw, ry + 2)
			.stroke({ color: bone("#c8bda8"), width: 1.6, cap: "round", alpha: 0.9 });
	}

	// --- Skull head (sits above the ribcage, keeps HEAD visually on top) ---
	// Cranium.
	g.circle(0, -27, 8).fill(bone("#e0d8c4"));
	// Cheekbone / jaw ridge — flat lower edge.
	g.roundRect(-7, -24, 14, 5, 2).fill(bone("#d0c8b0"));
	// Eye sockets — dark hollow pits, untinted so they read clearly.
	g.ellipse(-3, -28, 3.5, 3).fill(0x151010);
	g.ellipse(4, -28, 3.5, 3).fill(0x151010);
	// Faint glow inside each socket (ectoplasmic green-tinted accent).
	const glowCol = tint("#5aff80", accent, 0.4);
	g.ellipse(-3, -28, 2, 1.8).fill({ color: glowCol, alpha: 0.65 });
	g.ellipse(4, -28, 2, 1.8).fill({ color: glowCol, alpha: 0.65 });
	// Upper teeth / grin — a few tiny bone nubs along the jaw.
	for (let i = -2; i <= 2; i++) {
		const tx = i * 2.5;
		const th = 2 + wobble(tx + 100, i + 7, 0.8);
		g.roundRect(tx - 1.1, -22, 2.2, th, 0.6).fill(bone("#eee8d8"));
	}

	// --- Collar-bone hint at shoulder width ---
	g.moveTo(-11, -22)
		.lineTo(11, -22)
		.stroke({ color: bone("#bfb49e"), width: 1.2, alpha: 0.6 });

	c.addChild(g);
	return c;
}

/**
 * Sheet-ghost bat reskin (~36 wide x 22 tall body, bottom-centre origin, drawn
 * upward). A translucent white sheet with a wavy hem floats around its centre
 * (like the bat). Two large dark eyes give it expression. Lower overall alpha
 * keeps it spectral without losing readability.
 */
export function drawGhostBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Overall spectral translucency.
	c.alpha = 0.82;

	const sheetCol = tint("#e8eef2", accent, 0.15);
	const sheetLit = tint("#ffffff", accent, 0.1);
	const sheetShadow = tint("#b8c8d4", accent, 0.25);

	// --- Ghost sheet body (centred around y≈-12 like the bat body) ---
	// Outer soft haze for the glow-aura.
	g.ellipse(0, -14, 20, 17).fill({ color: sheetLit, alpha: 0.18 });

	// Main sheet silhouette: a rounded top tapering into a wavy hem near y=0.
	// Built as a polygon: flat top → wide rounded shoulders → wavy bottom hem.
	// Wavy hem points — 5 scallops across the ~32px width.
	const hemY = -3;
	const hemPts: number[] = [
		-16,
		hemY - 2, // left edge
		-12,
		hemY + 4, // scallop trough
		-7,
		hemY - 1,
		-2,
		hemY + 5, // centre dip
		3,
		hemY - 1,
		8,
		hemY + 4,
		12,
		hemY - 1,
		16,
		hemY - 2, // right edge
	];

	// Full sheet poly: go up the right side, across the rounded top, down the left,
	// then follow the hem scallops.
	const sheetPoly = [
		// left side up
		-16,
		hemY - 2,
		-17,
		-18,
		// rounded top (3 control points approximated as polygon vertices)
		-12,
		-26,
		0,
		-28,
		12,
		-26,
		// right side down
		17,
		-18,
		16,
		hemY - 2,
		// hem scallops right → left
		...hemPts.slice().reverse(),
	];
	g.poly(sheetPoly).fill({ color: sheetCol, alpha: 0.82 });

	// Inner lit highlight on the upper sheet — overlapping ellipse for volume.
	g.ellipse(0, -20, 10, 7).fill({ color: sheetLit, alpha: 0.28 });

	// Shadow gradient on the lower body (darker base of sheet).
	g.ellipse(0, -8, 12, 6).fill({ color: sheetShadow, alpha: 0.32 });

	// Subtle rim stroke so the silhouette reads against dark backgrounds.
	g.poly(sheetPoly).stroke({ color: sheetLit, width: 0.8, alpha: 0.35 });

	// --- Eyes (two large dark spots, slightly below mid-sheet) ---
	// White sclera.
	g.circle(-5, -16, 4.5).fill({ color: 0xffffff, alpha: 0.9 });
	g.circle(5, -16, 4.5).fill({ color: 0xffffff, alpha: 0.9 });
	// Dark pupils — large, cartoon-simple.
	g.circle(-5, -16, 3).fill(0x0d0d1a);
	g.circle(5, -16, 3).fill(0x0d0d1a);
	// Tiny highlight glints.
	g.circle(-4, -17, 1).fill({ color: 0xffffff, alpha: 0.9 });
	g.circle(6, -17, 1).fill({ color: 0xffffff, alpha: 0.9 });

	c.addChild(g);
	return c;
}

/**
 * Hanging wraith lurker (~40 wide, grown DOWNWARD from y=0). A tattered dark
 * hooded shroud clings to the ceiling (origin at y=0), dark cloak body extends
 * downward with ragged hem, and two glowing eyes look downward at roughly y=16
 * (matching the base lurker eyes) so drop/poop and collision feel identical.
 * Tinted toward `accent` on the cloak; eyes glow independently.
 */
export function drawWraithLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const cloak = (hex: string) => tint(hex, accent, 0.3);

	// --- Ceiling attachment: small blob anchor (matches base lurker at y≈4) ---
	g.ellipse(0, 4, 13, 5).fill(cloak("#1a1220"));

	// --- Cloak body hanging below (~y=6..28, matching base roundRect(-15,6,30,22)) ---
	// Outer cloak silhouette — slightly wider than base to look billowy.
	g.roundRect(-16, 5, 32, 24, 4).fill(cloak("#211830"));
	// Hood / head bump at the top of the cloak body.
	g.ellipse(0, 7, 13, 7).fill(cloak("#2a2040"));
	// Inner dark recess (the face in the hood shadow).
	g.ellipse(0, 8, 9, 5).fill(cloak("#0d0916"));

	// --- Arms: skeletal/wispy tendrils reaching out (matching base lurker arms) ---
	// Left arm tendril.
	g.moveTo(-13, 10)
		.lineTo(-22, 4)
		.stroke({ color: cloak("#1a1220"), width: 3.5, cap: "round" });
	// Bony finger hints on the left.
	g.moveTo(-22, 4)
		.lineTo(-26, 2)
		.stroke({ color: cloak("#2a2040"), width: 1.5, cap: "round" });
	g.moveTo(-22, 4)
		.lineTo(-24, 7)
		.stroke({ color: cloak("#2a2040"), width: 1.5, cap: "round" });
	// Right arm tendril.
	g.moveTo(13, 10)
		.lineTo(22, 4)
		.stroke({ color: cloak("#1a1220"), width: 3.5, cap: "round" });
	// Bony finger hints on the right.
	g.moveTo(22, 4)
		.lineTo(26, 2)
		.stroke({ color: cloak("#2a2040"), width: 1.5, cap: "round" });
	g.moveTo(22, 4)
		.lineTo(24, 7)
		.stroke({ color: cloak("#2a2040"), width: 1.5, cap: "round" });

	// --- Ragged hem at the bottom of the cloak (y≈26..32) ---
	// Five irregular torn tatters hanging below the body edge.
	const tatterXs = [-12, -6, 0, 6, 12];
	for (let i = 0; i < tatterXs.length; i++) {
		const tx = tatterXs[i];
		// Vary tatter lengths deterministically with wobble.
		const th = 5 + wobble(tx + 200, i + 11, 3);
		g.poly([tx - 3, 28, tx + 3, 28, tx + wobble(tx, i + 3, 1.5), 28 + th]).fill(
			cloak("#17111e"),
		);
	}

	// --- Glowing eyes looking downward (at y=16, matching base lurker y=16) ---
	// Outer glow rings (sickly green to match crypt accent).
	const eyeGlow = tint("#7fff9a", accent, 0.5);
	g.circle(-5, 16, 5.5).fill({ color: eyeGlow, alpha: 0.35 });
	g.circle(6, 16, 5.5).fill({ color: eyeGlow, alpha: 0.35 });
	// Iris.
	g.circle(-5, 16, 4).fill(eyeGlow);
	g.circle(6, 16, 4).fill(eyeGlow);
	// Dark pupil slit.
	g.circle(-5, 16, 1.8).fill(0x0a0814);
	g.circle(6, 16, 1.8).fill(0x0a0814);
	// Tiny bright highlight.
	g.circle(-4, 15, 1).fill({ color: 0xffffff, alpha: 0.75 });
	g.circle(7, 15, 1).fill({ color: 0xffffff, alpha: 0.75 });

	c.addChild(g);
	return c;
}
