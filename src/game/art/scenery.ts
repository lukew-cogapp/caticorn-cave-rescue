import { Container, Graphics } from "pixi.js";
import type { ThemeStyle } from "../level/themes";
import type { Decor } from "../types";
import { GAME_HEIGHT } from "../types";
import {
	addSpire,
	clampByte,
	hexToRgb,
	lerp,
	mixHex,
	packRgb,
	tint,
	tintStr,
	wobble,
} from "./util";

/** Layers returned by {@link drawBackgroundLayers} for parallax scrolling. */
export interface BackgroundLayers {
	/** Furthest layer: gradient bands, strata stripes, glow clusters, faint far rock silhouettes. */
	far: Container;
	/** Mid layer: mid rock silhouettes, distant stalactite/stalagmite forms. */
	mid: Container;
	/** Near layer: rock columns, near silhouettes, vignette overlay. */
	near: Container;
}

/**
 * Build a single decor piece at its local origin, scaled by `d.size`. The caller
 * positions it. Kinds: `stalactite` spikes DOWN from y=0 (ceiling); `stalagmite`
 * spikes UP from y=0 (floor); `crystal` is a small faceted gem centred on the
 * origin; `pebble`/`mushroom`/`moss` stand on the floor (drawn upward from the
 * base); `crack` is a faint jagged line drawn downward from the origin for walls.
 * Theme-signature kinds: `blossom` — cherry-blossom branch/shrub (floor, draws
 * upward); `gemcluster` — dense multi-crystal cluster (floor, draws upward);
 * `icicle` — translucent ice spike (ceiling, drawn downward from y=0);
 * `gravestone` — weathered headstone with cross scratch (floor, draws upward);
 * `web` — faint cobweb with radial+arc threads (ceiling, drawn downward from
 * y=0); `emberrock` — volcanic basalt lump with glowing lava cracks (floor,
 * draws upward).
 *
 * Gentle deterministic variation (segment counts, facet offsets, tuft layout) is
 * derived from `d.size` via {@link wobble} so repeated decor never looks
 * identical, with no `Math.random`/`Date.now`.
 *
 * When a theme `accent` (`#rrggbb`) is given, the structural fills (spire tones,
 * stones, mushroom cap, moss, crystal base) are blended toward it so the decor
 * matches the level mood; glints, glows, spots and contact shadows are left as-is
 * for readability. Omitting `accent` keeps the original colours, so existing call
 * sites are unaffected.
 *
 * @param d - Decor spec providing `kind` and `size`.
 * @param accent - Optional theme accent `#rrggbb` to recolour the decor toward.
 * @returns A Pixi {@link Container} drawn at its local origin.
 */
