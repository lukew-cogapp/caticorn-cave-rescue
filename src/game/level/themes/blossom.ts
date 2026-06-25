import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Cherry Blossom Hollow: a soft warm-pink dusk cave with cherry-blossom shrubs,
 * rounded tree-canopy silhouettes, grassy floors and drifting petals. Default
 * physics (no mechanic tweaks).
 */
export const blossomPack: ThemePack = {
	style: "blossom",
	name: "Cherry Blossom Hollow",
	bg: ["#3a2030", "#1e1018"],
	accent: "#ff9ec9",
	ceilingKinds: ["blossom", "blossom", "crystal"],
	floorKinds: ["blossom", "moss", "pebble"],
	ambient: "petal",
	lighting: { color: 0x3a1028, intensity: 0.32 }, // warm pink dusk

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		rng: Rng,
	): void {
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
			g.ellipse(x + rng(-20, 20), base - ch * 0.7, cw * 0.55, ch * 0.55).fill({
				color: wallMid,
				alpha: 0.1,
			});
		}
	},

	midDetails(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallMid: number,
		_wallNear: number,
		_wallLight: number,
		rng: Rng,
	): boolean {
		// Hanging branch silhouettes instead of stalactites.
		for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
			const branchW = rng(18, 38);
			const dropLen = rng(22, 52);
			// Curved organic branch drooping from ceiling.
			g.moveTo(x - branchW * 0.5, 0)
				.quadraticCurveTo(x, dropLen * 0.55, x + branchW * 0.4, dropLen)
				.stroke({ color: wallMid, width: rng(2.5, 4.5), alpha: 0.2 });
			// Small foliage blob at the tip.
			g.ellipse(x + branchW * 0.4, dropLen, rng(8, 16), rng(5, 10)).fill({
				color: wallMid,
				alpha: 0.18,
			});
		}
		return true;
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		_wallLight: number,
		rng: Rng,
	): void {
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
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#3e4230", accent, 0.38), // mossy stone
			rimCol: tint("#6a7a50", accent, 0.35),
			shadowCol: tint("#2a2040", accent, 0.4),
			sideShade: tint("#3a2c52", accent, 0.4),
			mottleCol: tint("#5a6840", accent, 0.35),
			crackCol: tint("#2e2445", accent, 0.4),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
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
		accent: string | undefined,
	): void {
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
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		_hw: number,
	): void {
		// A tiny five-petal bloom on the head + a soft pink halo ring.
		// Petals at fixed angles (72° apart) — no trig needed, use poly points.
		// Halo: faint pink ring around the head.
		f.circle(0, headY, 7).stroke({ color: "#ffb8d8", width: 1, alpha: 0.5 });
		// Five petals using pre-computed unit positions * 4.5px radius.
		// angles: 90°, 162°, 234°, 306°, 18° (offset so top petal is up).
		// cos/sin constants (exact for 72° step, starting at -90°):
		const petalOffsets: [number, number][] = [
			[0, -4.5],
			[4.28, -1.39],
			[2.65, 3.64],
			[-2.65, 3.64],
			[-4.28, -1.39],
		];
		for (const [px, py] of petalOffsets) {
			f.ellipse(px, headY + py, 2.2, 1.4).fill({
				color: "#ffcce5",
				alpha: 0.88,
			});
		}
		// Golden centre.
		f.circle(0, headY, 1.8).fill("#ffe680");
		// Soft pink edge glow on the body outline.
		if (!isLurker) {
			// Crawler: rim along the top blob; bat: rim along the body ellipse.
			const rimY = kind === "crawler" ? -22 : -12;
			f.roundRect(-10, rimY - 3, 20, 4, 2).fill({
				color: "#ff9ec9",
				alpha: 0.18,
			});
		}
	},
};
