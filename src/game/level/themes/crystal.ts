import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Crystal Cavern: a cool violet shimmer cave with clustered angular crystal
 * shard / geode silhouettes, gem-veined platforms and twinkling gem sparkle
 * motes. Default physics (no mechanic tweaks).
 */
export const crystalPack: ThemePack = {
	style: "crystal",
	name: "Crystal Cavern",
	bg: ["#221a3e", "#100a22"],
	accent: "#9b8bff",
	ceilingKinds: ["gemcluster", "gemcluster", "crystal"],
	floorKinds: ["gemcluster", "crystal", "pebble"],
	ambient: "gemsparkle",
	lighting: { color: 0x1a0a38, intensity: 0.36 }, // cool violet shimmer

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
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
	},

	midDetails(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallMid: number,
		_wallNear: number,
		wallLight: number,
		rng: Rng,
	): boolean {
		// Angular crystal shards jutting from ceiling.
		for (let x = rng(60, 140); x < worldWidth; x += rng(100, 200)) {
			const shardW = rng(6, 14);
			const shardLen = rng(25, 65);
			const tipX = x + rng(-8, 8);
			g.poly([x - shardW, 0, x + shardW, 0, tipX, shardLen]).fill({
				color: wallMid,
				alpha: 0.22,
			});
			// Lit sliver on left face.
			g.poly([
				x - shardW,
				0,
				x - shardW * 0.2,
				0,
				tipX - shardW * 0.15,
				shardLen * 0.85,
				tipX,
				shardLen,
			]).fill({ color: wallLight, alpha: 0.1 });
		}
		return true;
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): void {
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
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#4a3a63", accent, 0.4), // crystal + default
			rimCol: tint("#7a6e9e", accent, 0.35),
			shadowCol: tint("#2a2040", accent, 0.4),
			sideShade: tint("#3a2c52", accent, 0.4),
			mottleCol: tint("#5a4e78", accent, 0.35),
			crackCol: tint("#2e2445", accent, 0.4),
		};
	},

	platformSkin(g: Graphics, width: number, height: number): void {
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
	},

	floorTones(accent: string | undefined) {
		return {
			bodyTop: tint("#4a4060", accent, 0.4),
			bodyBot: tint("#2a1e38", accent, 0.4),
			rimCol: tint("#7a6e95", accent, 0.35),
			mottle1: tint("#3e3558", accent, 0.4),
			mottle2: tint("#56486e", accent, 0.35),
			edgeDark: tint("#0d0716", accent, 0.15),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		_accent: string | undefined,
	): void {
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
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		_kind: "crawler" | "bat" | "lurker",
		_isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Three small crystal shards growing from the back/shoulders + gem glints.
		// Shard positions: centre-top and two sides.
		const shards: [number, number, number][] = [
			// [x, baseY, height]
			[0, headY + 2, 8],
			[-hw + 2, headY + 4, 5],
			[hw - 2, headY + 4, 5],
		];
		for (const [sx, sy, sh] of shards) {
			// Shard: a slim triangle, pale lavender with a bright edge.
			f.poly([sx - 2, sy, sx + 2, sy, sx, sy - sh]).fill({
				color: "#c0aaff",
				alpha: 0.75,
			});
			f.moveTo(sx - 2, sy)
				.lineTo(sx, sy - sh)
				.stroke({ color: "#e8dcff", width: 0.8, cap: "round", alpha: 0.9 });
		}
		// Two gem-glint sparkles: a tiny four-point star shape (two crossed lines).
		const glints: [number, number][] = [
			[-hw + 6, headY - 2],
			[hw - 6, headY - 2],
		];
		for (const [gx, gy] of glints) {
			f.moveTo(gx - 2, gy)
				.lineTo(gx + 2, gy)
				.stroke({ color: "#ffffff", width: 1, alpha: 0.85 });
			f.moveTo(gx, gy - 2)
				.lineTo(gx, gy + 2)
				.stroke({ color: "#ffffff", width: 1, alpha: 0.85 });
		}
	},
};