export function drawDecor(d: Decor, accent?: string): Container {
	const c = new Container();
	const g = new Graphics();
	const s = d.size;
	// Structural fills lean a fair way toward the accent; crystals stay subtle.
	const col = (hex: string) => tint(hex, accent, 0.4);

	if (d.kind === "stalactite") {
		// Lethal ceiling spike hanging DOWN from the ceiling (y=0). Drawn sharper
		// and more menacing than a plain spire so it reads as a hazard.
		const len = s * 2.2; // a touch longer for a pointier spike.
		const halfW = s * 0.46;
		const tipX = wobble(s, 3, s * 0.16); // gentle lean.

		// Rock attachment band along the ceiling so it grows out of the cave roof
		// instead of floating. A dark lump wider than the spike base.
		const baseDark = tintStr("#2a2540", accent, 0.4);
		const baseMid = tintStr("#3c3558", accent, 0.4);
		g.ellipse(0, 0, halfW * 1.9, s * 0.28).fill(baseDark);
		g.ellipse(0, -s * 0.04, halfW * 1.5, s * 0.2).fill(baseMid);

		// Sharp spire body (lit edge + dark seam + banding via addSpire).
		const seg = 4 + (Math.floor(s) % 2); // 4-5 segments = smoother, sharper.
		addSpire(
			g,
			halfW,
			len,
			1,
			tipX,
			seg,
			tintStr("#6b6394", accent, 0.4),
			tintStr("#4a4360", accent, 0.4),
			tintStr("#2b2640", accent, 0.4),
		);

		// Glossy danger highlight: a bright slim streak down the lit side.
		g.moveTo(-halfW * 0.32, s * 0.2)
			.quadraticCurveTo(tipX * 0.5 - halfW * 0.1, len * 0.55, tipX, len * 0.92)
			.stroke({ color: 0xe8e2ff, width: Math.max(1, s * 0.06), alpha: 0.5 });
		// Sharp tip glint.
		g.circle(tipX, len * 0.96, s * 0.06).fill({ color: 0xfdfbff, alpha: 0.95 });
	} else if (d.kind === "stalagmite") {
		// Tapered multi-segment spire rising UP from the floor (y=0).
		const seg = 3 + (Math.floor(s) % 2);
		const tipX = wobble(s, 5, s * 0.16);
		addSpire(
			g,
			s * 0.55,
			s * 2,
			-1,
			tipX,
			seg,
			tintStr("#5b567f", accent, 0.4),
			tintStr("#43406a", accent, 0.4),
			tintStr("#2d2a47", accent, 0.4),
		);
		// Faint lit cap on the tip.
		g.circle(tipX, -s * 1.85, s * 0.08).fill({ color: 0x726c95, alpha: 0.6 });
	} else if (d.kind === "crystal") {
		// Small faceted gem centred on the origin: light face, dark face, glint.
		// Crystals pull only gently toward the accent so they keep their gem read.
		const r = s * 0.5;
		const off = wobble(s, 2, r * 0.18); // facet asymmetry.
		const base = accent ? tintStr("#3aa9cf", accent, 0.5) : "#3aa9cf";
		const lightFace = mixHex(base, "#dffaff", 0.7);
		const darkFace = mixHex(base, "#10303f", 0.55);
		// Soft glow halo.
		g.circle(0, 0, r * 1.15).fill({ color: 0x8fe6ff, alpha: 0.18 });
		// Full gem silhouette (elongated hexagon).
		g.poly([
			off,
			-r,
			r * 0.72,
			-r * 0.25,
			r * 0.42,
			r,
			-r * 0.42,
			r,
			-r * 0.72,
			-r * 0.25,
		]).fill(mixHex(base, "#0b2733", 0.15));
		// Dark right face.
		g.poly([off, -r, r * 0.72, -r * 0.25, r * 0.42, r, off, r * 0.1]).fill(
			darkFace,
		);
		// Light left face.
		g.poly([off, -r, off, r * 0.1, -r * 0.42, r, -r * 0.72, -r * 0.25]).fill(
			lightFace,
		);
		// Bright glint on the lit face.
		g.poly([
			off - r * 0.12,
			-r * 0.45,
			off - r * 0.32,
			-r * 0.05,
			off - r * 0.16,
			-r * 0.08,
		]).fill({ color: 0xffffff, alpha: 0.9 });
	} else if (d.kind === "pebble") {
		// Cluster of 2-4 rounded stones with top-light and a contact shadow.
		const dark = col("#46414f");
		const mid = col("#5b5668");
		const top = col("#6f6a7e");
		// Soft contact shadow on the floor.
		g.ellipse(0, -s * 0.04, s * 0.62, s * 0.1).fill({
			color: 0x000000,
			alpha: 0.18,
		});
		const stones: [number, number, number][] = [
			[0, -s * 0.34, s * 0.42],
			[-s * 0.52, -s * 0.2, s * 0.3],
			[s * 0.5, -s * 0.18, s * 0.27],
			[s * 0.12, -s * 0.5, s * 0.22 + wobble(s, 9, s * 0.05)],
		];
		for (let i = 0; i < stones.length; i++) {
			const [px, py, pr] = stones[i];
			g.ellipse(px, py, pr, pr * 0.78).fill(i === 0 ? mid : dark);
			// Top-light highlight on the upper-left of each stone.
			g.ellipse(px - pr * 0.2, py - pr * 0.32, pr * 0.45, pr * 0.28).fill(
				i === 0 ? top : mid,
			);
		}
	} else if (d.kind === "mushroom") {
		// Cute cave mushroom: shaded stem, domed capped rim, glowing spots, shadow.
		const lean = wobble(s, 4, s * 0.06);
		// Ground shadow.
		g.ellipse(0, -s * 0.02, s * 0.34, s * 0.08).fill({
			color: 0x000000,
			alpha: 0.18,
		});
		// Stem with a darker shaded right side.
		g.roundRect(-s * 0.13, -s * 0.72, s * 0.26, s * 0.72, s * 0.12).fill(
			col("#d7cfba"),
		);
		g.roundRect(s * 0.0, -s * 0.72, s * 0.13, s * 0.72, s * 0.1).fill(
			col("#bcb39c"),
		);
		// Cap: a rounded dome with a lighter highlight band and a rim.
		g.ellipse(lean, -s * 0.7, s * 0.46, s * 0.34).fill(col("#6f5183"));
		g.ellipse(lean, -s * 0.78, s * 0.42, s * 0.24).fill(col("#8a66a0"));
		g.ellipse(lean - s * 0.12, -s * 0.84, s * 0.18, s * 0.1).fill(
			col("#a07cb8"),
		);
		// Cap rim/underside shadow line.
		g.ellipse(lean, -s * 0.62, s * 0.44, s * 0.1).fill(col("#5a4070"));
		// Glowing spots (2-3, count from size).
		const spots = 2 + (Math.floor(s) % 2);
		const spotXs = [-s * 0.16, s * 0.16, s * 0.02];
		for (let i = 0; i < spots; i++) {
			g.circle(lean + spotXs[i], -s * 0.76 + i * s * 0.04, s * 0.055).fill({
				color: 0xd2f3ff,
				alpha: 0.92,
			});
		}
	} else if (d.kind === "moss") {
		// Soft low clump: layered tufts in two greens with an irregular top edge.
		const darkG = col("#2c4429");
		const midG = col("#3e6638");
		const litG = col("#54834a");
		// Base pad hugging the floor.
		g.ellipse(0, -s * 0.05, s * 0.72, s * 0.13).fill(darkG);
		// Back row of taller tufts (darker).
		for (const tx of [-s * 0.42, -s * 0.05, s * 0.38]) {
			const h = s * 0.3 + wobble(s, tx, s * 0.06);
			g.poly([tx - s * 0.12, -s * 0.04, tx + s * 0.12, -s * 0.04, tx, -h]).fill(
				midG,
			);
		}
		// Front row of shorter, lighter tufts for a soft layered top edge.
		for (const tx of [-s * 0.55, -s * 0.22, s * 0.14, s * 0.5]) {
			const h = s * 0.2 + wobble(s, tx + 1, s * 0.05);
			g.poly([tx - s * 0.1, 0, tx + s * 0.1, 0, tx, -h]).fill(midG);
		}
		// A couple of lit fuzzy highlights.
		g.ellipse(-s * 0.12, -s * 0.13, s * 0.22, s * 0.1).fill(litG);
		g.ellipse(s * 0.26, -s * 0.1, s * 0.16, s * 0.08).fill(litG);
	} else if (d.kind === "blossom") {
		// Cherry-blossom shrub/branch growing UPWARD from the floor (origin = base).
		// A brown branch forks into 2-3 sub-branches, each tipped with a petal
		// cluster in rose/pink tones. Accent blends the branch wood colour.
		const branchCol = col("#6b3a28");
		const branchLit = col("#8c5038");
		const petalDark = 0xd46fa0; // kept unaccented so petals stay pink/rose
		const petalMid = 0xe88fbc;
		const petalLit = 0xfbcee6;
		const budCol = 0xf0a0c0;

		// Trunk: a short tapered post.
		const trunkH = s * 0.6;
		const lean = wobble(s, 7, s * 0.08);
		g.ellipse(0, -s * 0.02, s * 0.08, s * 0.05).fill({
			color: 0x000000,
			alpha: 0.15,
		}); // contact shadow
		g.roundRect(-s * 0.07, -trunkH, s * 0.14, trunkH, s * 0.04).fill(branchCol);
		// Lit edge on trunk.
		g.roundRect(-s * 0.07, -trunkH, s * 0.05, trunkH, s * 0.04).fill({
			color: branchLit,
			alpha: 0.7,
		});

		// Two forking branches radiating from the top of the trunk.
		const branches: [number, number, number, number][] = [
			// [startX, startY, endX, endY] all relative to origin
			[-lean - s * 0.04, -trunkH, -s * 0.38 + lean, -s * 1.1],
			[lean + s * 0.04, -trunkH, s * 0.34 + lean, -s * 1.05],
		];
		for (const [bx0, by0, bx1, by1] of branches) {
			g.moveTo(bx0, by0)
				.quadraticCurveTo((bx0 + bx1) * 0.5 + lean, (by0 + by1) * 0.5, bx1, by1)
				.stroke({ color: branchCol, width: Math.max(1.5, s * 0.06), alpha: 1 });
		}

		// Petal clusters at each branch tip + a central cluster.
		const clusters: [number, number, number][] = [
			[-s * 0.38 + lean, -s * 1.1, s * 0.28],
			[s * 0.34 + lean, -s * 1.05, s * 0.26],
			[lean, -s * 0.82, s * 0.22],
		];
		for (let ci = 0; ci < clusters.length; ci++) {
			const [cx, cy, cr] = clusters[ci];
			// Soft petal mass (dark outer, lighter inner).
			g.ellipse(cx, cy, cr * 1.1, cr * 0.72).fill({
				color: petalDark,
				alpha: 0.88,
			});
			g.ellipse(cx, cy - cr * 0.12, cr * 0.72, cr * 0.5).fill({
				color: petalMid,
				alpha: 0.9,
			});
			g.ellipse(cx - cr * 0.18, cy - cr * 0.22, cr * 0.36, cr * 0.28).fill({
				color: petalLit,
				alpha: 0.8,
			});
			// A few tiny petal dots scattered around the cluster.
			const dotXs = [-cr * 0.5, cr * 0.42, -cr * 0.1, cr * 0.22];
			const dotYs = [-cr * 0.38, -cr * 0.3, cr * 0.28, cr * 0.22];
			for (let di = 0; di < 4; di++) {
				const dvar = wobble(s + ci, di * 11 + 3, cr * 0.06);
				g.circle(cx + dotXs[di] + dvar, cy + dotYs[di], cr * 0.09).fill({
					color: petalLit,
					alpha: 0.75,
				});
			}
			// Tiny bud dot near each cluster.
			g.circle(
				cx + wobble(s, ci * 5 + 1, cr * 0.3),
				cy + wobble(s, ci * 5 + 2, cr * 0.25),
				cr * 0.07,
			).fill({ color: budCol, alpha: 0.85 });
		}
	} else if (d.kind === "gemcluster") {
		// Dense cluster of 3-5 faceted crystals of varying heights, growing UPWARD
		// from the floor (origin = base). Violet/cyan gem palette, structural fills
		// blended toward accent. Lit face / dark face / glint per crystal.
		const count = 3 + (Math.floor(s) % 3); // 3-5 gems
		const baseGem = accent ? tintStr("#6a3fcf", accent, 0.45) : "#6a3fcf";
		const darkFace = mixHex(baseGem, "#0a0520", 0.55);
		const litFace = mixHex(baseGem, "#d4f8ff", 0.62);
		const midFace = mixHex(baseGem, "#c0a0ff", 0.4);

		// Soft glow halo at the base.
		g.ellipse(0, -s * 0.08, s * 0.7, s * 0.22).fill({
			color: 0x9060ff,
			alpha: 0.14,
		});
		// Contact shadow.
		g.ellipse(0, -s * 0.02, s * 0.62, s * 0.09).fill({
			color: 0x000000,
			alpha: 0.18,
		});

		// Crystal positions/sizes — staggered offsets keyed on index.
		const xOffsets = [-s * 0.3, s * 0.28, s * 0.02, -s * 0.52, s * 0.5];
		const heights = [s * 1.0, s * 0.78, s * 1.2, s * 0.62, s * 0.86];
		const widths = [s * 0.2, s * 0.18, s * 0.22, s * 0.15, s * 0.17];

		for (let i = 0; i < count; i++) {
			const cx = xOffsets[i] + wobble(s, i * 13 + 1, s * 0.06);
			const ch = heights[i] + wobble(s, i * 13 + 2, s * 0.1);
			const cw = widths[i];
			const tipX = cx + wobble(s, i * 13 + 3, cw * 0.4);
			// Elongated hexagon silhouette (full fill = mid).
			g.poly([
				tipX,
				-ch,
				cx + cw,
				-ch * 0.32,
				cx + cw * 0.6,
				0,
				cx - cw * 0.6,
				0,
				cx - cw,
				-ch * 0.32,
			]).fill({ color: midFace, alpha: 1 });
			// Dark right face.
			g.poly([
				tipX,
				-ch,
				cx + cw,
				-ch * 0.32,
				cx + cw * 0.6,
				0,
				tipX,
				-ch * 0.22,
			]).fill({ color: darkFace, alpha: 0.9 });
			// Lit left sliver.
			g.poly([
				tipX,
				-ch,
				tipX,
				-ch * 0.22,
				cx - cw * 0.6,
				0,
				cx - cw,
				-ch * 0.32,
			]).fill({ color: litFace, alpha: 0.75 });
			// Bright tip glint.
			g.circle(tipX, -ch * 0.97, Math.max(1, s * 0.055)).fill({
				color: 0xffffff,
				alpha: 0.88,
			});
		}
	} else if (d.kind === "icicle") {
		// Hanging ice spike drawn DOWNWARD from y=0 (ceiling placement).
		// Pale-blue translucent taper, glassy highlight, sharp tip glint.
		// Visually lighter and glassier than the menacing grey stalactite.
		const iceLen = s * 2.0;
		const iceW = s * 0.32;
		const tipX = wobble(s, 11, s * 0.1); // gentle lean
		const tipY = iceLen;

		// Soft frost halo at the ceiling attachment.
		g.ellipse(0, 0, iceW * 2.0, s * 0.18).fill({ color: 0xb8f0ff, alpha: 0.2 });

		// Ice body — main cone silhouette in pale icy blue.
		g.poly([
			-iceW,
			0,
			iceW,
			0,
			iceW * 0.55,
			tipY * 0.55,
			tipX + iceW * 0.12,
			tipY * 0.9,
			tipX,
			tipY,
			tipX - iceW * 0.12,
			tipY * 0.9,
			-iceW * 0.55,
			tipY * 0.55,
		]).fill({ color: 0x9de8ff, alpha: 0.68 });

		// Lit glass edge — a slim bright sliver down the left.
		g.poly([
			-iceW,
			0,
			-iceW * 0.42,
			0,
			tipX - iceW * 0.22,
			tipY * 0.82,
			tipX,
			tipY,
			-iceW * 0.55,
			tipY * 0.55,
		]).fill({ color: 0xe8faff, alpha: 0.65 });

		// Interior dark core seam (right side depth).
		g.poly([
			iceW * 0.28,
			0,
			iceW,
			0,
			iceW * 0.55,
			tipY * 0.55,
			tipX + iceW * 0.12,
			tipY * 0.9,
			tipX,
			tipY,
		]).fill({ color: 0x4ab8d8, alpha: 0.45 });

		// Frosty cross-band highlights.
		for (let band = 1; band <= 2; band++) {
			const t = band / 3;
			const bw = iceW * (1 - t) * 0.9;
			const by = tipY * t;
			const bcx = tipX * t;
			g.moveTo(bcx - bw, by)
				.lineTo(bcx + bw, by)
				.stroke({
					color: 0xd0f4ff,
					width: Math.max(0.8, s * 0.05),
					alpha: 0.4,
				});
		}

		// Sharp tip glint.
		g.circle(tipX, tipY * 0.97, Math.max(1, s * 0.07)).fill({
			color: 0xffffff,
			alpha: 0.95,
		});
	} else if (d.kind === "gravestone") {
		// Weathered headstone standing UPWARD from the floor (origin = base).
		// Rounded-top slab, shaded right side, faint cross scratch, grass at base.
		const stoneH = s * 1.1;
		const stoneW = s * 0.64;
		const stoneBody = col("#6a6878");
		const stoneLit = col("#8a8898");
		const stoneDark = col("#4a4858");
		const stoneShadow = col("#38363f");
		const grassCol = col("#3e6638");
		const grassLit = col("#56834a");
		const scratchCol = 0xd0ccd8;

		// Contact shadow.
		g.ellipse(0, -s * 0.02, stoneW * 0.74, s * 0.08).fill({
			color: 0x000000,
			alpha: 0.18,
		});

		// Grass tuft at the base (drawn first so stone sits on top).
		for (const tx of [
			-stoneW * 0.28,
			0,
			stoneW * 0.28,
			-stoneW * 0.46,
			stoneW * 0.46,
		]) {
			const gh = s * 0.12 + Math.abs(wobble(s, tx * 7 + 1, s * 0.04));
			g.poly([
				tx - s * 0.05,
				0,
				tx + s * 0.05,
				0,
				tx + wobble(s, tx * 3 + 2, s * 0.04),
				-gh,
			]).fill(grassCol);
		}
		// Lit grass highlights.
		g.ellipse(-stoneW * 0.18, -s * 0.07, stoneW * 0.18, s * 0.06).fill(
			grassLit,
		);
		g.ellipse(stoneW * 0.22, -s * 0.06, stoneW * 0.14, s * 0.05).fill(grassLit);

		// Slab body — rect bottom half, rounded top.
		const halfW = stoneW * 0.5;
		const roundTop = stoneH * 0.38; // height of the rounded cap portion
		g.roundRect(-halfW, -stoneH, stoneW, stoneH, stoneW * 0.46).fill(stoneDark); // base silhouette
		g.roundRect(-halfW, -stoneH, stoneW, stoneH, stoneW * 0.46).stroke({
			color: stoneShadow,
			width: 1.2,
			alpha: 0.5,
		});
		// Main lit face (slightly inset).
		g.roundRect(
			-halfW + s * 0.04,
			-stoneH + s * 0.04,
			stoneW - s * 0.04,
			stoneH - s * 0.04,
			stoneW * 0.44,
		).fill(stoneBody);
		// Lit top-left highlight.
		g.ellipse(
			-halfW * 0.5,
			-stoneH + roundTop * 0.45,
			halfW * 0.52,
			roundTop * 0.34,
		).fill({ color: stoneLit, alpha: 0.55 });
		// Right-side shade for depth.
		g.roundRect(
			halfW * 0.38,
			-stoneH,
			halfW * 0.58,
			stoneH,
			stoneW * 0.44,
		).fill({ color: stoneDark, alpha: 0.45 });

		// Faint cross scratch near the top.
		const crossCY = -stoneH + roundTop * 0.9;
		const crossArmH = stoneH * 0.18;
		const crossArmW = stoneW * 0.26;
		const scratchW = Math.max(0.8, s * 0.05);
		// Vertical bar.
		g.moveTo(0, crossCY - crossArmH)
			.lineTo(0, crossCY + crossArmH * 0.7)
			.stroke({ color: scratchCol, width: scratchW, alpha: 0.28 });
		// Horizontal bar.
		g.moveTo(-crossArmW, crossCY)
			.lineTo(crossArmW, crossCY)
			.stroke({ color: scratchCol, width: scratchW, alpha: 0.28 });
	} else if (d.kind === "web") {
		// Faint cobweb hanging from the ceiling (y=0), drawn DOWNWARD.
		// Radial threads + 2-3 concentric arc threads, pale grey at low alpha,
		// with an optional tiny spider dot. Purely decorative, very subtle.
		const webR = s * 0.9; // half-span of the web
		const webDepth = s * 0.75; // how far it droops down
		const threadCol = 0xd0cce0;
		const threadW = Math.max(0.6, s * 0.04);

		// Number of radial threads: 5-7 based on size.
		const radials = 5 + (Math.floor(s) % 3);
		const threadXs: number[] = [];
		const threadYs: number[] = [];
		for (let i = 0; i < radials; i++) {
			// Spread radials across the top edge and fan down.
			const t = i / (radials - 1); // 0..1
			const tx = lerp(-webR, webR, t);
			// Fan tip: outer threads go less deep, centre thread goes deepest.
			const depth = webDepth * (1 - Math.abs(t - 0.5) * 1.1);
			const ty = Math.max(s * 0.08, depth);
			threadXs.push(tx);
			threadYs.push(ty);
			g.moveTo(tx, 0)
				.lineTo(tx, ty)
				.stroke({ color: threadCol, width: threadW, alpha: 0.28 });
		}

		// 2-3 concentric horizontal arc threads linking the radials.
		const arcCount = 2 + (Math.floor(s) % 2);
		for (let ai = 1; ai <= arcCount; ai++) {
			const arcT = ai / (arcCount + 1);
			// Catenary-style arc: interpolate along each radial thread.
			const arcPoints: number[] = [];
			for (let i = 0; i < radials; i++) {
				arcPoints.push(threadXs[i], threadYs[i] * arcT);
			}
			// Draw arcs as a series of line segments between adjacent radials.
			for (let i = 0; i < radials - 1; i++) {
				const ax0 = arcPoints[i * 2];
				const ay0 = arcPoints[i * 2 + 1];
				const ax1 = arcPoints[(i + 1) * 2];
				const ay1 = arcPoints[(i + 1) * 2 + 1];
				const midY = Math.max(ay0, ay1) + webDepth * 0.04;
				g.moveTo(ax0, ay0)
					.quadraticCurveTo((ax0 + ax1) * 0.5, midY, ax1, ay1)
					.stroke({ color: threadCol, width: threadW * 0.75, alpha: 0.22 });
			}
		}

		// Tiny spider dot, hanging slightly off-centre at the web centre.
		const spiderX = wobble(s, 19, webR * 0.18);
		const spiderY = webDepth * 0.42 + wobble(s, 23, webDepth * 0.08);
		g.circle(spiderX, spiderY, Math.max(1.5, s * 0.07)).fill({
			color: 0x403850,
			alpha: 0.65,
		});
	} else if (d.kind === "emberrock") {
		// Volcanic basalt lump with glowing lava cracks, standing UPWARD from floor
		// (origin = base). Dark rock body + bright orange/yellow crack network +
		// warm glow halo. Structural rock colour blends toward accent.
		const rockBody = col("#2a1e1a");
		const rockMid = col("#3e2e28");
		const rockLit = col("#4e3e36");
		const lavaOrange = 0xff6020;
		const lavaYellow = 0xffc040;
		const glowCol = 0xff7030;

		// Warm ember glow halo at the base (drawn first, underneath).
		g.ellipse(0, -s * 0.28, s * 0.72, s * 0.38).fill({
			color: glowCol,
			alpha: 0.18,
		});
		g.ellipse(0, -s * 0.2, s * 0.44, s * 0.22).fill({
			color: lavaYellow,
			alpha: 0.12,
		});

		// Contact shadow.
		g.ellipse(0, -s * 0.02, s * 0.58, s * 0.09).fill({
			color: 0x000000,
			alpha: 0.22,
		});

		// Rock body: an irregular lumpy mass via overlapping ellipses.
		g.ellipse(0, -s * 0.36, s * 0.58, s * 0.42).fill(rockBody);
		g.ellipse(-s * 0.14, -s * 0.28, s * 0.36, s * 0.28).fill(rockMid);
		g.ellipse(s * 0.18, -s * 0.32, s * 0.3, s * 0.26).fill(rockMid);
		// Small secondary lump on top-left.
		g.ellipse(
			-s * 0.22 + wobble(s, 5, s * 0.06),
			-s * 0.6 + wobble(s, 6, s * 0.06),
			s * 0.26,
			s * 0.2,
		).fill(rockBody);
		// Lit highlight on top edge.
		g.ellipse(-s * 0.12, -s * 0.62, s * 0.2, s * 0.1).fill({
			color: rockLit,
			alpha: 0.7,
		});

		// Lava crack network — 3 main cracks + thin offshoots, all orange/yellow.
		const crackW = Math.max(1, s * 0.08);
		// Main vertical crack.
		g.moveTo(wobble(s, 1, s * 0.06), -s * 0.06)
			.quadraticCurveTo(
				wobble(s, 2, s * 0.1),
				-s * 0.38,
				wobble(s, 3, s * 0.08),
				-s * 0.62,
			)
			.stroke({ color: lavaOrange, width: crackW, alpha: 0.9 });
		// Bright inner glow of the crack.
		g.moveTo(wobble(s, 1, s * 0.06), -s * 0.06)
			.quadraticCurveTo(
				wobble(s, 2, s * 0.1),
				-s * 0.38,
				wobble(s, 3, s * 0.08),
				-s * 0.62,
			)
			.stroke({ color: lavaYellow, width: crackW * 0.45, alpha: 0.85 });
		// Left branch crack.
		g.moveTo(wobble(s, 2, s * 0.1), -s * 0.38)
			.lineTo(-s * 0.28 + wobble(s, 4, s * 0.06), -s * 0.24)
			.stroke({ color: lavaOrange, width: crackW * 0.7, alpha: 0.8 });
		// Right branch crack.
		g.moveTo(wobble(s, 2, s * 0.1), -s * 0.38)
			.lineTo(s * 0.26 + wobble(s, 5, s * 0.06), -s * 0.5)
			.stroke({ color: lavaOrange, width: crackW * 0.65, alpha: 0.75 });
		// Glowing lava pool dot at the main crack base.
		g.circle(wobble(s, 1, s * 0.06), -s * 0.1, s * 0.09).fill({
			color: lavaYellow,
			alpha: 0.92,
		});
		g.circle(wobble(s, 1, s * 0.06), -s * 0.1, s * 0.16).fill({
			color: lavaOrange,
			alpha: 0.35,
		});
	} else {
		// Fine hairline wall fracture: a faint main crack with thin branches.
		const w = Math.max(0.8, s * 0.04);
		const jx = wobble(s, 6, s * 0.1); // lateral wander seed.
		g.moveTo(0, 0)
			.lineTo(s * 0.12 + jx, s * 0.42)
			.lineTo(-s * 0.06 + jx, s * 0.84)
			.lineTo(s * 0.1 + jx, s * 1.28)
			.lineTo(-s * 0.02 + jx, s * 1.7)
			.stroke({ color: 0x141220, width: w, alpha: 0.32 });
		// Two thin offshoot branches.
		g.moveTo(-s * 0.06 + jx, s * 0.84)
			.lineTo(-s * 0.34 + jx, s * 1.04)
			.stroke({ color: 0x141220, width: w * 0.7, alpha: 0.26 });
		g.moveTo(s * 0.1 + jx, s * 1.28)
			.lineTo(s * 0.32 + jx, s * 1.42)
			.stroke({ color: 0x141220, width: w * 0.6, alpha: 0.24 });
	}

	c.addChild(g);
	return c;
}

