import type { Container, Graphics } from "pixi.js";
import {
	drawLeafBat,
	drawMushroomCrawler,
	drawSporePodLurker,
} from "../../art/themes/grove/monsters";
import { tint, wobble } from "../../art/util";
import { GROVE_BOUNCE_MIN_SPEED, GROVE_BOUNCE_VELOCITY } from "../../const";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Mushroom Grove: a humid deep-teal cave with big mushroom silhouettes, organic
 * blobby walls, mossy floors and drifting spores. Bouncy ground: landing on the
 * ground floor gives a small springy hop (reach-neutral — far weaker than a jump).
 */
export const grovePack: ThemePack = {
	style: "grove",
	name: "Mushroom Grove",
	bg: ["#16321f", "#0a1a11"],
	accent: "#5fd07a",
	ceilingKinds: ["crystal", "crack"],
	floorKinds: ["mushroom", "mushroom", "moss"],
	ambient: "spore",
	lighting: { color: 0x051a10, intensity: 0.38 }, // deep teal-green
	mechanic: {
		groundBounceVelocity: GROVE_BOUNCE_VELOCITY,
		groundBounceMinSpeed: GROVE_BOUNCE_MIN_SPEED,
	},

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
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
		// Large mushroom cap silhouettes in the mid distance.
		for (let x = rng(60, 140); x < worldWidth; x += rng(120, 240)) {
			const stemH = rng(28, 55);
			const capW = rng(30, 60);
			const capH = rng(16, 28);
			const base = GAME_HEIGHT - 26;
			// Stem.
			g.rect(x - capW * 0.1, base - stemH, capW * 0.2, stemH).fill({
				color: wallMid,
				alpha: 0.2,
			});
			// Dome cap.
			g.ellipse(x, base - stemH - capH * 0.4, capW, capH).fill({
				color: wallMid,
				alpha: 0.24,
			});
			g.ellipse(
				x - capW * 0.2,
				base - stemH - capH * 0.6,
				capW * 0.5,
				capH * 0.55,
			).fill({ color: wallLight, alpha: 0.08 });
		}
		// No standard stalactites in grove — organic blobby ceiling bulges instead.
		for (let x = rng(80, 180); x < worldWidth; x += rng(130, 240)) {
			const blobW = rng(20, 40);
			const blobH = rng(10, 26);
			g.ellipse(x, blobH * 0.5, blobW, blobH).fill({
				color: wallMid,
				alpha: 0.18,
			});
		}
		// Grove omits the shared distant stalagmite row.
		return false;
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): void {
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
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		_kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// A small mushroom cap sitting on top of the head + a moss-green tuft.
		// Mushroom stem.
		f.roundRect(-2, headY - 5, 4, 5, 1).fill("#d4b483");
		// Cap: a semicircle-ish rounded blob, red with white spots.
		f.ellipse(0, headY - 6, 8, 5).fill("#c0392b");
		f.ellipse(0, headY - 7, 8, 3).fill("#e05a4a");
		// Two white spots on the cap (fixed positions, deterministic).
		f.circle(-3, headY - 7, 1.5).fill({ color: "#ffffff", alpha: 0.9 });
		f.circle(3, headY - 7, 1.2).fill({ color: "#ffffff", alpha: 0.9 });
		// Tiny moss tuft: three small rounded bumps on one shoulder.
		const mossX = isLurker ? -12 : -hw + 2;
		const mossY = isLurker ? 10 : headY + 6;
		for (let i = 0; i < 3; i++) {
			f.ellipse(mossX + i * 4, mossY, 2.5, 2).fill({
				color: "#4aab5e",
				alpha: 0.85,
			});
		}
	},

	/**
	 * Full per-kind monster reskins for the Mushroom Grove:
	 *   - crawler → walking mushroom creature (domed spotted cap, stubby legs,
	 *               eyes under the cap rim — head on top for clear stomp read)
	 *   - bat     → flitting leaf/seed-pod (two leaf wings, pod body, vein detail)
	 *   - lurker  → hanging spore-pod fungus cluster (grown DOWNWARD from y=0,
	 *               bioluminescent spots, root tendrils, eyes at y=16)
	 *
	 * All three keep the base gameplay footprint and origin conventions. When this
	 * hook fires, `monsterFlourish` is skipped entirely. Deterministic — no
	 * `Math.random`.
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawMushroomCrawler(accent);
		if (kind === "bat") return drawLeafBat(accent);
		if (kind === "lurker") return drawSporePodLurker(accent);
		return null;
	},
};
