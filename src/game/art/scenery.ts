import { Container, Graphics } from "pixi.js";
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
		// Tapered multi-segment spire hanging DOWN from the ceiling (y=0).
		const seg = 3 + (Math.floor(s) % 2); // 3-4 segments from size.
		const tipX = wobble(s, 3, s * 0.18); // gentle lean.
		addSpire(
			g,
			s * 0.5,
			s * 2,
			1,
			tipX,
			seg,
			tintStr("#5f5780", accent, 0.4),
			tintStr("#4a4360", accent, 0.4),
			tintStr("#332e47", accent, 0.4),
		);
		// Wet drip glint near the tip.
		g.circle(tipX, s * 1.82, s * 0.07).fill({ color: 0xbdb2e0, alpha: 0.8 });
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

	// Soft top + bottom vignette for cave depth.
	g.rect(0, 0, worldWidth, 40).fill({ color: 0x000000, alpha: 0.22 });
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
 * const layers = drawBackgroundLayers(worldWidth, level.bg, level.themeAccent);
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
 *
 * @param worldWidth - Total world width in pixels; all layers span it.
 * @param bg - Two-stop `[top, bottom]` gradient as `#rrggbb` strings.
 * @param accent - Optional theme accent `#rrggbb` to tint glow clusters.
 * @returns `{ far, mid, near }` Containers ready for the world.
 */
export function drawBackgroundLayers(
	worldWidth: number,
	bg: [string, string],
	accent?: string,
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

	farC.addChild(farG);

	// ── MID layer ────────────────────────────────────────────────────────────
	// Mid rock silhouettes + distant stalactites/stalagmites.
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

	// Distant stalactite silhouettes.
	for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
		const w2 = rng(10, 22);
		const len = rng(28, 70);
		midG.poly([x - w2 / 2, 0, x + w2 / 2, 0, x + rng(-6, 6), len]).fill({
			color: wallMid,
			alpha: 0.22,
		});
	}

	// Distant stalagmite silhouettes.
	for (let x = rng(80, 180); x < worldWidth; x += rng(140, 260)) {
		const w2 = rng(14, 28);
		const len = rng(30, 64);
		const base = GAME_HEIGHT - 26;
		midG
			.poly([x - w2 / 2, base, x + w2 / 2, base, x + rng(-6, 6), base - len])
			.fill({ color: wallNear, alpha: 0.24 });
	}

	midC.addChild(midG);

	// ── NEAR layer ───────────────────────────────────────────────────────────
	// Near dark rock silhouettes + columns + vignette.
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

	// Rock columns spanning floor to ceiling.
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

	// Vignette.
	nearG.rect(0, 0, worldWidth, 40).fill({ color: 0x000000, alpha: 0.22 });
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
 * @param worldWidth - Total world width in pixels the strip spans.
 * @param accent - Optional theme accent `#rrggbb` to tint the rock tones.
 * @returns A Container with origin at (0,0); position it so it sits at (0,0)
 *          in world coords — the strip itself draws at the correct `y`.
 */
export function drawFloorStrip(worldWidth: number, accent?: string): Container {
	const c = new Container();
	const g = new Graphics();

	const surfaceY = GAME_HEIGHT - 30; // walkable surface (= GROUND_Y)
	const stripH = 30; // total strip height down to GAME_HEIGHT

	// Base rock colours, optionally tinted toward accent.
	const bodyTop = tint("#4a4060", accent, 0.4);
	const bodyBot = tint("#2a1e38", accent, 0.4);
	const rimCol = tint("#7a6e95", accent, 0.35);
	const mottle1 = tint("#3e3558", accent, 0.4);
	const mottle2 = tint("#56486e", accent, 0.35);
	const mossCol = tint("#3a5c34", accent, 0.25);
	const mossLit = tint("#4e7a46", accent, 0.25);

	// Body: two horizontal bands for a top-to-bottom darkening gradient.
	const midY = surfaceY + stripH * 0.45;
	g.rect(0, surfaceY, worldWidth, midY - surfaceY).fill(bodyTop);
	g.rect(0, midY, worldWidth, GAME_HEIGHT - midY).fill(bodyBot);

	// Mottled tone patches — irregular ellipses keyed off x position.
	const mottleSpacing = 38;
	for (let x = 0; x < worldWidth; x += mottleSpacing) {
		// Alternate between two mottle colours deterministically.
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

	// Surface bump silhouette — a row of small humps just at the surface edge.
	const bumpSpacing = 52;
	for (let x = 0; x < worldWidth; x += bumpSpacing) {
		const bh = 3 + Math.abs(wobble(x, 7, 2.5));
		const bw = bumpSpacing * 0.55 + Math.abs(wobble(x, 9, bumpSpacing * 0.18));
		const bx = x + wobble(x, 5, bumpSpacing * 0.22);
		// Hump sits just below the rim so it reads as surface texture.
		g.ellipse(bx, surfaceY + bh * 0.5, bw, bh).fill({
			color: mottle2,
			alpha: 0.45,
		});
	}

	// Lit top rim — a thin bright stroke tracing the surface edge.
	g.rect(0, surfaceY, worldWidth, 2).fill({ color: rimCol, alpha: 0.7 });
	// A slightly dimmer sub-rim for a subtle two-tone bevel feel.
	g.rect(0, surfaceY + 2, worldWidth, 1).fill({ color: rimCol, alpha: 0.28 });

	// Moss fringe — sparse small tufts sitting just below the rim.
	const mossSpacing = 64;
	for (let x = 8; x < worldWidth - 8; x += mossSpacing) {
		const mx = x + wobble(x, 23, mossSpacing * 0.35);
		const mh = 4 + Math.abs(wobble(x, 29, 2));
		// Two-triangle tuft.
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
 *
 * @param width - Platform width in pixels.
 * @param height - Platform height in pixels.
 * @param accent - Optional theme accent `#rrggbb` to tint rock fills.
 * @returns A Container at local origin (0,0 = top-left corner).
 */
export function drawPlatform(
	width: number,
	height: number,
	accent?: string,
): Container {
	const c = new Container();
	const g = new Graphics();

	const r = 4; // corner radius (matches old roundRect)

	// Rock fill colours — all tinted toward accent.
	const bodyCol = tint("#4a3a63", accent, 0.4);
	const rimCol = tint("#7a6e9e", accent, 0.35);
	const shadowCol = tint("#2a2040", accent, 0.4);
	const sideShade = tint("#3a2c52", accent, 0.4);
	const mottleCol = tint("#5a4e78", accent, 0.35);
	const crackCol = tint("#2e2445", accent, 0.4);

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

	// Crack detail — a short hairline fissure, position and lean from width+height.
	if (height >= 10) {
		const crackX = width * 0.55 + wobble(width + height, 43, width * 0.2);
		const jx = wobble(width, 47, 3);
		const crackLen = Math.min(height - 4, 10);
		const cw = Math.max(0.6, height * 0.06);
		g.moveTo(crackX, 3)
			.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
			.lineTo(crackX + jx, 3 + crackLen)
			.stroke({ color: crackCol, width: cw, alpha: 0.3 });
		// Thin branch.
		g.moveTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
			.lineTo(crackX + jx * 0.5 + wobble(width, 53, 3), 3 + crackLen * 0.7)
			.stroke({ color: crackCol, width: cw * 0.6, alpha: 0.22 });
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