/**
 * Build a row of small grass blades/tufts sitting along the top edge of a
 * platform of the given `width`. Origin is the platform's top-left corner; the
 * row runs right along `x: 0..width` with `y=0` at the platform surface and
 * blades poking upward (negative y). Each blade's height, lean, and colour vary
 * deterministically by index via {@link wobble} (no `Math.random`). Muted,
 * natural greens.
 *
 * @param width - Platform width in pixels the grass row spans.
 * @returns A Container with the grass row at local origin (top-left).
 */
export function drawGrassBlades(width: number): Container {
	const c = new Container();
	const g = new Graphics();

	const greens = ["#3e6638", "#4f7d44", "#5e9450", "#54834a"];
	const spacing = 7;
	// Blades stepped across the width; a small inset keeps them off the corners.
	for (let x = 3; x <= width - 3; x += spacing) {
		// Deterministic per-blade variation keyed off the x position.
		const h = 5 + Math.abs(wobble(x, 1, 4)); // 5..9px tall.
		const lean = wobble(x, 2, 3); // sideways tip offset.
		const col = greens[Math.abs(Math.round(wobble(x, 3, 100))) % greens.length];
		// A small two-blade tuft: a taller main blade and a shorter neighbour.
		const halfW = 1.6;
		// Main blade as a thin tapered triangle curving to a leaning tip.
		g.moveTo(x - halfW, 0)
			.quadraticCurveTo(x - halfW * 0.4, -h * 0.6, x + lean, -h)
			.quadraticCurveTo(x + halfW * 0.4, -h * 0.6, x + halfW, 0)
			.closePath()
			.fill(col);
		// Shorter side blade leaning the other way.
		const h2 = h * 0.6;
		const lean2 = -lean * 0.7;
		g.moveTo(x - 0.6, 0)
			.quadraticCurveTo(x - 2 + lean2 * 0.5, -h2 * 0.6, x - 2.5 + lean2, -h2)
			.quadraticCurveTo(x - 1.2, -h2 * 0.5, x + 1, 0)
			.closePath()
			.fill(greens[(Math.abs(Math.round(x)) + 1) % greens.length]);
	}

	c.addChild(g);
	return c;
}

/**
 * Build a full-width, layered cave background for one level. Emulates a vertical
 * gradient between `bg[0]` (top) and `bg[1]` (bottom) by stacking horizontal
 * bands across {@link GAME_HEIGHT}, then layers (back to front): faint vertical
 * strata, deep glowing crystal/pool clusters, three depth layers of rock
 * silhouettes at different tones, distant stalactite + stalagmite silhouettes,
 * rock columns/arches, and a soft vignette. Tones are 3-4 lerp steps between
 * `bg[0]`/`bg[1]` with channels clamped to 0-255 (no underflow on dark themes).
 * Deterministic: a small local seeded PRNG drives variation (no `Math.random`).
 * Stays subtle so it never competes with gameplay. Cheap: no per-pixel work.
 *
 * @param worldWidth - Total world width in pixels; the background spans it.
 * @param bg - Two-stop `[top, bottom]` gradient as `#rrggbb` strings.
 * @returns A Container sized `worldWidth` x {@link GAME_HEIGHT} at top-left 0,0.
 */
