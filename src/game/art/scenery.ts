import { Container, Graphics } from "pixi.js";
import {
	defaultFloorTones,
	defaultPlatformTones,
	drawDefaultFloorSurface,
	drawDefaultPlatformSkin,
} from "../level/theme-pack";
import { getThemePack, type ThemeStyle } from "../level/themes";
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

	// Theme-specific far silhouette pass — subtle backdrop shapes. Absent →
	// nothing extra (the generic far rock row above already drew); consumes no RNG.
	const farPack = getThemePack(style);
	farPack.farSilhouettes?.(farG, worldWidth, wallFar, wallMid, rng);

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

	// Theme-specific mid-layer details replace the generic stalactite row. The
	// pack returns whether the shared distant-stalagmite row should still draw
	// (grove suppresses it). Absent → behaves as if it returned `true` (keep the
	// shared stalagmite row, add no extra ceiling art); consumes no RNG.
	const midPack = getThemePack(style);
	const drawStalagmites = midPack.midDetails
		? midPack.midDetails(
				midG,
				worldWidth,
				wallFar,
				wallMid,
				wallNear,
				wallLight,
				rng,
			)
		: true;

	// Distant stalagmite silhouettes (shared across non-grove styles; grove omits).
	if (drawStalagmites) {
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

	// Theme-specific near silhouette details. Absent → nothing extra (the generic
	// near rock row above already drew); consumes no RNG.
	const nearPack = getThemePack(style);
	nearPack.nearSilhouettes?.(
		nearG,
		worldWidth,
		wallFar,
		wallNear,
		wallLight,
		rng,
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

	// Theme-driven body, rim and detail tones (from the pack, blended toward
	// accent). Absent floorTones → generic neutral rock floor.
	const pack = getThemePack(style);
	const { bodyTop, bodyBot, rimCol, mottle1, mottle2, edgeDark } =
		pack.floorTones ? pack.floorTones(accent) : defaultFloorTones(accent);

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

		// Theme-specific surface details drawn just below the rim. Absent → the
		// generic sparse moss-tuft fringe.
		if (pack.floorSurface) {
			pack.floorSurface(g, sx, ex, surfaceY, accent);
		} else {
			drawDefaultFloorSurface(g, sx, ex, surfaceY, accent);
		}
	}

	c.addChild(g);
	return c;
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

	// Theme-driven body, rim, shadow and detail tones (from the pack). Absent
	// platformTones → generic neutral rock palette.
	const pack = getThemePack(style);
	const { bodyCol, rimCol, shadowCol, sideShade, mottleCol, crackCol } =
		pack.platformTones
			? pack.platformTones(accent)
			: defaultPlatformTones(accent);

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

	// Theme-specific surface details on the platform body. Absent → the generic
	// hairline rock crack.
	if (pack.platformSkin) {
		pack.platformSkin(g, width, height, crackCol);
	} else {
		drawDefaultPlatformSkin(g, width, height, crackCol);
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
