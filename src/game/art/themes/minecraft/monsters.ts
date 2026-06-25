import { Container, Graphics } from "pixi.js";
import { tint } from "../../util";

// ---------------------------------------------------------------------------
// Cube Mines monster reskins — all-blocky/cubic pixel-art creatures.
//
// Coordinate conventions (must match props.ts drawMonster):
//   crawler / bat  → bottom-centre origin, body drawn UPWARD (negative y).
//   lurker         → ceiling-attach origin, body drawn DOWNWARD (positive y).
//
// No Math.random / Date.now anywhere in this file — fully deterministic.
// ---------------------------------------------------------------------------

/**
 * CREEPER reskin for the crawler slot.
 *
 * A classic Minecraft Creeper built from stacked rectangular blocks.
 * Footprint stays within the base crawler (~32 wide × ~28 tall).
 * Bottom-centre origin; head is at the top so stomping reads clearly.
 *
 * Structure (bottom → top):
 *   feet:  two 6×5 blocks at y=0..−5
 *   legs:  two 6×8 blocks at y=−5..−13
 *   body:  12×10 block at y=−13..−23
 *   head:  14×12 block at y=−23..−35  ← stompable top
 *   face:  two 4×4 black eye squares + downward-T block mouth on the head
 *
 * @param accent - Optional theme accent `#rrggbb` to lightly tint shading.
 * @returns A {@link Container} with the full Creeper silhouette.
 */
export function drawCreeperSkin(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Base creeper green palette — keep these recognisable, tint shading only.
	const green = 0x4aaf3a; // primary green
	const greenDark = tint("#2a6a22", accent, 0.18); // shadowed side
	const greenMid = tint("#3c9030", accent, 0.18); // mid tone
	const greenLit = 0x6ace56; // top-lit highlight

	// ---- Feet (two blocks, bottom-centre) ----
	// Left foot.
	g.rect(-13, -5, 6, 5).fill(green);
	g.rect(-13, -5, 6, 1).fill(greenLit); // top highlight
	g.rect(-13, -5, 1, 5).fill(greenLit); // left-lit edge
	g.rect(-8, -5, 1, 5).fill(greenDark); // right shadow
	// Right foot.
	g.rect(7, -5, 6, 5).fill(green);
	g.rect(7, -5, 6, 1).fill(greenLit);
	g.rect(7, -5, 1, 5).fill(greenLit);
	g.rect(12, -5, 1, 5).fill(greenDark);

	// ---- Legs ----
	// Left leg.
	g.rect(-13, -13, 6, 8).fill(greenMid);
	g.rect(-13, -13, 6, 1).fill(green); // top
	g.rect(-13, -13, 1, 8).fill(greenLit);
	g.rect(-8, -13, 1, 8).fill(greenDark);
	// Right leg.
	g.rect(7, -13, 6, 8).fill(greenMid);
	g.rect(7, -13, 6, 1).fill(green);
	g.rect(7, -13, 1, 8).fill(greenLit);
	g.rect(12, -13, 1, 8).fill(greenDark);

	// ---- Body ----
	g.rect(-6, -23, 12, 10).fill(green);
	g.rect(-6, -23, 12, 1).fill(greenLit); // top-lit face
	g.rect(-6, -23, 1, 10).fill(greenLit); // left-lit edge
	g.rect(5, -23, 1, 10).fill(greenDark); // right shadow
	// Pixel texture detail: two dark specks on the body.
	g.rect(-3, -20, 2, 2).fill(greenDark);
	g.rect(2, -18, 2, 2).fill(greenDark);

	// ---- Head ----
	g.rect(-7, -35, 14, 12).fill(green);
	g.rect(-7, -35, 14, 1).fill(greenLit); // top edge (stompable indicator)
	g.rect(-7, -35, 1, 12).fill(greenLit); // left-lit edge
	g.rect(6, -35, 1, 12).fill(greenDark); // right shadow

	// ---- Classic Creeper face ----
	// Two black square eyes.
	g.rect(-5, -33, 4, 4).fill(0x111111);
	g.rect(1, -33, 4, 4).fill(0x111111);
	// Eye highlight pixels (top-left corner of each eye).
	g.rect(-5, -33, 1, 1).fill(0x444444);
	g.rect(1, -33, 1, 1).fill(0x444444);
	// Downward-T block mouth: a wide top segment + a narrow centre drop.
	g.rect(-3, -27, 6, 2).fill(0x111111); // horizontal bar
	g.rect(-1, -25, 2, 3).fill(0x111111); // centre drop

	c.addChild(g);
	return c;
}

/**
 * GHAST reskin for the bat slot.
 *
 * A blocky Minecraft Ghast: a small white floating cube with a sad face
 * and short stubby tentacle blocks dangling below. Drawn around its
 * centre like the base bat (bottom-centre origin, body upward).
 * Footprint: ~28 wide × ~26 tall, matching the bat silhouette.
 *
 * @param accent - Optional theme accent `#rrggbb` to tint shadows lightly.
 * @returns A {@link Container} with the Ghast silhouette.
 */