export function drawBackground(
	worldWidth: number,
	bg: [string, string],
): Container {
	const c = new Container();
	const g = new Graphics();

	const [tr, tg, tb] = hexToRgb(bg[0]);
	const [br, bgc, bb] = hexToRgb(bg[1]);

	const bands = 24;
	const bandH = GAME_HEIGHT / bands;
	for (let i = 0; i < bands; i++) {
		const t = i / (bands - 1);
		const col = packRgb(lerp(tr, br, t), lerp(tg, bgc, t), lerp(tb, bb, t));
		// +1px overlap avoids hairline seams between bands.
		g.rect(0, i * bandH, worldWidth, bandH + 1).fill(col);
	}

	// Small local seeded PRNG (mulberry32-style) for deterministic variation.
	// Seeded from a fixed constant so the same world always looks the same.
	let seed = 0x9e3779b1;
	const rand = (): number => {
		seed = (seed + 0x6d2b79f5) | 0;
		let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
	// Random in [a, b).
	const rng = (a: number, b: number): number => a + rand() * (b - a);

	// 3-4 tonal rock steps between the two stops, biased toward the bottom tone,
	// with channels clamped so dark backgrounds never underflow to garbage.
	const tone = (t: number, shift: number): number =>
		packRgb(
			clampByte(lerp(tr, br, t) + shift),
			clampByte(lerp(tg, bgc, t) + shift),
			clampByte(lerp(tb, bb, t) + shift),
		);
	const wallFar = tone(0.55, -8); // far silhouette layer.
	const wallMid = tone(0.6, -18); // mid silhouette layer.
	const wallNear = tone(0.68, -30); // near (darkest) silhouette layer.
	const wallLight = tone(0.45, 16); // faint highlighted rock.

	// Faint vertical strata to suggest rock layers (cheap full-height stripes).
	for (let x = 0; x < worldWidth; x += 46) {
		const a = ((x / 46) % 2) * 0.04 + 0.03;
		g.rect(x, 0, 24, GAME_HEIGHT).fill({ color: wallFar, alpha: a });
	}

	// Deep glowing crystal/pool clusters far in the back: a soft coloured halo
	// with a brighter core, a few scattered along the floor and walls.
	const glowCols = [0x6fe3ff, 0x8f7bff, 0x6cff9e];
	const glowCount = Math.max(2, Math.floor(worldWidth / 520));
	for (let i = 0; i < glowCount; i++) {
		const gx = rng(40, worldWidth - 40);
		const gy = rng(GAME_HEIGHT * 0.45, GAME_HEIGHT - 56);
		const gr = rng(22, 40);
		const gc = glowCols[Math.floor(rand() * glowCols.length)];
		g.ellipse(gx, gy, gr * 1.4, gr).fill({ color: gc, alpha: 0.07 });
		g.ellipse(gx, gy, gr * 0.8, gr * 0.6).fill({ color: gc, alpha: 0.1 });
		// A couple of tiny bright crystal facets in the cluster.
		for (let k = 0; k < 3; k++) {
			const cx2 = gx + rng(-gr * 0.6, gr * 0.6);
			const cy2 = gy + rng(-gr * 0.3, gr * 0.3);
			g.poly([cx2, cy2 - 5, cx2 + 2.5, cy2, cx2, cy2 + 5, cx2 - 2.5, cy2]).fill(
				{ color: gc, alpha: 0.18 },
			);
		}
	}

	// Three depth layers of rolling rock silhouettes along the floor: far/light
	// first, then mid, then near/dark, each a row of overlapping ellipses at
	// deterministic positions. Lighter + smaller = further back.
	const layers: { col: number; alpha: number; base: number; amp: number }[] = [
		{ col: wallFar, alpha: 0.18, base: GAME_HEIGHT - 70, amp: 36 },
		{ col: wallMid, alpha: 0.24, base: GAME_HEIGHT - 50, amp: 46 },
		{ col: wallNear, alpha: 0.3, base: GAME_HEIGHT - 30, amp: 58 },
	];
	for (const layer of layers) {
		const step = 110 + layer.amp;
		for (let x = -step / 2; x < worldWidth + step; x += step) {
			const w2 = rng(step * 0.7, step * 1.1);
			const h2 = rng(layer.amp * 0.7, layer.amp * 1.2);
			const cy = layer.base - h2 * 0.3;
			g.ellipse(x + rng(-step * 0.2, step * 0.2), cy, w2, h2).fill({
				color: layer.col,
				alpha: layer.alpha,
			});
		}
	}

	// Distant stalactite silhouettes hanging from the ceiling (thin triangles).
	for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
		const w2 = rng(10, 22);
		const len = rng(28, 70);
		g.poly([x - w2 / 2, 0, x + w2 / 2, 0, x + rng(-6, 6), len]).fill({
			color: wallMid,
			alpha: 0.22,
		});
	}
	// Distant stalagmite silhouettes rising from the floor.
	for (let x = rng(80, 180); x < worldWidth; x += rng(140, 260)) {
		const w2 = rng(14, 28);
		const len = rng(30, 64);
		const base = GAME_HEIGHT - 26;
		g.poly([
			x - w2 / 2,
			base,
			x + w2 / 2,
			base,
			x + rng(-6, 6),
			base - len,
		]).fill({ color: wallNear, alpha: 0.24 });
	}

	// A couple of tall rock columns / arches spanning floor to ceiling for scale.
	const colCount = Math.max(1, Math.floor(worldWidth / 700));
	for (let i = 0; i < colCount; i++) {
		const cx = rng(120, worldWidth - 120);
		const cw = rng(26, 44);
		// Column body, slightly waisted in the middle.
		g.poly([
			cx - cw / 2,
			0,
			cx + cw / 2,
			0,
			cx + cw * 0.32,
			GAME_HEIGHT * 0.5,
			cx + cw / 2,
			GAME_HEIGHT,
			cx - cw / 2,
			GAME_HEIGHT,
			cx - cw * 0.32,
			GAME_HEIGHT * 0.5,
		]).fill({ color: wallFar, alpha: 0.16 });
		// Faint lit edge down the left of the column.
		g.rect(cx - cw / 2, 0, 3, GAME_HEIGHT).fill({
			color: wallLight,
			alpha: 0.06,
		});
	}

	// Soft bottom vignette for cave depth (top vignette removed; it read as a
	// dark bar now the HUD lives in a DOM bar above the canvas).
	g.rect(0, GAME_HEIGHT - 50, worldWidth, 50).fill({
		color: 0x000000,
		alpha: 0.28,
	});

	c.addChild(g);
	return c;
}

/**
 * Split the cave background into three parallax-ready depth layers. Each
 * layer is a {@link Container} spanning the full `worldWidth` x
 * {@link GAME_HEIGHT} rect positioned at (0,0). The caller scrolls each at a
 * different fraction of the camera offset to create depth:
 *
 * ```ts
 * const layers = drawBackgroundLayers(worldWidth, level.bg, level.themeAccent, level.themeStyle);
 * world.addChildAt(layers.far,  0);
 * world.addChildAt(layers.mid,  1);
 * world.addChildAt(layers.near, 2);
 * // on camera pan:
 * layers.far.x  = -cameraX * 0.15;
 * layers.mid.x  = -cameraX * 0.35;
 * layers.near.x = -cameraX * 0.6;
 * ```
 *
 * All variation is deterministic (seeded PRNG, no `Math.random`/`Date.now`).
 * Theme `accent` colours the glow clusters when provided; rock tones are
 * derived from `bg` stops exactly as in {@link drawBackground}.
 * The `style` parameter drives theme-specific silhouette content per layer so
 * each cave type looks like a genuinely different place:
 * - `blossom`: rounded tree-canopy silhouettes + drooping branch shapes.
 * - `crystal`: clustered angular crystal-shard / geode wall silhouettes.
 * - `ice`: jagged glacier walls + angular ice blocks + faint icicle rows.
 * - `crypt`: gothic arches, pillars, distant tombstone silhouettes.
 * - `grove`: big mushroom silhouettes + organic blobby cave walls.
 * - `molten`: rock walls with lava fissures + ember-lit pool clusters.
 *
 * @param worldWidth - Total world width in pixels; all layers span it.
 * @param bg - Two-stop `[top, bottom]` gradient as `#rrggbb` strings.
 * @param accent - Optional theme accent `#rrggbb` to tint glow clusters.
 * @param style - Theme style discriminant driving silhouette content.
 * @returns `{ far, mid, near }` Containers ready for the world.
 */
