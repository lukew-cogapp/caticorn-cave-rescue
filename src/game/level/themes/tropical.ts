import type { Container, Graphics } from "pixi.js";
import {
	drawCoconutLurker,
	drawCrabCrawler,
	drawParrotBat,
} from "../../art/themes/tropical/monsters";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Lagoon Hideaway: a lush tropical island cave — teal lagoon water, silhouetted
 * palm trees, hibiscus flowers, distant volcanic island horizon and drifting
 * bubbles. Standard physics (no mechanic tweaks).
 */
export const tropicalPack: ThemePack = {
	style: "tropical",
	name: "Lagoon Hideaway",
	bg: ["#0e6e7a", "#0a3a52"],
	accent: "#2fd6c8",
	ceilingKinds: ["crystal", "crack", "crystal"],
	floorKinds: ["moss", "pebble", "blossom"],
	ambient: "bubble",
	lighting: { color: 0x06303a, intensity: 0.22 }, // bright lagoon teal wash

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		rng: Rng,
	): void {
		// Ocean horizon band across the lower third — a flat distant lagoon.
		const horizonY = GAME_HEIGHT * 0.58;
		g.rect(0, horizonY, worldWidth, GAME_HEIGHT * 0.14).fill({
			color: wallFar,
			alpha: 0.13,
		});
		// Distant volcanic island silhouette — a dome with a crater notch.
		for (let x = rng(80, 200); x < worldWidth; x += rng(380, 560)) {
			const islandW = rng(60, 100);
			const islandH = rng(26, 46);
			const base = horizonY + 4;
			// Island dome body.
			g.ellipse(x, base, islandW, islandH).fill({
				color: wallFar,
				alpha: 0.18,
			});
			// Crater notch at the peak.
			const craterW = islandW * 0.14;
			const craterH = islandH * 0.22;
			const peakX = x + wobble(x, 17, islandW * 0.12);
			g.ellipse(peakX, base - islandH * 0.82, craterW, craterH).fill({
				color: wallMid,
				alpha: 0.22,
			});
		}
		// Faint distant palm frond blobs on the horizon.
		for (let x = rng(120, 260); x < worldWidth; x += rng(200, 340)) {
			const frondW = rng(18, 34);
			const frondH = rng(12, 22);
			const frondY = horizonY - rng(18, 36);
			g.ellipse(x, frondY, frondW, frondH).fill({
				color: wallMid,
				alpha: 0.12,
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
		// Mid-distance palm trees: curved trunk + radiating fronds from ceiling edge.
		for (let x = rng(60, 150); x < worldWidth; x += rng(160, 280)) {
			const trunkH = rng(55, 95);
			const lean = rng(-14, 14);
			const tipX = x + lean;
			const tipY = trunkH;
			// Curved trunk via quadratic curve from ceiling.
			g.moveTo(x - 4, 0)
				.quadraticCurveTo(x + lean * 0.5, tipY * 0.55, tipX + 4, tipY)
				.lineTo(tipX - 4, tipY)
				.quadraticCurveTo(x - lean * 0.5, tipY * 0.55, x + 4, 0)
				.fill({ color: wallMid, alpha: 0.2 });
			// Fan of 5 palm fronds at the trunk tip.
			const frondAngles = [-60, -30, 0, 30, 60] as const;
			for (const angleDeg of frondAngles) {
				const rad = (angleDeg * Math.PI) / 180;
				const frondLen = rng(28, 48);
				// Fronds droop: end y is always positive (downward from tip).
				const fx = tipX + Math.sin(rad) * frondLen;
				const fy =
					tipY + Math.abs(Math.cos(rad)) * frondLen * 0.45 + frondLen * 0.35;
				g.moveTo(tipX, tipY)
					.quadraticCurveTo(
						tipX + Math.sin(rad) * frondLen * 0.55,
						tipY + frondLen * 0.25,
						fx,
						fy,
					)
					.stroke({ color: wallMid, width: rng(1.8, 3.2), alpha: 0.19 });
			}
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
		// Large near-plane palm trees with thick trunks and wide fronds framing the play area.
		for (let x = rng(50, 140); x < worldWidth; x += rng(250, 420)) {
			const trunkH = rng(80, 130);
			const lean = rng(-22, 22);
			const tipX = x + lean;
			const tipY = trunkH;
			// Thick curved trunk.
			g.moveTo(x - 7, 0)
				.quadraticCurveTo(x + lean * 0.45, tipY * 0.5, tipX + 7, tipY)
				.lineTo(tipX - 7, tipY)
				.quadraticCurveTo(x - lean * 0.45, tipY * 0.5, x + 7, 0)
				.fill({ color: wallNear, alpha: 0.28 });
			// Frond fan (wider spread, more droopy at this scale).
			const nearFrondAngles = [-70, -40, -10, 20, 50, 80] as const;
			for (const angleDeg of nearFrondAngles) {
				const rad = (angleDeg * Math.PI) / 180;
				const frondLen = rng(40, 68);
				const fx = tipX + Math.sin(rad) * frondLen;
				const fy =
					tipY + Math.abs(Math.cos(rad)) * frondLen * 0.5 + frondLen * 0.4;
				g.moveTo(tipX, tipY)
					.quadraticCurveTo(
						tipX + Math.sin(rad) * frondLen * 0.5,
						tipY + frondLen * 0.3,
						fx,
						fy,
					)
					.stroke({ color: wallNear, width: rng(2.5, 4.5), alpha: 0.24 });
			}
			// Tiki totem accent: a small blocky face carved at mid-trunk.
			const totemY = tipY * 0.62;
			const totemX = x + lean * 0.45;
			g.roundRect(totemX - 6, totemY - 8, 12, 10, 1).fill({
				color: wallLight,
				alpha: 0.12,
			});
			// Eye slots on the totem.
			for (const ex of [-3, 3] as const) {
				g.rect(totemX + ex - 1, totemY - 5, 2, 2).fill({
					color: wallNear,
					alpha: 0.35,
				});
			}
		}

		// Surfboard leaning against the near wall at a random span.
		for (let x = rng(80, 200); x < worldWidth; x += rng(620, 900)) {
			const boardX = x;
			const boardBase = GAME_HEIGHT - 28;
			const boardH = rng(44, 58);
			const boardW = rng(9, 13);
			const lean = rng(8, 18); // lean angle: offset at top
			// Surfboard hull — rounded rect leaning slightly.
			g.poly([
				boardX - boardW * 0.5 + lean,
				boardBase - boardH,
				boardX + boardW * 0.5 + lean,
				boardBase - boardH + 4,
				boardX + boardW * 0.5,
				boardBase,
				boardX - boardW * 0.5,
				boardBase,
			]).fill({ color: wallNear, alpha: 0.3 });
			// Board stripe.
			g.moveTo(boardX + lean * 0.5, boardBase - boardH + 8)
				.lineTo(boardX, boardBase - 8)
				.stroke({ color: wallLight, width: 1.5, alpha: 0.2 });
		}
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#2e5a44", accent, 0.4), // mossy tropical stone
			rimCol: tint("#5a9e74", accent, 0.35),
			shadowCol: tint("#1a3328", accent, 0.42),
			sideShade: tint("#243e30", accent, 0.42),
			mottleCol: tint("#3e7a56", accent, 0.38),
			crackCol: tint("#1e2e26", accent, 0.4),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
		// Leafy raft plank look: horizontal wood grain lines + a mossy rim.
		if (height >= 6) {
			const planks = Math.max(1, Math.floor(height / 5));
			for (let p = 0; p < planks; p++) {
				const py = 3 + p * 5;
				if (py >= height - 1) break;
				const lineX = width * 0.05 + wobble(width + py, 31 + p, width * 0.08);
				const lineW = width * 0.82 + wobble(width, 37 + p, width * 0.08);
				g.moveTo(lineX, py)
					.lineTo(lineX + lineW, py + wobble(width + p, 41, 1.5))
					.stroke({ color: crackCol, width: 0.8, alpha: 0.22 });
			}
		}
		// Mossy rim highlight across the top surface.
		if (width > 16) {
			g.rect(width * 0.06, 1, width * 0.5, 1.5).fill({
				color: 0x48c878,
				alpha: 0.28,
			});
		}
	},

	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#2e5840", accent, 0.38),
			bodyBot: tint("#1a2e26", accent, 0.38),
			rimCol: tint("#5ab880", accent, 0.3),
			mottle1: tint("#284a36", accent, 0.4),
			mottle2: tint("#3a6850", accent, 0.35),
			edgeDark: tint("#0a1410", accent, 0.15),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void {
		const sandCol = tint("#c8a86e", accent, 0.12);
		const sandLit = tint("#d8c08a", accent, 0.1);

		// Sandy beach edge with irregular sandy patches.
		const sandSpacing = 72;
		for (let x = sx + 10; x < ex - 10; x += sandSpacing) {
			const mx = x + wobble(x, 19, sandSpacing * 0.32);
			const sw = 14 + Math.abs(wobble(x, 23, 8));
			g.ellipse(mx, surfaceY + 2.5, sw, 2.5).fill({
				color: sandCol,
				alpha: 0.55,
			});
			// Lit crest.
			g.ellipse(mx - sw * 0.18, surfaceY + 1.8, sw * 0.5, 1.4).fill({
				color: sandLit,
				alpha: 0.38,
			});
		}

		// Hibiscus flowers scattered along the surface.
		const hibiscusSpacing = 96;
		for (let x = sx + 18; x < ex - 18; x += hibiscusSpacing) {
			const fx = x + wobble(x, 53, hibiscusSpacing * 0.38);
			const fy = surfaceY - 1;
			// 5 petals at 72° step (pre-computed unit vectors from 90° start).
			// [cos, sin] for angles 90°,162°,234°,306°,18° (−90°→+72° each step).
			const petalDirs: [number, number][] = [
				[0, -1],
				[0.951, -0.309],
				[0.588, 0.809],
				[-0.588, 0.809],
				[-0.951, -0.309],
			];
			const pr = 3.8;
			for (const [px, py] of petalDirs) {
				g.ellipse(fx + px * pr, fy + py * pr, 2.6, 1.6).fill({
					color: 0xff5d8f,
					alpha: 0.85,
				});
			}
			// Golden centre.
			g.circle(fx, fy, 1.8).fill({ color: 0xffe050, alpha: 1 });
		}

		// Small shell shapes between hibiscus flowers.
		const shellSpacing = 56;
		for (let x = sx + 28; x < ex - 28; x += shellSpacing) {
			const shx = x + wobble(x, 71, shellSpacing * 0.35);
			const shy = surfaceY + 2;
			const sr = 2.4 + Math.abs(wobble(x, 73, 1));
			// Shell: a small D-shape (half ellipse + base line).
			g.ellipse(shx, shy, sr, sr * 0.65).fill({ color: 0xe8d4a8, alpha: 0.6 });
			g.moveTo(shx - sr, shy)
				.lineTo(shx + sr, shy)
				.stroke({ color: 0xc8b080, width: 0.7, alpha: 0.45 });
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
		// A hibiscus flower worn behind the ear / at the side of the head.
		const flowerX = kind === "bat" ? 9 : 10;
		const flowerY = kind === "lurker" ? headY + 8 : headY - 2;

		// 5 petals (same deterministic angles as floor hibiscus).
		const petalDirs: [number, number][] = [
			[0, -1],
			[0.951, -0.309],
			[0.588, 0.809],
			[-0.588, 0.809],
			[-0.951, -0.309],
		];
		const pr = 2.8;
		for (const [px, py] of petalDirs) {
			f.ellipse(flowerX + px * pr, flowerY + py * pr, 2.0, 1.3).fill({
				color: 0xff5d8f,
				alpha: 0.9,
			});
		}
		f.circle(flowerX, flowerY, 1.5).fill({ color: 0xffe050, alpha: 1 });

		// Leaf stem behind the flower (faint green stroke).
		f.moveTo(flowerX - 3, flowerY + 2)
			.lineTo(flowerX - 7, flowerY + 7)
			.stroke({ color: 0x3ac87a, width: 1.2, alpha: 0.55 });

		// Soft lagoon-teal halo ring around the head for mood.
		if (!isLurker) {
			const rimR = kind === "crawler" ? 16 : 11;
			const rimY = kind === "crawler" ? -14 : -12;
			f.ellipse(0, rimY, rimR, rimR - 3).stroke({
				color: "#2fd6c8",
				width: 1,
				alpha: 0.4,
			});
		}
	},

	/**
	 * Full per-kind monster reskins for the Lagoon Hideaway:
	 *   - crawler → scuttling crab (round coral shell, eye-stalks, pincers, legs)
	 *   - bat     → bright parrot/bird (teal + golden wings, beak, tail feathers)
	 *   - lurker  → coconut vine-critter (hairy husk, three pore-eyes, tendril arms)
	 *
	 * All three keep the base gameplay footprint and origin conventions so existing
	 * aabb, stomp and poop-drop logic still feels right. Deterministic — no
	 * `Math.random`. When this hook fires, `monsterFlourish` is skipped entirely.
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawCrabCrawler(accent);
		if (kind === "bat") return drawParrotBat(accent);
		if (kind === "lurker") return drawCoconutLurker(accent);
		return null;
	},
};
