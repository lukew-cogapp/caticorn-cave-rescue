import type { Container, Graphics } from "pixi.js";
import {
	drawBatCat,
	drawCrawlerCat,
	drawLurkerCat,
} from "../../art/themes/cat/monsters";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Kitty Hollow: a cozy warm-ginger cave dressed like an enormous cat playroom.
 * Scratching-post towers and a giant yarn ball fill the far silhouettes; paw
 * prints and a soft carpet stripe run along the floor. Drifting "spore" ambient
 * reads as floating fur motes. Default physics (no mechanic tweaks).
 */
export const catPack: ThemePack = {
	style: "cat",
	name: "Kitty Hollow",
	bg: ["#3a2a22", "#1e1410"],
	accent: "#f0913a",
	ceilingKinds: ["crystal", "crystal", "crack"],
	floorKinds: ["pebble", "moss"],
	ambient: "spore",
	lighting: { color: 0x2a1810, intensity: 0.3 }, // warm cozy amber glow

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		rng: Rng,
	): void {
		// Distant scratching-post silhouettes: a tall narrow post capped with a
		// small platform perch. Also a giant ball-of-yarn in the background.
		for (let x = rng(60, 160); x < worldWidth; x += rng(200, 360)) {
			const postH = rng(50, 90);
			const postW = rng(6, 10);
			const base = GAME_HEIGHT - 58;
			// Post column.
			g.rect(x - postW * 0.5, base - postH, postW, postH).fill({
				color: wallFar,
				alpha: 0.13,
			});
			// Perch platform at the top.
			g.roundRect(x - postW * 1.4, base - postH - 5, postW * 2.8, 5, 2).fill({
				color: wallFar,
				alpha: 0.16,
			});
			// Tiny cat-ear triangles on the perch corners.
			g.poly([
				x - postW * 1.4,
				base - postH - 5,
				x - postW * 1.4 - 4,
				base - postH - 11,
				x - postW * 0.6,
				base - postH - 5,
			]).fill({ color: wallMid, alpha: 0.11 });
			g.poly([
				x + postW * 1.4,
				base - postH - 5,
				x + postW * 1.4 + 4,
				base - postH - 11,
				x + postW * 0.6,
				base - postH - 5,
			]).fill({ color: wallMid, alpha: 0.11 });
		}

		// Giant ball-of-yarn — a large circle in the far background.
		const yarnX = rng(100, worldWidth - 100);
		const yarnR = rng(28, 48);
		const yarnBase = GAME_HEIGHT - 58;
		g.circle(yarnX, yarnBase - yarnR, yarnR).fill({
			color: wallFar,
			alpha: 0.12,
		});
		// Spiral wind lines across the yarn ball (three simple strokes, deterministic).
		for (let i = 0; i < 3; i++) {
			const ox = wobble(yarnX + i * 17, i * 13 + 5, yarnR * 0.55);
			const oy = wobble(yarnX + i * 19, i * 11 + 7, yarnR * 0.4);
			g.moveTo(yarnX + ox - yarnR * 0.35, yarnBase - yarnR + oy)
				.lineTo(yarnX + ox + yarnR * 0.35, yarnBase - yarnR * 0.6 + oy)
				.stroke({ color: wallMid, width: 1.2, alpha: 0.15 });
		}
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): void {
		// Large foreground scratching-post towers — multi-level cat tree with
		// a couple of perch platforms and rope wraps.
		for (let x = rng(80, 200); x < worldWidth; x += rng(260, 420)) {
			const postH = rng(70, 120);
			const postW = rng(9, 14);
			const base = GAME_HEIGHT - 22;
			// Main trunk.
			g.rect(x - postW * 0.5, base - postH, postW, postH).fill({
				color: wallNear,
				alpha: 0.26,
			});
			// Mid-height perch.
			const midY = base - postH * rng(0.45, 0.6);
			g.roundRect(x - postW * 1.8, midY - 5, postW * 3.6, 5, 2).fill({
				color: wallNear,
				alpha: 0.28,
			});
			// Top perch.
			g.roundRect(x - postW * 1.4, base - postH - 5, postW * 2.8, 5, 2).fill({
				color: wallLight,
				alpha: 0.1,
			});
			// Rope wraps: thin horizontal bands evenly spaced.
			const wrapCount = 4;
			for (let w = 0; w < wrapCount; w++) {
				const wy = base - postH * ((w + 1) / (wrapCount + 1));
				g.moveTo(x - postW * 0.5, wy)
					.lineTo(x + postW * 0.5, wy)
					.stroke({ color: wallNear, width: 1.5, alpha: 0.18 });
			}
		}

		// Cat-bed cushion silhouette — low oval puddle near the floor.
		for (let x = rng(120, 300); x < worldWidth; x += rng(350, 550)) {
			const bw = rng(40, 65);
			const bh = rng(10, 16);
			const base = GAME_HEIGHT - 22;
			g.ellipse(x, base - bh * 0.35, bw, bh).fill({
				color: wallNear,
				alpha: 0.2,
			});
			// Rim highlight.
			g.ellipse(x - bw * 0.25, base - bh * 0.5, bw * 0.55, bh * 0.38).fill({
				color: wallLight,
				alpha: 0.07,
			});
		}
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#52392a", accent, 0.38), // warm dark wood / cushion
			rimCol: tint("#7a5a3e", accent, 0.35),
			shadowCol: tint("#2e1c10", accent, 0.42),
			sideShade: tint("#3e2818", accent, 0.4),
			mottleCol: tint("#6a4a32", accent, 0.35),
			crackCol: tint("#241408", accent, 0.4),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
		// Soft cushion / paw-print stamp: a faint round-edged indent (pillow seam)
		// running along the top third, plus a tiny paw-print stamp keyed off width.
		if (height >= 8) {
			// Pillow seam: a rounded highlight strip near the top.
			const seam_y = 3;
			g.roundRect(4, seam_y, width - 8, Math.min(height - 6, 4), 2).fill({
				color: crackCol,
				alpha: 0.18,
			});
		}
		// Paw print: one central pad + three tiny toe-beans, keyed off width/height.
		if (width >= 24) {
			const cx = width * 0.35 + wobble(width, 61, width * 0.15);
			const cy = height * 0.55 + wobble(height, 67, 2);
			const pr = Math.min(3.5, width * 0.06);
			// Central palm pad.
			g.ellipse(cx, cy, pr * 1.2, pr).fill({ color: crackCol, alpha: 0.22 });
			// Three toe-beans above the palm.
			const toeR = pr * 0.55;
			g.circle(cx - pr * 1.1, cy - pr * 1.3, toeR).fill({
				color: crackCol,
				alpha: 0.2,
			});
			g.circle(cx, cy - pr * 1.7, toeR).fill({ color: crackCol, alpha: 0.2 });
			g.circle(cx + pr * 1.1, cy - pr * 1.3, toeR).fill({
				color: crackCol,
				alpha: 0.2,
			});
		}
	},

	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#4a3228", accent, 0.38), // warm terracotta-brown
			bodyBot: tint("#2e1c14", accent, 0.4),
			rimCol: tint("#7a5a42", accent, 0.35),
			mottle1: tint("#3e2a1e", accent, 0.4),
			mottle2: tint("#5e4230", accent, 0.35),
			edgeDark: tint("#120806", accent, 0.15),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void {
		// Soft carpet stripe: a thin warm band just below the rim.
		const carpetCol = tint("#8a4c2a", accent, 0.45);
		const carpetLit = tint("#b0693e", accent, 0.4);
		g.rect(sx, surfaceY + 1, ex - sx, 3).fill({
			color: carpetCol,
			alpha: 0.45,
		});
		// Weave highlight shimmer: short horizontal nubs every ~12px.
		const weaveStep = 12;
		for (let x = sx + 6; x < ex - 6; x += weaveStep) {
			const wx = x + wobble(x, 97, weaveStep * 0.3);
			g.rect(wx, surfaceY + 1, 5, 1).fill({ color: carpetLit, alpha: 0.3 });
		}

		// Scattered yarn balls on the floor: tiny circles with a cross-stroke.
		const yarnSpacing = 110;
		for (let x = sx + 20; x < ex - 20; x += yarnSpacing) {
			const yx = x + wobble(x, 103, yarnSpacing * 0.3);
			const yr = 3.5 + Math.abs(wobble(x, 107, 1.2));
			g.circle(yx, surfaceY - yr, yr).fill({
				color: tint("#d96c3a", accent, 0.35),
				alpha: 0.62,
			});
			// Two cross-strokes to hint at wound yarn.
			g.moveTo(yx - yr * 0.7, surfaceY - yr)
				.lineTo(yx + yr * 0.7, surfaceY - yr)
				.stroke({
					color: tint("#f0a060", accent, 0.3),
					width: 0.8,
					alpha: 0.5,
				});
			g.moveTo(yx, surfaceY - yr * 1.7)
				.lineTo(yx, surfaceY - yr * 0.3)
				.stroke({
					color: tint("#f0a060", accent, 0.3),
					width: 0.8,
					alpha: 0.5,
				});
		}

		// Paw prints scattered along the surface.
		const pawSpacing = 80;
		for (let x = sx + 16; x < ex - 16; x += pawSpacing) {
			const px = x + wobble(x, 113, pawSpacing * 0.35);
			const pawY = surfaceY - 2;
			const pr = 3 + Math.abs(wobble(x, 117, 1));
			const pawCol = tint("#c87040", accent, 0.3);
			// Palm.
			g.ellipse(px, pawY, pr, pr * 0.75).fill({ color: pawCol, alpha: 0.35 });
			// Three toe-beans.
			const toeR = pr * 0.45;
			g.circle(px - pr * 0.9, pawY - pr * 1.1, toeR).fill({
				color: pawCol,
				alpha: 0.32,
			});
			g.circle(px, pawY - pr * 1.45, toeR).fill({ color: pawCol, alpha: 0.32 });
			g.circle(px + pr * 0.9, pawY - pr * 1.1, toeR).fill({
				color: pawCol,
				alpha: 0.32,
			});
		}
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Light cat ears + whiskers on top of the head. Kept subtle — the full
		// cat reskin is task #58. These just hint at the theme without hiding eyes.

		// Cat ears: two small triangles above the head.
		const earH = 6;
		const earW = 4;
		const earSpread = 6;
		// Left ear.
		f.poly([
			-earSpread - earW,
			headY - earH,
			-earSpread + earW,
			headY - earH,
			-earSpread,
			headY - earH - earH,
		]).fill({ color: 0xe07050, alpha: 0.85 });
		// Left ear inner.
		f.poly([
			-earSpread - earW * 0.5,
			headY - earH,
			-earSpread + earW * 0.5,
			headY - earH,
			-earSpread,
			headY - earH - earH * 0.65,
		]).fill({ color: 0xf09070, alpha: 0.7 });
		// Right ear.
		f.poly([
			earSpread - earW,
			headY - earH,
			earSpread + earW,
			headY - earH,
			earSpread,
			headY - earH - earH,
		]).fill({ color: 0xe07050, alpha: 0.85 });
		// Right ear inner.
		f.poly([
			earSpread - earW * 0.5,
			headY - earH,
			earSpread + earW * 0.5,
			headY - earH,
			earSpread,
			headY - earH - earH * 0.65,
		]).fill({ color: 0xf09070, alpha: 0.7 });

		// Whiskers: three lines each side from the cheek area.
		const whiskerY = headY + (kind === "bat" ? -2 : 2);
		const cheekX = kind === "crawler" ? 9 : 8;
		const wCol = 0xf8e0c0;
		// Left side.
		f.moveTo(-cheekX, whiskerY - 2)
			.lineTo(-cheekX - hw * 0.55, whiskerY - 3)
			.stroke({ color: wCol, width: 0.7, alpha: 0.65 });
		f.moveTo(-cheekX, whiskerY + 1)
			.lineTo(-cheekX - hw * 0.6, whiskerY + 1)
			.stroke({ color: wCol, width: 0.7, alpha: 0.65 });
		f.moveTo(-cheekX, whiskerY + 4)
			.lineTo(-cheekX - hw * 0.5, whiskerY + 5)
			.stroke({ color: wCol, width: 0.7, alpha: 0.55 });
		// Right side.
		f.moveTo(cheekX, whiskerY - 2)
			.lineTo(cheekX + hw * 0.55, whiskerY - 3)
			.stroke({ color: wCol, width: 0.7, alpha: 0.65 });
		f.moveTo(cheekX, whiskerY + 1)
			.lineTo(cheekX + hw * 0.6, whiskerY + 1)
			.stroke({ color: wCol, width: 0.7, alpha: 0.65 });
		f.moveTo(cheekX, whiskerY + 4)
			.lineTo(cheekX + hw * 0.5, whiskerY + 5)
			.stroke({ color: wCol, width: 0.7, alpha: 0.55 });

		// Subtle warm-ginger rim glow on the upper body (lurker gets it below).
		if (!isLurker) {
			const rimY = kind === "crawler" ? -22 : -12;
			f.roundRect(-10, rimY - 3, 20, 3, 1.5).fill({
				color: 0xf0913a,
				alpha: 0.15,
			});
		}
	},

	/**
	 * Full cat reskin for all three monster kinds. Replaces the base shape so the
	 * whole monster reads as a cute (but mischievous) ginger cat. Returns `null`
	 * only if `kind` is unrecognised, which never happens in practice.
	 *
	 * All three reskins are deterministic (no `Math.random`/`Date.now`) and stay
	 * within the base kind's gameplay footprint so aabb/stomp feel unchanged:
	 *   - crawler → walking cat, bottom-centre, head clearly on top (stompable)
	 *   - bat     → winged flying cat, bottom-centre, centred flyer
	 *   - lurker  → upside-down ceiling cat, origin at y=0, grows downward
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawCrawlerCat(accent);
		if (kind === "bat") return drawBatCat(accent);
		if (kind === "lurker") return drawLurkerCat(accent);
		return null;
	},
};