export function drawBackgroundLayers(
	worldWidth: number,
	bg: [string, string],
	accent: string | undefined,
	style: ThemeStyle,
): BackgroundLayers {
	const [tr, tg, tb] = hexToRgb(bg[0]);
	const [br, bgc, bb] = hexToRgb(bg[1]);

	// Shared tone helper (same formula as drawBackground).
	const tone = (t: number, shift: number): number =>
		packRgb(
			clampByte(lerp(tr, br, t) + shift),
			clampByte(lerp(tg, bgc, t) + shift),
			clampByte(lerp(tb, bb, t) + shift),
		);
	const wallFar = tone(0.55, -8);
	const wallMid = tone(0.6, -18);
	const wallNear = tone(0.68, -30);
	const wallLight = tone(0.45, 16);

	// Local seeded PRNG — same seed as drawBackground so layers mesh visually.
	let seed = 0x9e3779b1;
	const rand = (): number => {
		seed = (seed + 0x6d2b79f5) | 0;
		let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
	const rng = (a: number, b: number): number => a + rand() * (b - a);

	// ── FAR layer ────────────────────────────────────────────────────────────
	// Gradient bands + strata + glow clusters + faint far rock silhouettes.
	const farC = new Container();
	const farG = new Graphics();

	// Gradient bands.
	const bands = 24;
	const bandH = GAME_HEIGHT / bands;
	for (let i = 0; i < bands; i++) {
		const t = i / (bands - 1);
		const col = packRgb(lerp(tr, br, t), lerp(tg, bgc, t), lerp(tb, bb, t));
		farG.rect(0, i * bandH, worldWidth, bandH + 1).fill(col);
	}

	// Vertical strata stripes.
	for (let x = 0; x < worldWidth; x += 46) {
		const a = ((x / 46) % 2) * 0.04 + 0.03;
		farG.rect(x, 0, 24, GAME_HEIGHT).fill({ color: wallFar, alpha: a });
	}

	// Glow clusters — tinted toward accent when available.
	const baseCols: number[] = [0x6fe3ff, 0x8f7bff, 0x6cff9e];
	const glowCols = accent
		? baseCols.map((c) => {
				// Blend each preset glow colour toward the accent for theme cohesion.
				const base = `#${c.toString(16).padStart(6, "0")}`;
				return tint(base, accent, 0.45);
			})
		: baseCols;
	const glowCount = Math.max(2, Math.floor(worldWidth / 520));
	for (let i = 0; i < glowCount; i++) {
		const gx = rng(40, worldWidth - 40);
		const gy = rng(GAME_HEIGHT * 0.45, GAME_HEIGHT - 56);
		const gr = rng(22, 40);
		const gc = glowCols[Math.floor(rand() * glowCols.length)];
		farG.ellipse(gx, gy, gr * 1.4, gr).fill({ color: gc, alpha: 0.07 });
		farG.ellipse(gx, gy, gr * 0.8, gr * 0.6).fill({ color: gc, alpha: 0.1 });
		for (let k = 0; k < 3; k++) {
			const cx2 = gx + rng(-gr * 0.6, gr * 0.6);
			const cy2 = gy + rng(-gr * 0.3, gr * 0.3);
			farG
				.poly([cx2, cy2 - 5, cx2 + 2.5, cy2, cx2, cy2 + 5, cx2 - 2.5, cy2])
				.fill({ color: gc, alpha: 0.18 });
		}
	}

	// Far rock silhouette layer only (lightest, smallest).
	const farStep = 110 + 36;
	for (let x = -farStep / 2; x < worldWidth + farStep; x += farStep) {
		const w2 = rng(farStep * 0.7, farStep * 1.1);
		const h2 = rng(36 * 0.7, 36 * 1.2);
		const cy = GAME_HEIGHT - 70 - h2 * 0.3;
		farG.ellipse(x + rng(-farStep * 0.2, farStep * 0.2), cy, w2, h2).fill({
			color: wallFar,
			alpha: 0.18,
		});
	}

	// Theme-specific far silhouette pass — subtle backdrop shapes.
	drawFarSilhouettes(farG, worldWidth, wallFar, wallMid, rng, style);

	farC.addChild(farG);

	// ── MID layer ────────────────────────────────────────────────────────────
	// Mid rock silhouettes + distant stalactites/stalagmites + theme details.
	const midC = new Container();
	const midG = new Graphics();

	// Mid silhouette row.
	const midStep = 110 + 46;
	for (let x = -midStep / 2; x < worldWidth + midStep; x += midStep) {
		const w2 = rng(midStep * 0.7, midStep * 1.1);
		const h2 = rng(46 * 0.7, 46 * 1.2);
		const cy = GAME_HEIGHT - 50 - h2 * 0.3;
		midG.ellipse(x + rng(-midStep * 0.2, midStep * 0.2), cy, w2, h2).fill({
			color: wallMid,
			alpha: 0.24,
		});
	}

	// Distant stalactite silhouettes — replaced per-theme below where relevant;
	// kept for generic fallback styles.
	switch (style) {
		case "blossom":
			// Hanging branch silhouettes instead of stalactites.
			for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
				const branchW = rng(18, 38);
				const dropLen = rng(22, 52);
				// Curved organic branch drooping from ceiling.
				midG
					.moveTo(x - branchW * 0.5, 0)
					.quadraticCurveTo(x, dropLen * 0.55, x + branchW * 0.4, dropLen)
					.stroke({ color: wallMid, width: rng(2.5, 4.5), alpha: 0.2 });
				// Small foliage blob at the tip.
				midG.ellipse(x + branchW * 0.4, dropLen, rng(8, 16), rng(5, 10)).fill({
					color: wallMid,
					alpha: 0.18,
				});
			}
			break;
		case "crystal":
			// Angular crystal shards jutting from ceiling.
			for (let x = rng(60, 140); x < worldWidth; x += rng(100, 200)) {
				const shardW = rng(6, 14);
				const shardLen = rng(25, 65);
				const tipX = x + rng(-8, 8);
				midG
					.poly([x - shardW, 0, x + shardW, 0, tipX, shardLen])
					.fill({ color: wallMid, alpha: 0.22 });
				// Lit sliver on left face.
				midG
					.poly([
						x - shardW,
						0,
						x - shardW * 0.2,
						0,
						tipX - shardW * 0.15,
						shardLen * 0.85,
						tipX,
						shardLen,
					])
					.fill({ color: wallLight, alpha: 0.1 });
			}
			break;
		case "ice":
			// Jagged glacier ceiling spikes.
			for (let x = rng(50, 120); x < worldWidth; x += rng(90, 180)) {
				const iceW = rng(12, 28);
				const iceLen = rng(30, 72);
				// Blocky angular ice form.
				midG
					.poly([
						x - iceW,
						0,
						x + iceW,
						0,
						x + iceW * 0.6,
						iceLen * 0.6,
						x + rng(-4, 4),
						iceLen,
						x - iceW * 0.6,
						iceLen * 0.6,
					])
					.fill({ color: wallMid, alpha: 0.2 });
				midG
					.poly([
						x - iceW,
						0,
						x - iceW * 0.3,
						0,
						x - iceW * 0.1,
						iceLen * 0.7,
						x - iceW * 0.6,
						iceLen * 0.6,
					])
					.fill({ color: wallLight, alpha: 0.1 });
			}
			break;
		case "crypt":
			// Gothic arch / pillar silhouettes hanging from ceiling.
			for (let x = rng(80, 160); x < worldWidth; x += rng(140, 260)) {
				const archW = rng(18, 32);
				const archH = rng(40, 80);
				const pillarW = archW * 0.28;
				// Left pillar.
				midG
					.rect(x - archW * 0.5, 0, pillarW, archH * 0.7)
					.fill({ color: wallMid, alpha: 0.2 });
				// Right pillar.
				midG
					.rect(x + archW * 0.5 - pillarW, 0, pillarW, archH * 0.7)
					.fill({ color: wallMid, alpha: 0.2 });
				// Pointed arch connecting them.
				midG
					.moveTo(x - archW * 0.5, 0)
					.quadraticCurveTo(x - archW * 0.5, archH, x, archH * 0.55)
					.quadraticCurveTo(x + archW * 0.5, archH, x + archW * 0.5, 0)
					.fill({ color: wallMid, alpha: 0.15 });
			}
			break;
		case "grove":
			// Large mushroom cap silhouettes in the mid distance.
			for (let x = rng(60, 140); x < worldWidth; x += rng(120, 240)) {
				const stemH = rng(28, 55);
				const capW = rng(30, 60);
				const capH = rng(16, 28);
				const base = GAME_HEIGHT - 26;
				// Stem.
				midG
					.rect(x - capW * 0.1, base - stemH, capW * 0.2, stemH)
					.fill({ color: wallMid, alpha: 0.2 });
				// Dome cap.
				midG
					.ellipse(x, base - stemH - capH * 0.4, capW, capH)
					.fill({ color: wallMid, alpha: 0.24 });
				midG
					.ellipse(
						x - capW * 0.2,
						base - stemH - capH * 0.6,
						capW * 0.5,
						capH * 0.55,
					)
					.fill({ color: wallLight, alpha: 0.08 });
			}
			// No standard stalactites in grove — organic blobby ceiling bulges instead.
			for (let x = rng(80, 180); x < worldWidth; x += rng(130, 240)) {
				const blobW = rng(20, 40);
				const blobH = rng(10, 26);
				midG.ellipse(x, blobH * 0.5, blobW, blobH).fill({
					color: wallMid,
					alpha: 0.18,
				});
			}
			break;
		case "molten":
			// Jagged magma-column / basalt vent silhouettes from floor.
			for (let x = rng(80, 180); x < worldWidth; x += rng(150, 280)) {
				const colW = rng(14, 26);
				const colH = rng(30, 70);
				const base = GAME_HEIGHT - 26;
				midG
					.poly([
						x - colW * 0.5,
						base,
						x + colW * 0.5,
						base,
						x + colW * 0.35,
						base - colH * 0.5,
						x + colW * 0.2,
						base - colH,
						x - colW * 0.15,
						base - colH * 0.85,
						x - colW * 0.4,
						base - colH * 0.5,
					])
					.fill({ color: wallNear, alpha: 0.22 });
			}
			// Glowing lava crack accent lines in far layer (faint).
			for (let x = rng(60, 180); x < worldWidth; x += rng(200, 380)) {
				const crackH = rng(12, 30);
				const base = GAME_HEIGHT - 20;
				midG
					.moveTo(x + rng(-6, 6), base)
					.lineTo(x + rng(-4, 4), base - crackH)
					.stroke({ color: 0xff6020, width: rng(1.2, 2.5), alpha: 0.18 });
			}
			break;
		default:
			// Generic fallback: standard stalactite silhouettes.
			for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
				const w2 = rng(10, 22);
				const len = rng(28, 70);
				midG
					.poly([x - w2 / 2, 0, x + w2 / 2, 0, x + rng(-6, 6), len])
					.fill({ color: wallMid, alpha: 0.22 });
			}
	}

	// Distant stalagmite silhouettes (shared across non-grove styles; grove omits).
	if (style !== "grove") {
		for (let x = rng(80, 180); x < worldWidth; x += rng(140, 260)) {
			const w2 = rng(14, 28);
			const len = rng(30, 64);
			const base = GAME_HEIGHT - 26;
			midG
				.poly([x - w2 / 2, base, x + w2 / 2, base, x + rng(-6, 6), base - len])
				.fill({ color: wallNear, alpha: 0.24 });
		}
	}

	midC.addChild(midG);

	// ── NEAR layer ───────────────────────────────────────────────────────────
	// Near dark rock silhouettes + columns + vignette + theme details.
	const nearC = new Container();
	const nearG = new Graphics();

	// Near silhouette row (darkest, biggest).
	const nearStep = 110 + 58;
	for (let x = -nearStep / 2; x < worldWidth + nearStep; x += nearStep) {
		const w2 = rng(nearStep * 0.7, nearStep * 1.1);
		const h2 = rng(58 * 0.7, 58 * 1.2);
		const cy = GAME_HEIGHT - 30 - h2 * 0.3;
		nearG.ellipse(x + rng(-nearStep * 0.2, nearStep * 0.2), cy, w2, h2).fill({
			color: wallNear,
			alpha: 0.3,
		});
	}

	// Theme-specific near silhouette details.
	drawNearSilhouettes(
		nearG,
		worldWidth,
		wallFar,
		wallNear,
		wallLight,
		rng,
		style,
	);

	// Rock columns spanning floor to ceiling (kept for all themes; shape varies).
	const colCount = Math.max(1, Math.floor(worldWidth / 700));
	for (let i = 0; i < colCount; i++) {
		const cx = rng(120, worldWidth - 120);
		const cw = rng(26, 44);
		nearG
			.poly([
				cx - cw / 2,
				0,
				cx + cw / 2,
				0,
				cx + cw * 0.32,
				GAME_HEIGHT * 0.5,
				cx + cw / 2,
				GAME_HEIGHT,
				cx - cw / 2,
				GAME_HEIGHT,
				cx - cw * 0.32,
				GAME_HEIGHT * 0.5,
			])
			.fill({ color: wallFar, alpha: 0.16 });
		nearG.rect(cx - cw / 2, 0, 3, GAME_HEIGHT).fill({
			color: wallLight,
			alpha: 0.06,
		});
	}

	// Bottom vignette only (grounds the floor). The top vignette was removed:
	// with the HUD now in a DOM bar above the canvas it just read as a stray
	// dark bar across the top of the play area.
	nearG.rect(0, GAME_HEIGHT - 50, worldWidth, 50).fill({
		color: 0x000000,
		alpha: 0.28,
	});

	nearC.addChild(nearG);

	return { far: farC, mid: midC, near: nearC };
}

/**
 * Draw theme-specific silhouette shapes into the far background layer.
 * Keeps alpha very low so it never competes with gameplay.
 * All variation is deterministic via the passed `rng`.
 */
function drawFarSilhouettes(
	g: Graphics,
	worldWidth: number,
	wallFar: number,
	wallMid: number,
	rng: (a: number, b: number) => number,
	style: ThemeStyle,
): void {
	switch (style) {
		case "blossom": {
			// Soft distant rounded tree-canopy blobs along the floor horizon.
			for (let x = rng(40, 120); x < worldWidth; x += rng(130, 240)) {
				const cw = rng(38, 72);
				const ch = rng(22, 44);
				const base = GAME_HEIGHT - 60;
				g.ellipse(x, base - ch * 0.4, cw, ch).fill({
					color: wallFar,
					alpha: 0.14,
				});
				// Smaller sub-canopy blob.
				g.ellipse(x + rng(-20, 20), base - ch * 0.7, cw * 0.55, ch * 0.55).fill(
					{
						color: wallMid,
						alpha: 0.1,
					},
				);
			}
			break;
		}
		case "crystal": {
			// Faint geode wall texture: irregular faceted surface at the bottom.
			for (let x = rng(30, 100); x < worldWidth; x += rng(80, 150)) {
				const facetW = rng(20, 44);
				const facetH = rng(12, 28);
				const base = GAME_HEIGHT - 55;
				// Irregular hexagon facet.
				g.poly([
					x,
					base - facetH,
					x + facetW * 0.5,
					base - facetH * 0.4,
					x + facetW * 0.4,
					base,
					x - facetW * 0.35,
					base,
					x - facetW * 0.5,
					base - facetH * 0.35,
				]).fill({ color: wallFar, alpha: 0.12 });
			}
			break;
		}
		case "ice": {
			// Faint horizontal ice shelf bands — layered glacier strata.
			for (let yi = 0; yi < 3; yi++) {
				const y = GAME_HEIGHT * 0.25 + yi * (GAME_HEIGHT * 0.18);
				g.rect(0, y, worldWidth, rng(2, 4)).fill({
					color: wallFar,
					alpha: 0.07 + yi * 0.03,
				});
			}
			// Small angular ice block silhouettes along floor.
			for (let x = rng(50, 130); x < worldWidth; x += rng(120, 220)) {
				const bw = rng(22, 48);
				const bh = rng(10, 22);
				const base = GAME_HEIGHT - 55;
				g.roundRect(x - bw * 0.5, base - bh, bw, bh, 2).fill({
					color: wallFar,
					alpha: 0.14,
				});
			}
			break;
		}
		case "crypt": {
			// Distant tombstone / coffin silhouettes along the far floor.
			for (let x = rng(60, 150); x < worldWidth; x += rng(140, 280)) {
				const sw = rng(10, 18);
				const sh = rng(18, 34);
				const base = GAME_HEIGHT - 58;
				// Rounded-top headstone.
				g.roundRect(x - sw * 0.5, base - sh, sw, sh, sw * 0.48).fill({
					color: wallFar,
					alpha: 0.14,
				});
			}
			break;
		}
		case "grove": {
			// Tiny distant mushroom shapes — small dots of cap far back.
			for (let x = rng(40, 100); x < worldWidth; x += rng(90, 180)) {
				const capW = rng(14, 30);
				const capH = rng(8, 16);
				const stemH = rng(10, 20);
				const base = GAME_HEIGHT - 58;
				g.rect(x - capW * 0.08, base - stemH, capW * 0.16, stemH).fill({
					color: wallFar,
					alpha: 0.12,
				});
				g.ellipse(x, base - stemH - capH * 0.3, capW, capH).fill({
					color: wallFar,
					alpha: 0.14,
				});
			}
			break;
		}
		case "molten": {
			// Faint lava pool glow puddles low in the far distance.
			for (let x = rng(50, 150); x < worldWidth; x += rng(180, 360)) {
				const pw = rng(22, 48);
				const base = GAME_HEIGHT - 48;
				g.ellipse(x, base, pw, rng(6, 12)).fill({
					color: 0xff5010,
					alpha: 0.07,
				});
			}
			// Jagged far silhouette rock spires (darker than generic ellipses).
			for (let x = rng(40, 120); x < worldWidth; x += rng(110, 200)) {
				const sw = rng(8, 18);
				const sh = rng(20, 50);
				const base = GAME_HEIGHT - 55;
				g.poly([
					x - sw * 0.5,
					base,
					x + sw * 0.5,
					base,
					x + rng(-4, 4),
					base - sh,
				]).fill({
					color: wallFar,
					alpha: 0.16,
				});
			}
			break;
		}
		default:
			break;
	}
}

