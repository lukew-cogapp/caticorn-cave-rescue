import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { ICE_FRICTION_SCALE } from "../../const";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Glacier Vault: a cold pale-blue cave with jagged glacier walls, angular ice
 * blocks, frosted platforms and falling snow. Slippery: reduced ground friction
 * so the player slides further (reach-neutral — only deceleration is scaled).
 */
export const icePack: ThemePack = {
	style: "ice",
	name: "Glacier Vault",
	bg: ["#16314a", "#0c1b2c"],
	accent: "#9fe0ff",
	ceilingKinds: ["icicle", "icicle", "crystal"],
	floorKinds: ["icicle", "pebble", "pebble"],
	ambient: "snow",
	lighting: { color: 0x081828, intensity: 0.34 }, // cold pale blue wash
	mechanic: { frictionScale: ICE_FRICTION_SCALE },

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
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
		// Jagged glacier ceiling spikes.
		for (let x = rng(50, 120); x < worldWidth; x += rng(90, 180)) {
			const iceW = rng(12, 28);
			const iceLen = rng(30, 72);
			// Blocky angular ice form.
			g.poly([
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
			]).fill({ color: wallMid, alpha: 0.2 });
			g.poly([
				x - iceW,
				0,
				x - iceW * 0.3,
				0,
				x - iceW * 0.1,
				iceLen * 0.7,
				x - iceW * 0.6,
				iceLen * 0.6,
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
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#3a5e72", accent, 0.3),
			rimCol: tint("#c0e8ff", accent, 0.2),
			shadowCol: tint("#1a2e3c", accent, 0.35),
			sideShade: tint("#2c4c60", accent, 0.35),
			mottleCol: tint("#4a7890", accent, 0.3),
			crackCol: tint("#2e2445", accent, 0.4),
		};
	},

	platformSkin(g: Graphics, width: number, height: number): void {
		// Glossy highlight sweep across the top surface.
		if (width > 16) {
			const rimH = Math.min(3, height * 0.25);
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
	},

	floorTones(accent: string | undefined) {
		return {
			bodyTop: tint("#3a5570", accent, 0.35),
			bodyBot: tint("#1e3346", accent, 0.35),
			rimCol: tint("#b8e8ff", accent, 0.25),
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
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Pale blue frosty rim around the body + two small icicle tips + frosted
		// "eyebrow" strokes above the eyes (which are left fully intact below).
		// Rim: a faint icy outline offset just outside the body.
		if (!isLurker) {
			const rimR = kind === "crawler" ? 17 : 12;
			const rimY = kind === "crawler" ? -14 : -12;
			f.ellipse(0, rimY, rimR, rimR - 4).stroke({
				color: "#9fe0ff",
				width: 1.2,
				alpha: 0.5,
			});
		} else {
			f.roundRect(-16, 5, 32, 24, 12).stroke({
				color: "#9fe0ff",
				width: 1.2,
				alpha: 0.5,
			});
		}
		// Icicle tips: two small downward triangles flanking the body.
		const icicleY = isLurker ? 28 : headY + 4;
		const icicleDir = isLurker ? 1 : -1; // lurker icicles point down (positive y)
		for (const ix of [-hw + 4, hw - 4]) {
			// Triangle: base at icicleY, tip 6px in icicleDir direction.
			f.poly([
				ix - 2,
				icicleY,
				ix + 2,
				icicleY,
				ix,
				icicleY + icicleDir * 6,
			]).fill({ color: "#c8f0ff", alpha: 0.8 });
		}
		// Frosted "eyebrow" streaks just above the eye positions.
		// Crawler eyes at y≈-13; bat eyes at y≈-13; lurker eyes at y≈16.
		const eyeY = isLurker ? 14 : -15;
		for (const ex of [-5, 6]) {
			f.moveTo(ex - 3, eyeY)
				.lineTo(ex + 3, eyeY)
				.stroke({ color: "#c8f0ff", width: 1, alpha: 0.65, cap: "round" });
		}
	},
};
