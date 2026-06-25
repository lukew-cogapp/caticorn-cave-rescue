import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { MOLTEN_SPIKE_DENSITY } from "../../const";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Molten Hollow: a hot orange-red cave with basalt columns, glowing lava
 * fissures, charred ember-seamed platforms and rising embers. Hazard-dense: an
 * extra ceiling-spike pass at high probability (reach-neutral — forced jump arcs
 * stay clear via the existing exclusion zones).
 */
export const moltenPack: ThemePack = {
	style: "molten",
	name: "Molten Hollow",
	bg: ["#3a1410", "#1c0806"],
	accent: "#ff7a3b",
	ceilingKinds: ["emberrock", "crack"],
	floorKinds: ["emberrock", "emberrock", "pebble"],
	ambient: "ember",
	lighting: { color: 0x2a0a04, intensity: 0.3 }, // warm orange-red glow
	mechanic: { spikeDensity: MOLTEN_SPIKE_DENSITY },

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
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
	},

	midDetails(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		_wallMid: number,
		wallNear: number,
		_wallLight: number,
		rng: Rng,
	): boolean {
		// Jagged magma-column / basalt vent silhouettes from floor.
		for (let x = rng(80, 180); x < worldWidth; x += rng(150, 280)) {
			const colW = rng(14, 26);
			const colH = rng(30, 70);
			const base = GAME_HEIGHT - 26;
			g.poly([
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
			]).fill({ color: wallNear, alpha: 0.22 });
		}
		// Glowing lava crack accent lines in far layer (faint).
		for (let x = rng(60, 180); x < worldWidth; x += rng(200, 380)) {
			const crackH = rng(12, 30);
			const base = GAME_HEIGHT - 20;
			g.moveTo(x + rng(-6, 6), base)
				.lineTo(x + rng(-4, 4), base - crackH)
				.stroke({ color: 0xff6020, width: rng(1.2, 2.5), alpha: 0.18 });
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
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#2a1410", accent, 0.45),
			rimCol: tint("#5a2818", accent, 0.4),
			shadowCol: tint("#100806", accent, 0.45),
			sideShade: tint("#200e08", accent, 0.45),
			mottleCol: tint("#3a1e14", accent, 0.45),
			crackCol: tint("#1a0c08", accent, 0.45),
		};
	},

	platformSkin(g: Graphics, width: number, height: number): void {
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
	},

	floorTones(accent: string | undefined) {
		return {
			bodyTop: tint("#3a1810", accent, 0.45),
			bodyBot: tint("#1c0c06", accent, 0.45),
			rimCol: tint("#6a4030", accent, 0.4),
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
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		_headY: number,
		_hw: number,
	): void {
		// Glowing ember crack lines on the body + a hot orange under-glow halo.
		// Under-glow: a warm ellipse below the monster (acts as ground bounce light).
		const glowY = isLurker ? 30 : 0;
		f.ellipse(0, glowY, 18, 5).fill({ color: 0xff5500, alpha: 0.18 });
		// Crack lines: three short irregular strokes across the body.
		// Fixed crack paths (deterministic geometry, no Math.random).
		const cracks: [number, number, number, number][] = [
			// [x1, y1, x2, y2] in monster space
			...(isLurker
				? [
						[-6, 10, -2, 18] as [number, number, number, number],
						[2, 12, 6, 22] as [number, number, number, number],
						[-3, 20, 3, 26] as [number, number, number, number],
					]
				: kind === "crawler"
					? [
							[-8, -18, -3, -10] as [number, number, number, number],
							[2, -20, 6, -14] as [number, number, number, number],
							[-2, -12, 4, -8] as [number, number, number, number],
						]
					: [
							[-4, -18, 0, -12] as [number, number, number, number],
							[0, -16, 4, -10] as [number, number, number, number],
							[-2, -10, 2, -6] as [number, number, number, number],
						]),
		];
		for (const [x1, y1, x2, y2] of cracks) {
			// Dark outer crack.
			f.moveTo(x1, y1)
				.lineTo(x2, y2)
				.stroke({ color: "#1a0800", width: 2, cap: "round", alpha: 0.7 });
			// Bright inner ember glow.
			f.moveTo(x1, y1)
				.lineTo(x2, y2)
				.stroke({ color: "#ff8833", width: 0.8, cap: "round", alpha: 0.85 });
		}
		// Two tiny bright ember dots at crack terminations.
		f.circle(cracks[0][2], cracks[0][3], 1.5).fill({
			color: "#ffcc44",
			alpha: 0.9,
		});
		f.circle(cracks[1][2], cracks[1][3], 1.2).fill({
			color: "#ffcc44",
			alpha: 0.85,
		});
	},
};