/**
 * Draw theme-specific near-layer silhouette shapes. These are the closest
 * (darkest, largest) background elements and sit just behind the gameplay plane.
 * All variation is deterministic via the passed `rng`.
 */
function drawNearSilhouettes(
	g: Graphics,
	worldWidth: number,
	wallFar: number,
	wallNear: number,
	wallLight: number,
	rng: (a: number, b: number) => number,
	style: ThemeStyle,
): void {
	switch (style) {
		case "blossom": {
			// Large near-plane canopy silhouettes framing the cave sides.
			for (let x = rng(60, 160); x < worldWidth; x += rng(200, 380)) {
				const cw = rng(55, 90);
				const ch = rng(35, 60);
				const base = GAME_HEIGHT - 25;
				g.ellipse(x, base - ch * 0.45, cw, ch).fill({
					color: wallNear,
					alpha: 0.22,
				});
				g.ellipse(x - cw * 0.3, base - ch * 0.8, cw * 0.55, ch * 0.5).fill({
					color: wallNear,
					alpha: 0.18,
				});
			}
			break;
		}
		case "crystal": {
			// Large angular crystal shard clusters framing the floor edges.
			for (let x = rng(50, 140); x < worldWidth; x += rng(180, 340)) {
				const shardH = rng(35, 75);
				const shardW = rng(14, 28);
				const base = GAME_HEIGHT - 22;
				// Main shard.
				g.poly([
					x - shardW * 0.5,
					base,
					x + shardW * 0.5,
					base,
					x + shardW * 0.25,
					base - shardH * 0.55,
					x + rng(-5, 5),
					base - shardH,
					x - shardW * 0.2,
					base - shardH * 0.6,
				]).fill({ color: wallNear, alpha: 0.28 });
				// Lit face sliver.
				g.poly([
					x - shardW * 0.5,
					base,
					x - shardW * 0.12,
					base,
					x - shardW * 0.1,
					base - shardH * 0.7,
					x - shardW * 0.2,
					base - shardH * 0.6,
				]).fill({ color: wallLight, alpha: 0.1 });
			}
			break;
		}
		case "ice": {
			// Thick near glacier wall chunks at floor level.
			for (let x = rng(60, 150); x < worldWidth; x += rng(200, 360)) {
				const bw = rng(45, 80);
				const bh = rng(24, 48);
				const base = GAME_HEIGHT - 22;
				// Ice block with angular top face.
				g.poly([
					x - bw * 0.5,
					base,
					x + bw * 0.5,
					base,
					x + bw * 0.45,
					base - bh * 0.6,
					x + bw * 0.2,
					base - bh,
					x - bw * 0.25,
					base - bh,
					x - bw * 0.45,
					base - bh * 0.55,
				]).fill({ color: wallNear, alpha: 0.26 });
				// Glossy highlight across the top.
				g.poly([
					x - bw * 0.25,
					base - bh,
					x + bw * 0.2,
					base - bh,
					x + bw * 0.45,
					base - bh * 0.6,
					x - bw * 0.45,
					base - bh * 0.55,
				]).fill({ color: wallLight, alpha: 0.1 });
			}
			break;
		}
		case "crypt": {
			// Gothic pillar pairs flanking the near plane.
			for (let x = rng(80, 200); x < worldWidth; x += rng(250, 450)) {
				const pillarW = rng(14, 22);
				const pillarH = GAME_HEIGHT * rng(0.55, 0.85);
				const base = GAME_HEIGHT - 20;
				// Left pillar of pair.
				g.roundRect(
					x - pillarW * 1.5,
					base - pillarH,
					pillarW,
					pillarH,
					2,
				).fill({
					color: wallNear,
					alpha: 0.24,
				});
				// Pointed capital at top.
				g.poly([
					x - pillarW * 1.5,
					base - pillarH,
					x - pillarW * 0.5,
					base - pillarH,
					x - pillarW,
					base - pillarH - rng(14, 24),
				]).fill({ color: wallNear, alpha: 0.2 });
				// Right pillar of pair.
				g.roundRect(
					x + pillarW * 0.5,
					base - pillarH,
					pillarW,
					pillarH,
					2,
				).fill({
					color: wallNear,
					alpha: 0.24,
				});
				g.poly([
					x + pillarW * 0.5,
					base - pillarH,
					x + pillarW * 1.5,
					base - pillarH,
					x + pillarW,
					base - pillarH - rng(14, 24),
				]).fill({ color: wallNear, alpha: 0.2 });
			}
			break;
		}
		case "grove": {
			// Large mushroom silhouettes close to the viewer — widest caps.
			for (let x = rng(70, 180); x < worldWidth; x += rng(200, 380)) {
				const stemH = rng(40, 75);
				const capW = rng(55, 95);
				const capH = rng(24, 42);
				const base = GAME_HEIGHT - 22;
				// Stem.
				g.roundRect(x - capW * 0.09, base - stemH, capW * 0.18, stemH, 3).fill({
					color: wallNear,
					alpha: 0.25,
				});
				// Main cap dome.
				g.ellipse(x, base - stemH - capH * 0.35, capW, capH).fill({
					color: wallNear,
					alpha: 0.28,
				});
				// Lighter highlight on top third.
				g.ellipse(
					x - capW * 0.22,
					base - stemH - capH * 0.65,
					capW * 0.5,
					capH * 0.45,
				).fill({
					color: wallLight,
					alpha: 0.08,
				});
				// Blobby organic ceiling bulge above.
				g.ellipse(x, rng(8, 20), rng(24, 44), rng(8, 16)).fill({
					color: wallFar,
					alpha: 0.14,
				});
			}
			break;
		}
		case "molten": {
			// Basalt rock buttresses and glowing seam lines at the near plane.
			for (let x = rng(60, 160); x < worldWidth; x += rng(200, 380)) {
				const bw = rng(30, 55);
				const bh = rng(40, 80);
				const base = GAME_HEIGHT - 22;
				// Rough basalt slab.
				g.poly([
					x - bw * 0.5,
					base,
					x + bw * 0.5,
					base,
					x + bw * 0.4,
					base - bh * 0.45,
					x + bw * 0.15,
					base - bh,
					x - bw * 0.2,
					base - bh * 0.9,
					x - bw * 0.45,
					base - bh * 0.4,
				]).fill({ color: wallNear, alpha: 0.3 });
				// Glowing orange seam crack.
				g.moveTo(x + rng(-5, 5), base - bh * 0.2)
					.lineTo(x + rng(-4, 4), base - bh * 0.7)
					.stroke({ color: 0xff6020, width: rng(1.5, 3), alpha: 0.22 });
			}
			break;
		}
		default:
			break;
	}
}

/**
 * Draw a solid ground strip running along the bottom of the world. The walkable
 * surface sits at `y = GAME_HEIGHT - 30` (matches the {@link GROUND_Y} constant)
 * and the strip fills down to `y = GAME_HEIGHT`.
 *
 * Visual layers (back to front):
 * 1. Body fill — deep rock colour, darkening toward the bottom for depth.
 * 2. Subtle mottled patches — irregular tone variation derived from `wobble`.
 * 3. Lit top rim — a thin bright line tracing the surface edge.
 * 4. A few small surface bumps — gentle silhouette humps via `wobble`.
 * 5. Faint moss fringe — a sparse tuft row just below the rim.
 *
 * All variation is deterministic (no `Math.random`). Structural tones blend
 * toward `accent` (at 40 % weight) when provided, matching the level mood.
 *
 * Only the solid ground `spans` are painted — the gaps between them are left
 * empty so the dark cave background shows through, reading as deep pits. Each
 * span's pit-facing ends are darkened so the drop looks like a real edge.
 *
 * @param spans - Solid ground runs as `{ x, w }` in world px (the level's
 *                ground-segment platforms). Gaps between them stay open as pits.
 * @param accent - Optional theme accent `#rrggbb` to tint the rock tones.
 * @param style - Theme style discriminant driving surface texture. Each value
 *   gives a distinct look: `blossom` grassy + petal flecks; `crystal` rock with
 *   crystal glints; `ice` pale-blue frosted/cracked surface; `crypt` cracked
 *   flagstones with faint moss; `grove` mossy earth + tiny mushroom tufts;
 *   `molten` charred rock with glowing orange seams.
 * @returns A Container with origin at (0,0); position it at (0,0) in world
 *          coords — the strip draws at the correct `y` internally.
 */