export function drawGhastSkin(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// White/off-white Ghast palette.
	const bodyWhite = 0xf0f0f0;
	const bodyLit = 0xffffff;
	const bodyShadow = tint("#c0c0c8", accent, 0.25);
	const bodyDark = tint("#9898a8", accent, 0.3);

	// ---- Main cube body ----
	// Centred around y≈−14 to match bat body position.
	const bx = -12;
	const by = -25; // top of cube
	const bw = 24;
	const bh = 18;

	g.rect(bx, by, bw, bh).fill(bodyWhite);
	g.rect(bx, by, bw, 2).fill(bodyLit); // top-lit face
	g.rect(bx, by, 2, bh).fill(bodyLit); // left-lit edge
	g.rect(bx + bw - 2, by, 2, bh).fill(bodyShadow); // right shadow
	g.rect(bx, by + bh - 2, bw, 2).fill(bodyShadow); // bottom shadow

	// ---- Sad face on the cube front ----
	// Two eyes: drooping square pixels (slightly offset down-inward = sad).
	g.rect(-8, -21, 3, 3).fill(0x222222); // left eye
	g.rect(5, -21, 3, 3).fill(0x222222); // right eye
	g.rect(-8, -21, 1, 1).fill(0x666666); // left eye highlight
	g.rect(5, -21, 1, 1).fill(0x666666); // right eye highlight
	// Sad mouth: a downward-arc made of three block segments.
	g.rect(-4, -14, 2, 2).fill(0x222222); // left corner (low)
	g.rect(-2, -15, 4, 2).fill(0x222222); // centre (higher)
	g.rect(2, -14, 2, 2).fill(0x222222); // right corner (low)

	// ---- Tentacle blocks hanging below the cube ----
	// Nine short rectangular tentacles of alternating widths.
	const tentacleData: [number, number, number][] = [
		[-10, 4, 7], // [x offset from 0, tentacle width, tentacle height]
		[-6, 3, 9],
		[-2, 3, 6],
		[2, 4, 10],
		[6, 3, 7],
	];
	for (const [tx, tw, th] of tentacleData) {
		const tentX = tx;
		const tentY = -7; // bottom of cube body (by + bh = -25 + 18 = -7)
		g.rect(tentX, tentY, tw, th).fill(bodyWhite);
		g.rect(tentX, tentY, tw, 1).fill(bodyLit); // top highlight
		g.rect(tentX, tentY, 1, th).fill(bodyLit); // left lit
		g.rect(tentX + tw - 1, tentY, 1, th).fill(bodyDark); // right shadow
		g.rect(tentX, tentY + th - 1, tw, 1).fill(bodyDark); // bottom shadow
	}

	c.addChild(g);
	return c;
}

/**
 * SPIDER HEAD reskin for the lurker slot.
 *
 * A blocky Minecraft Spider head clings to the ceiling, drawn DOWNWARD
 * from y=0 (ceiling attach point), growing toward positive y.
 * Footprint stays within the base lurker (~30 wide × ~28 tall downward).
 * Eight stubby block legs splay from the sides; two large red square eyes
 * stare downward so the player can read its threat from below.
 *
 * @param accent - Optional theme accent `#rrggbb` to lightly tint the dark body.
 * @returns A {@link Container} with the Spider lurker silhouette.
 */
export function drawSpiderSkin(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Dark spider body palette.
	const bodyDark = tint("#1a1010", accent, 0.2);
	const bodyMid = tint("#2e1c1c", accent, 0.22);
	const bodyLit = tint("#4a2c2c", accent, 0.18);
	const bodyEdge = tint("#0a0606", accent, 0.15);

	// ---- Ceiling attach clump (top, at y=0) ----
	// A flat wide block pressed against the ceiling.
	g.rect(-14, 0, 28, 5).fill(bodyDark);
	g.rect(-14, 0, 28, 1).fill(bodyEdge); // pressed-against-ceiling shadow

	// ---- Main head block ----
	// Grows downward from y=5.
	const hx = -13;
	const hy = 5;
	const hw = 26;
	const hh = 18;
	g.rect(hx, hy, hw, hh).fill(bodyMid);
	g.rect(hx, hy, hw, 2).fill(bodyLit); // top lit
	g.rect(hx, hy, 2, hh).fill(bodyLit); // left lit
	g.rect(hx + hw - 2, hy, 2, hh).fill(bodyDark); // right shadow
	g.rect(hx, hy + hh - 2, hw, 2).fill(bodyDark); // bottom shadow

	// Pixel texture: two dark specks on the head face.
	g.rect(-6, 10, 2, 2).fill(bodyEdge);
	g.rect(5, 12, 2, 2).fill(bodyEdge);

	// ---- Large glowing red square eyes (looking downward) ----
	// Eyes are at y≈14–20, clearly visible from below.
	g.rect(-9, 13, 6, 6).fill(0xcc1111); // left eye
	g.rect(3, 13, 6, 6).fill(0xcc1111); // right eye
	// Bright eye-glow inner pixel.
	g.rect(-8, 14, 2, 2).fill(0xff4444); // left glow
	g.rect(4, 14, 2, 2).fill(0xff4444); // right glow
	// Pupil.
	g.rect(-7, 15, 2, 2).fill(0x110000);
	g.rect(5, 15, 2, 2).fill(0x110000);

	// ---- Stubby block legs splaying from both sides ----
	// Four legs per side at two height levels, each a small rect.
	// Left legs.
	const legData: [number, number, number, number][] = [
		// [x, y, w, h] in container space
		[-22, 6, 8, 4], // upper-left far
		[-20, 11, 7, 4], // lower-left far
		[-19, 7, 6, 3], // upper-left near
		[-18, 13, 5, 3], // lower-left near
		// Right legs (positive x).
		[14, 6, 8, 4],
		[13, 11, 7, 4],
		[13, 7, 6, 3],
		[13, 13, 5, 3],
	];
	for (const [lx, ly, lw, lh] of legData) {
		g.rect(lx, ly, lw, lh).fill(bodyMid);
		g.rect(lx, ly, lw, 1).fill(bodyLit);
		g.rect(lx, ly, 1, lh).fill(bodyLit);
		g.rect(lx + lw - 1, ly, 1, lh).fill(bodyDark);
	}

	c.addChild(g);
	return c;
}
