import type { Container, Graphics } from "pixi.js";
import {
	drawGhostBat,
	drawSkeletonCrawler,
	drawWraithLurker,
} from "../../art/themes/crypt/monsters";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Spectre Crypt: an eerie sickly-green tomb with gothic arches, pillars, distant
 * tombstone silhouettes, cracked flagstones and drifting fog. Slightly darker
 * lighting. Default physics (no mechanic tweaks).
 */
export const cryptPack: ThemePack = {
	style: "crypt",
	name: "Spectre Crypt",
	bg: ["#202430", "#0e1016"],
	accent: "#7faf8c",
	ceilingKinds: ["web", "web", "crack"],
	floorKinds: ["gravestone", "gravestone", "pebble"],
	ambient: "fog",
	lighting: { color: 0x071510, intensity: 0.46 }, // sickly green, eerier

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
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
		// Gothic arch / pillar silhouettes hanging from ceiling.
		for (let x = rng(80, 160); x < worldWidth; x += rng(140, 260)) {
			const archW = rng(18, 32);
			const archH = rng(40, 80);
			const pillarW = archW * 0.28;
			// Left pillar.
			g.rect(x - archW * 0.5, 0, pillarW, archH * 0.7).fill({
				color: wallMid,
				alpha: 0.2,
			});
			// Right pillar.
			g.rect(x + archW * 0.5 - pillarW, 0, pillarW, archH * 0.7).fill({
				color: wallMid,
				alpha: 0.2,
			});
			// Pointed arch connecting them.
			g.moveTo(x - archW * 0.5, 0)
				.quadraticCurveTo(x - archW * 0.5, archH, x, archH * 0.55)
				.quadraticCurveTo(x + archW * 0.5, archH, x + archW * 0.5, 0)
				.fill({ color: wallMid, alpha: 0.15 });
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
		// Gothic pillar pairs flanking the near plane.
		for (let x = rng(80, 200); x < worldWidth; x += rng(250, 450)) {
			const pillarW = rng(14, 22);
			const pillarH = GAME_HEIGHT * rng(0.55, 0.85);
			const base = GAME_HEIGHT - 20;
			// Left pillar of pair.
			g.roundRect(x - pillarW * 1.5, base - pillarH, pillarW, pillarH, 2).fill({
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
			g.roundRect(x + pillarW * 0.5, base - pillarH, pillarW, pillarH, 2).fill({
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
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#40404e", accent, 0.35),
			rimCol: tint("#6a6878", accent, 0.35),
			shadowCol: tint("#28262e", accent, 0.4),
			sideShade: tint("#30303c", accent, 0.4),
			mottleCol: tint("#505060", accent, 0.35),
			crackCol: tint("#2e2445", accent, 0.4),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
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
	},

	floorTones(accent: string | undefined) {
		return {
			bodyTop: tint("#3a3848", accent, 0.4),
			bodyBot: tint("#22202e", accent, 0.4),
			rimCol: tint("#6a6878", accent, 0.35),
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
	},

	/**
	 * Full per-kind monster reskins for the Spectre Crypt:
	 *   - crawler  → shambling skeleton (bony body, skull head, rib hints, leg bones)
	 *   - bat      → sheet ghost (translucent white draped form, big dark eyes)
	 *   - lurker   → hanging wraith (tattered dark cloak, glowing eyes downward)
	 *
	 * All three keep the base gameplay footprint and origin conventions so existing
	 * aabb, stomp and poop-drop logic still feels right. Deterministic — no
	 * `Math.random`. When this hook fires, `monsterFlourish` is skipped entirely.
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawSkeletonCrawler(accent);
		if (kind === "bat") return drawGhostBat(accent);
		if (kind === "lurker") return drawWraithLurker(accent);
		return null;
	},

	monsterFlourish(
		c: Container,
		f: Graphics,
		_kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		_headY: number,
		_hw: number,
	): void {
		// Ghostly treatment: lower the container alpha slightly, add hollow
		// glowing eye-ring halos (drawn around, not over, the existing eyes so
		// they still read clearly), and a faint spectral wisp below the body.
		// Translucency on the whole container — affects the base g layer too.
		c.alpha = 0.82;
		// Hollow glow rings around the eyes — placed just outside the pupils.
		// Crawler/bat eyes at y=-13; lurker eyes at y=16.
		const eyeY = isLurker ? 16 : -13;
		for (const ex of [-5, 6]) {
			f.circle(ex, eyeY, 5.5).stroke({
				color: "#7fff9a",
				width: 1,
				alpha: 0.7,
			});
		}
		// Spectral wisp: a soft elongated blob trailing below/above the body.
		const wispY = isLurker ? 32 : 0; // below body in each orientation
		f.ellipse(0, wispY, 6, 10).fill({ color: "#aaffcc", alpha: 0.18 });
		f.ellipse(0, wispY + (isLurker ? 4 : -4), 3, 5).fill({
			color: "#ccffdd",
			alpha: 0.13,
		});
	},
};