export function drawFloorStrip(
	spans: { x: number; w: number }[],
	accent: string | undefined,
	style: ThemeStyle,
): Container {
	const c = new Container();
	const g = new Graphics();

	const surfaceY = GAME_HEIGHT - 30; // walkable surface (= GROUND_Y)
	const stripH = 30; // total strip height down to GAME_HEIGHT

	// Theme-driven body, rim and detail colours.
	// Ice and molten get cooler/warmer base tones; others stay near the generic rock.
	const bodyTop =
		style === "ice"
			? tint("#3a5570", accent, 0.35)
			: style === "molten"
				? tint("#3a1810", accent, 0.45)
				: style === "crypt"
					? tint("#3a3848", accent, 0.4)
					: tint("#4a4060", accent, 0.4);
	const bodyBot =
		style === "ice"
			? tint("#1e3346", accent, 0.35)
			: style === "molten"
				? tint("#1c0c06", accent, 0.45)
				: style === "crypt"
					? tint("#22202e", accent, 0.4)
					: tint("#2a1e38", accent, 0.4);
	const rimCol =
		style === "ice"
			? tint("#b8e8ff", accent, 0.25)
			: style === "molten"
				? tint("#6a4030", accent, 0.4)
				: style === "crypt"
					? tint("#6a6878", accent, 0.35)
					: tint("#7a6e95", accent, 0.35);
	const mottle1 = tint("#3e3558", accent, 0.4);
	const mottle2 = tint("#56486e", accent, 0.35);
	// Near-black for the pit-facing edge shadow so drops read as deep.
	const edgeDark = tint("#0d0716", accent, 0.15);

	const midY = surfaceY + stripH * 0.45;

	for (const span of spans) {
		const sx = span.x;
		const ex = span.x + span.w;
		const sw = span.w;

		// Body: two horizontal bands for a top-to-bottom darkening gradient.
		g.rect(sx, surfaceY, sw, midY - surfaceY).fill(bodyTop);
		g.rect(sx, midY, sw, GAME_HEIGHT - midY).fill(bodyBot);

		// Mottled tone patches — irregular ellipses keyed off absolute x.
		const mottleSpacing = 38;
		for (let x = sx; x < ex; x += mottleSpacing) {
			const mc = Math.floor(x / mottleSpacing) % 2 === 0 ? mottle1 : mottle2;
			const ox = wobble(x, 11, mottleSpacing * 0.3);
			const oy = wobble(x, 13, stripH * 0.22);
			const rw =
				mottleSpacing * 0.55 + Math.abs(wobble(x, 17, mottleSpacing * 0.2));
			const rh = stripH * 0.28 + Math.abs(wobble(x, 19, stripH * 0.1));
			g.ellipse(x + ox, surfaceY + stripH * 0.5 + oy, rw, rh).fill({
				color: mc,
				alpha: 0.38,
			});
		}

		// Surface bump silhouette — small humps just at the surface edge.
		const bumpSpacing = 52;
		for (let x = sx; x < ex; x += bumpSpacing) {
			const bh = 3 + Math.abs(wobble(x, 7, 2.5));
			const bw =
				bumpSpacing * 0.55 + Math.abs(wobble(x, 9, bumpSpacing * 0.18));
			const bx = x + wobble(x, 5, bumpSpacing * 0.22);
			g.ellipse(bx, surfaceY + bh * 0.5, bw, bh).fill({
				color: mottle2,
				alpha: 0.45,
			});
		}

		// Lit top rim — a thin bright stroke tracing the surface edge.
		g.rect(sx, surfaceY, sw, 2).fill({ color: rimCol, alpha: 0.7 });
		g.rect(sx, surfaceY + 2, sw, 1).fill({ color: rimCol, alpha: 0.28 });

		// Pit-facing edge shadow: a dark vertical gradient on each end that borders
		// a gap, so the drop reads as a deep void. The world bounds (x=0 and the
		// far right) are world walls, not pits, so they are left un-shadowed; an
		// edge is treated as a pit edge when it isn't flush with another span.
		const edgeW = 14;
		const leftIsPit = sx > 0.5;
		const rightIsPit = true; // right ends always border a gap or world end
		if (leftIsPit) {
			g.rect(sx, surfaceY, edgeW, stripH).fill({
				color: edgeDark,
				alpha: 0.55,
			});
			g.rect(sx, surfaceY, edgeW * 0.4, stripH).fill({
				color: edgeDark,
				alpha: 0.35,
			});
		}
		if (rightIsPit) {
			g.rect(ex - edgeW, surfaceY, edgeW, stripH).fill({
				color: edgeDark,
				alpha: 0.55,
			});
			g.rect(ex - edgeW * 0.4, surfaceY, edgeW * 0.4, stripH).fill({
				color: edgeDark,
				alpha: 0.35,
			});
		}

		// Theme-specific surface details drawn just below the rim.
		drawFloorSurface(g, sx, ex, surfaceY, accent, style);
	}

	c.addChild(g);
	return c;
}

/**
 * Draw theme-specific surface decoration immediately below the floor rim.
 * Called once per span. All variation is deterministic via {@link wobble}.
 *
 * - `blossom`: green grass blades + small rose petal fleck dots.
 * - `crystal`: faint crystal glint strokes embedded in the rock.
 * - `ice`: pale-blue cracked-ice lines + glossy highlight band.
 * - `crypt`: dark flagstone joint lines + faint grey moss in cracks.
 * - `grove`: dense moss tufts + tiny mushroom cap dots.
 * - `molten`: glowing orange seam lines running along the charred surface.
 */
function drawFloorSurface(
	g: Graphics,
	sx: number,
	ex: number,
	surfaceY: number,
	accent: string | undefined,
	style: ThemeStyle,
): void {
	switch (style) {
		case "blossom": {
			// Grass fringe — small tufts just below the rim.
			const mossCol = tint("#3a5c34", accent, 0.25);
			const mossLit = tint("#4e7a46", accent, 0.25);
			const mossSpacing = 64;
			for (let x = sx + 8; x < ex - 8; x += mossSpacing) {
				const mx = x + wobble(x, 23, mossSpacing * 0.35);
				const mh = 4 + Math.abs(wobble(x, 29, 2));
				g.poly([
					mx - 4,
					surfaceY + 3,
					mx + 4,
					surfaceY + 3,
					mx,
					surfaceY + 3 - mh,
				]).fill({
					color: mossCol,
					alpha: 0.7,
				});
				g.poly([
					mx + 2,
					surfaceY + 3,
					mx + 8,
					surfaceY + 3,
					mx + 5,
					surfaceY + 3 - mh * 0.7,
				]).fill({
					color: mossLit,
					alpha: 0.55,
				});
			}
			// Fallen petal flecks scattered on the surface.
			const petalSpacing = 48;
			for (let x = sx + 12; x < ex - 12; x += petalSpacing) {
				const px = x + wobble(x, 41, petalSpacing * 0.4);
				const pw = 3 + Math.abs(wobble(x, 43, 2));
				g.ellipse(px, surfaceY + 1.5, pw, 1.5).fill({
					color: 0xe88fbc,
					alpha: 0.55,
				});
			}
			break;
		}
		case "crystal": {
			// Embedded crystal glint strokes in the rock surface.
			const glintSpacing = 56;
			for (let x = sx + 14; x < ex - 14; x += glintSpacing) {
				const gx = x + wobble(x, 51, glintSpacing * 0.35);
				const gl = 4 + Math.abs(wobble(x, 53, 3));
				g.moveTo(gx, surfaceY + 2)
					.lineTo(gx + gl, surfaceY + 5)
					.stroke({ color: 0x9de8ff, width: 1.2, alpha: 0.55 });
				// Tiny bright tip dot.
				g.circle(gx + gl, surfaceY + 5, 1.2).fill({
					color: 0xd0f8ff,
					alpha: 0.7,
				});
			}
			break;
		}
		case "ice": {
			// Cracked-ice joint lines across the surface.
			const iceSpacing = 44;
			for (let x = sx + 8; x < ex - 8; x += iceSpacing) {
				const jx = x + wobble(x, 61, iceSpacing * 0.3);
				const jlen =
					iceSpacing * 0.55 + Math.abs(wobble(x, 63, iceSpacing * 0.2));
				g.moveTo(jx, surfaceY + 1)
					.lineTo(jx + jlen * 0.5 + wobble(x, 65, 4), surfaceY + 6)
					.lineTo(jx + jlen, surfaceY + 3)
					.stroke({ color: 0x6ac8e8, width: 0.9, alpha: 0.35 });
			}
			// Glossy highlight band running the full span length.
			g.rect(sx, surfaceY, ex - sx, 1).fill({ color: 0xe8f8ff, alpha: 0.25 });
			break;
		}
		case "crypt": {
			// Flagstone joint lines — evenly spaced dark horizontal-ish cracks.
			const stoneSpacing = 52;
			for (let x = sx + 8; x < ex - 8; x += stoneSpacing) {
				// Vertical joint between stones.
				g.moveTo(x, surfaceY + 2)
					.lineTo(x + wobble(x, 71, 3), surfaceY + 12)
					.stroke({ color: 0x18161e, width: 1, alpha: 0.35 });
			}
			// Faint horizontal joint band.
			g.moveTo(sx, surfaceY + 8)
				.lineTo(ex, surfaceY + 8)
				.stroke({ color: 0x18161e, width: 0.8, alpha: 0.18 });
			// Sparse grey moss in the cracks.
			const mossCol = tint("#2e3832", accent, 0.2);
			const mossSpacing = 80;
			for (let x = sx + 16; x < ex - 16; x += mossSpacing) {
				const mx = x + wobble(x, 77, mossSpacing * 0.3);
				g.ellipse(mx, surfaceY + 9, 6, 2.5).fill({
					color: mossCol,
					alpha: 0.45,
				});
			}
			break;
		}
		case "grove": {
			// Dense moss tufts along the rim.
			const mossCol = tint("#2e5228", accent, 0.3);
			const mossLit = tint("#4a7a3e", accent, 0.3);
			const mossSpacing = 44;
			for (let x = sx + 6; x < ex - 6; x += mossSpacing) {
				const mx = x + wobble(x, 81, mossSpacing * 0.32);
				const mh = 4 + Math.abs(wobble(x, 83, 2.5));
				g.poly([
					mx - 5,
					surfaceY + 3,
					mx + 5,
					surfaceY + 3,
					mx,
					surfaceY + 3 - mh,
				]).fill({
					color: mossCol,
					alpha: 0.75,
				});
				g.poly([
					mx + 1,
					surfaceY + 3,
					mx + 7,
					surfaceY + 3,
					mx + 4,
					surfaceY + 3 - mh * 0.65,
				]).fill({
					color: mossLit,
					alpha: 0.55,
				});
			}
			// Tiny mushroom cap dots poking up along the surface.
			const shroomSpacing = 96;
			for (let x = sx + 24; x < ex - 24; x += shroomSpacing) {
				const mx = x + wobble(x, 89, shroomSpacing * 0.35);
				const cr = 3 + Math.abs(wobble(x, 91, 1.5));
				// Tiny stem.
				g.rect(mx - 0.8, surfaceY - cr * 0.8, 1.6, cr * 0.8).fill({
					color: tint("#c8bf9e", accent, 0.2),
					alpha: 0.7,
				});
				// Cap.
				g.ellipse(mx, surfaceY - cr * 0.8, cr, cr * 0.55).fill({
					color: tint("#7a5e90", accent, 0.3),
					alpha: 0.78,
				});
			}
			break;
		}
		case "molten": {
			// Glowing orange seam lines running along the charred surface.
			const seamSpacing = 60;
			for (let x = sx + 12; x < ex - 12; x += seamSpacing) {
				const sx2 = x + wobble(x, 93, seamSpacing * 0.3);
				const slen =
					seamSpacing * 0.5 + Math.abs(wobble(x, 95, seamSpacing * 0.25));
				g.moveTo(sx2, surfaceY + 2)
					.lineTo(sx2 + slen * 0.6 + wobble(x, 97, 5), surfaceY + 8)
					.lineTo(sx2 + slen, surfaceY + 4)
					.stroke({ color: 0xff6020, width: 1.2, alpha: 0.45 });
				// Bright core of the seam.
				g.moveTo(sx2, surfaceY + 2)
					.lineTo(sx2 + slen * 0.6 + wobble(x, 97, 5), surfaceY + 8)
					.lineTo(sx2 + slen, surfaceY + 4)
					.stroke({ color: 0xffc040, width: 0.6, alpha: 0.35 });
			}
			break;
		}
		default: {
			// Generic fallback: faint moss fringe matching the original look.
			const mossCol = tint("#3a5c34", accent, 0.25);
			const mossLit = tint("#4e7a46", accent, 0.25);
			const mossSpacing = 64;
			for (let x = sx + 8; x < ex - 8; x += mossSpacing) {
				const mx = x + wobble(x, 23, mossSpacing * 0.35);
				const mh = 4 + Math.abs(wobble(x, 29, 2));
				g.poly([
					mx - 4,
					surfaceY + 3,
					mx + 4,
					surfaceY + 3,
					mx,
					surfaceY + 3 - mh,
				]).fill({
					color: mossCol,
					alpha: 0.7,
				});
				g.poly([
					mx + 2,
					surfaceY + 3,
					mx + 8,
					surfaceY + 3,
					mx + 5,
					surfaceY + 3 - mh * 0.7,
				]).fill({
					color: mossLit,
					alpha: 0.55,
				});
			}
		}
	}
}

/**
 * Draw a single platform sprite at local origin (0,0 = top-left), sized
 * `width` x `height`. Replaces the flat `roundRect` look with layered rock
 * detail:
 *
 * 1. Rock body — main fill occupying the full rect, 4 px rounded corners.
 * 2. Lit top edge rim — lighter band along the top ~3 px for a surface highlight.
 * 3. Dark underside shadow band — darker strip along the bottom ~4 px.
 * 4. A couple of deterministic crack/mottle details via `wobble`.
 * 5. A subtle right-side shade strip for 3-D volume.
 *
 * The visual footprint is exactly `width` x `height` — no overhang — so
 * collision rects remain valid. Rounded corners at 4 px.
 *
 * Structural tones blend toward `accent` at 40 % weight when given; glints
 * and cracks are left neutral for readability.
 * Theme-specific body treatment per `style`:
 * - `blossom`/`grove`: mossy stone — earthy brown-grey body + grassy rim tint.
 * - `crystal`: crystal-veined purple rock — lit gem veins on the surface.
 * - `ice`: pale-blue ice slab — glossy top highlight + cracked seam detail.
 * - `crypt`: cracked tomb stone — grey flagstone with dark joint lines.
 * - `molten`: basalt slab — charred dark rock + ember seam along the top rim.
 *
 * @param width - Platform width in pixels.
 * @param height - Platform height in pixels.
 * @param accent - Optional theme accent `#rrggbb` to tint rock fills.
 * @param style - Theme style discriminant driving the platform body look.
 * @returns A Container at local origin (0,0 = top-left corner).
 */
export function drawPlatform(
	width: number,
	height: number,
	accent: string | undefined,
	style: ThemeStyle,
): Container {
	const c = new Container();
	const g = new Graphics();

	const r = 4; // corner radius (matches old roundRect)

	// Theme-driven body, rim and shadow colours.
	const bodyCol =
		style === "ice"
			? tint("#3a5e72", accent, 0.3)
			: style === "molten"
				? tint("#2a1410", accent, 0.45)
				: style === "crypt"
					? tint("#40404e", accent, 0.35)
					: style === "blossom" || style === "grove"
						? tint("#3e4230", accent, 0.38)
						: tint("#4a3a63", accent, 0.4); // crystal + default

	const rimCol =
		style === "ice"
			? tint("#c0e8ff", accent, 0.2)
			: style === "molten"
				? tint("#5a2818", accent, 0.4)
				: style === "crypt"
					? tint("#6a6878", accent, 0.35)
					: style === "blossom" || style === "grove"
						? tint("#6a7a50", accent, 0.35)
						: tint("#7a6e9e", accent, 0.35);

	const shadowCol =
		style === "ice"
			? tint("#1a2e3c", accent, 0.35)
			: style === "molten"
				? tint("#100806", accent, 0.45)
				: style === "crypt"
					? tint("#28262e", accent, 0.4)
					: tint("#2a2040", accent, 0.4);

	const sideShade =
		style === "ice"
			? tint("#2c4c60", accent, 0.35)
			: style === "molten"
				? tint("#200e08", accent, 0.45)
				: style === "crypt"
					? tint("#30303c", accent, 0.4)
					: tint("#3a2c52", accent, 0.4);

	const mottleCol =
		style === "blossom" || style === "grove"
			? tint("#5a6840", accent, 0.35)
			: style === "ice"
				? tint("#4a7890", accent, 0.3)
				: style === "molten"
					? tint("#3a1e14", accent, 0.45)
					: style === "crypt"
						? tint("#505060", accent, 0.35)
						: tint("#5a4e78", accent, 0.35);

	const crackCol =
		style === "molten"
			? tint("#1a0c08", accent, 0.45)
			: tint("#2e2445", accent, 0.4);

	// Body fill.
	g.roundRect(0, 0, width, height, r).fill(bodyCol);

	// Lit top rim (~3 px).
	const rimH = Math.min(3, height * 0.25);
	g.roundRect(0, 0, width, rimH + r, r).fill(rimCol);
	g.rect(0, rimH, width, r).fill(rimCol); // flatten the bottom of the rim cap

	// Dark underside shadow (~4 px).
	const shadowH = Math.min(4, height * 0.3);
	g.roundRect(0, height - shadowH - r, width, shadowH + r, r).fill(shadowCol);
	g.rect(0, height - shadowH - r, width, r).fill(shadowCol);

	// Right-side shade strip for volume.
	const shadeW = Math.min(5, width * 0.06);
	g.roundRect(width - shadeW - r, 0, shadeW + r, height, r).fill({
		color: sideShade,
		alpha: 0.55,
	});
	g.rect(width - shadeW - r, 0, r, height).fill({
		color: sideShade,
		alpha: 0.55,
	});

	// Deterministic mottle patch — one per platform, position keyed on width.
	if (width > 30) {
		const mx = width * 0.3 + wobble(width, 31, width * 0.15);
		const mw = width * 0.28 + Math.abs(wobble(width, 37, width * 0.08));
		const mh = height * 0.45 + Math.abs(wobble(height, 41, height * 0.12));
		g.ellipse(mx, height * 0.5, mw, mh).fill({ color: mottleCol, alpha: 0.28 });
	}

	// Theme-specific surface details on the platform body.
	switch (style) {
		case "ice": {
			// Glossy highlight sweep across the top surface.
			if (width > 16) {
				g.roundRect(width * 0.08, 1, width * 0.55, rimH * 0.7, 2).fill({
					color: 0xe8f8ff,
					alpha: 0.35,
				});
			}
			// Faint cracked-ice seam line.
			if (height >= 8 && width > 20) {
				const crackX = width * 0.45 + wobble(width, 47, width * 0.18);
				const jx = wobble(width, 49, 2.5);
				const crackLen = Math.min(height - 4, 9);
				g.moveTo(crackX, 3)
					.lineTo(crackX + jx * 0.4, 3 + crackLen * 0.5)
					.lineTo(crackX + jx, 3 + crackLen)
					.stroke({
						color: 0x9de8ff,
						width: Math.max(0.6, height * 0.05),
						alpha: 0.4,
					});
			}
			break;
		}
		case "molten": {
			// Glowing ember seam along the top rim.
			if (width > 16) {
				g.rect(width * 0.1, 1, width * 0.8, 1.2).fill({
					color: 0xff6020,
					alpha: 0.55,
				});
				g.rect(width * 0.18, 1, width * 0.62, 0.7).fill({
					color: 0xffc040,
					alpha: 0.4,
				});
			}
			// Short lava crack fissure.
			if (height >= 8 && width > 20) {
				const crackX = width * 0.55 + wobble(width + height, 43, width * 0.2);
				const jx = wobble(width, 47, 3);
				const crackLen = Math.min(height - 4, 10);
				const cw = Math.max(0.6, height * 0.06);
				g.moveTo(crackX, 3)
					.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx, 3 + crackLen)
					.stroke({ color: 0xff6020, width: cw, alpha: 0.55 });
				g.moveTo(crackX, 3)
					.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx, 3 + crackLen)
					.stroke({ color: 0xffc040, width: cw * 0.45, alpha: 0.45 });
			}
			break;
		}
		case "crystal": {
			// Crystal vein strokes across the platform face.
			if (width > 24 && height >= 8) {
				const vx = width * 0.35 + wobble(width, 55, width * 0.18);
				const vlen = Math.min(height - 3, 11);
				g.moveTo(vx, 3)
					.lineTo(vx + wobble(width, 57, 3), 3 + vlen)
					.stroke({
						color: 0x9de8ff,
						width: Math.max(0.8, height * 0.06),
						alpha: 0.5,
					});
				g.circle(vx, 3, Math.max(1, height * 0.07)).fill({
					color: 0xd0f8ff,
					alpha: 0.7,
				});
			}
			break;
		}
		case "crypt": {
			// Flagstone joint line across the top third.
			if (width > 28 && height >= 8) {
				const jointX = width * 0.48 + wobble(width, 61, width * 0.18);
				g.moveTo(jointX, 2)
					.lineTo(jointX + wobble(width, 63, 2), height - 2)
					.stroke({
						color: crackCol,
						width: Math.max(0.7, height * 0.05),
						alpha: 0.35,
					});
			}
			break;
		}
		case "blossom":
		case "grove": {
			// Generic faint crack (the same as default rock) — mossy stone is still stone.
			if (height >= 10) {
				const crackX = width * 0.55 + wobble(width + height, 43, width * 0.2);
				const jx = wobble(width, 47, 3);
				const crackLen = Math.min(height - 4, 10);
				const cw = Math.max(0.6, height * 0.06);
				g.moveTo(crackX, 3)
					.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx, 3 + crackLen)
					.stroke({ color: crackCol, width: cw, alpha: 0.3 });
				g.moveTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx * 0.5 + wobble(width, 53, 3), 3 + crackLen * 0.7)
					.stroke({ color: crackCol, width: cw * 0.6, alpha: 0.22 });
			}
			break;
		}
		default: {
			// Generic rock crack detail.
			if (height >= 10) {
				const crackX = width * 0.55 + wobble(width + height, 43, width * 0.2);
				const jx = wobble(width, 47, 3);
				const crackLen = Math.min(height - 4, 10);
				const cw = Math.max(0.6, height * 0.06);
				g.moveTo(crackX, 3)
					.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx, 3 + crackLen)
					.stroke({ color: crackCol, width: cw, alpha: 0.3 });
				g.moveTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
					.lineTo(crackX + jx * 0.5 + wobble(width, 53, 3), 3 + crackLen * 0.7)
					.stroke({ color: crackCol, width: cw * 0.6, alpha: 0.22 });
			}
		}
	}

	c.addChild(g);
	return c;
}

/**
 * Draw a soft glow cluster at the local origin (centre). Returns a Container
 * so the caller can position it anywhere in the world.
 *
 * The `pulse` parameter (0..1) drives a gentle scale + alpha animation, letting
 * the caller animate the cluster each frame without any wall-clock reads:
 *
 * ```ts
 * // In your update loop (elapsed is a deterministic accumulator):
 * const pulse = (Math.sin(elapsed * 1.8 + phaseOffset) + 1) / 2; // 0..1
 * glowCluster.scale.set(0.92 + pulse * 0.16);
 * glowCluster.alpha   = 0.75 + pulse * 0.25;
 * ```
 *
 * The geometry itself is static (call once, animate via the returned
 * Container's `scale`/`alpha`). Cheap: three layered ellipses + a few
 * crystal facets drawn with Graphics primitives.
 *
 * @param radius - Outer halo radius in pixels.
 * @param color - Packed `0xRRGGBB` glow colour.
 * @param pulse - Initial 0..1 value that sets the starting scale/alpha.
 *                The caller should update `container.scale` and `.alpha`
 *                each frame using the formula above.
 * @returns A Container centred at (0,0) ready to be positioned in the world.
 */
export function drawGlowCluster(
	radius: number,
	color: number,
	pulse: number,
): Container {
	const c = new Container();
	const g = new Graphics();

	// Outer soft halo.
	g.ellipse(0, 0, radius * 1.4, radius).fill({
		color,
		alpha: 0.07 + pulse * 0.04,
	});
	// Mid glow ring.
	g.ellipse(0, 0, radius * 0.9, radius * 0.68).fill({
		color,
		alpha: 0.12 + pulse * 0.06,
	});
	// Bright inner core.
	g.ellipse(0, 0, radius * 0.4, radius * 0.32).fill({
		color,
		alpha: 0.22 + pulse * 0.1,
	});

	// Three small crystal facets scattered around the core.
	const facetOffsets: [number, number, number][] = [
		[0, -radius * 0.28, 0],
		[radius * 0.22, radius * 0.14, 1],
		[-radius * 0.18, radius * 0.18, 2],
	];
	for (const [fx, fy, fi] of facetOffsets) {
		const fs =
			radius * 0.14 + Math.abs(wobble(radius, fi * 7 + 1, radius * 0.04));
		g.poly([
			fx,
			fy - fs,
			fx + fs * 0.55,
			fy,
			fx,
			fy + fs,
			fx - fs * 0.55,
			fy,
		]).fill({
			color,
			alpha: 0.32 + pulse * 0.12,
		});
	}

	// Apply initial pulse as scale + alpha so the container starts at the right state.
	c.scale.set(0.92 + pulse * 0.16);
	c.alpha = 0.75 + pulse * 0.25;

	c.addChild(g);
	return c;
}
