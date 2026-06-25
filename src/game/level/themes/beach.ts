import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Pebble Pier: a grey-blue Brighton beach cave with the Palace Pier silhouette
 * stretching across the horizon, a row of colourful beach huts, the ruined West
 * Pier skeleton and i360 observation tower in the far distance, and rounded
 * shingle underfoot. Overcast English Channel sky — cool, muted, unmistakably
 * British seaside. Default physics (no mechanic tweaks).
 */
export const beachPack: ThemePack = {
	style: "beach",
	name: "Pebble Pier",
	bg: ["#6b7e92", "#3e5266"],
	accent: "#4a90a4",
	ceilingKinds: ["crystal", "crack"],
	floorKinds: ["pebble", "pebble", "moss"],
	ambient: "fog",
	lighting: { color: 0x1e2e3e, intensity: 0.2 }, // overcast daytime cool wash

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
		// Pale grey-blue sea band just above the floor horizon.
		const seaY = GAME_HEIGHT - 72;
		g.rect(0, seaY, worldWidth, 18).fill({ color: 0x4a6880, alpha: 0.22 });
		g.rect(0, seaY, worldWidth, 2).fill({ color: 0x7aa8c0, alpha: 0.18 });

		// West Pier ruin skeleton: broken lattice columns and cross-bars on horizon.
		const pierStartX = rng(40, 100);
		for (
			let x = pierStartX;
			x < pierStartX + worldWidth * 0.3;
			x += rng(28, 44)
		) {
			const legH = rng(18, 32);
			const legW = rng(2, 4);
			g.rect(x, seaY - legH, legW, legH + 4).fill({
				color: wallFar,
				alpha: 0.15,
			});
			// Cross-brace
			if (x + 20 < pierStartX + worldWidth * 0.3) {
				g.moveTo(x + legW, seaY - legH * 0.6)
					.lineTo(x + 24, seaY - legH * 0.4)
					.stroke({ color: wallFar, width: 1, alpha: 0.1 });
			}
		}

		// i360 observation tower: tall slim mast with a disc pod near the top.
		const towerX = worldWidth * 0.72 + wobble(worldWidth, 17, 30);
		const towerH = 60;
		const towerTopY = seaY - towerH;
		g.rect(towerX - 1.5, towerTopY, 3, towerH).fill({
			color: wallFar,
			alpha: 0.22,
		});
		// Disc pod
		g.ellipse(towerX, towerTopY + 8, 9, 5).fill({
			color: wallFar,
			alpha: 0.2,
		});
		// Slim base plinth
		g.rect(towerX - 4, seaY - 5, 8, 5).fill({ color: wallFar, alpha: 0.18 });
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
		// Beach huts: a row of colourful striped sheds along the mid horizon.
		// Palette: classic deckchair stripes — red, yellow, blue, white, green.
		const hutColors: number[] = [
			0xd8504a, // deckchair red
			0xd8b84a, // faded yellow
			0x4a7ab8, // seaside blue
			0xd8d4c8, // cream-white
			0x4a8c5c, // muted green
		];
		const hutBaseY = GAME_HEIGHT - 56;
		for (let x = rng(40, 110); x < worldWidth - 24; x += rng(36, 60)) {
			const hw = rng(14, 20);
			const hh = rng(18, 26);
			const roofH = hh * 0.3;
			// Pick hut colour deterministically from position.
			const colIdx =
				Math.abs(Math.floor(wobble(x, 31, 100) + 200)) % hutColors.length;
			const hutCol = hutColors[colIdx];
			// Hut body
			g.rect(x - hw * 0.5, hutBaseY - hh, hw, hh).fill({
				color: hutCol,
				alpha: 0.28,
			});
			// Peaked roof
			g.poly([
				x - hw * 0.5 - 2,
				hutBaseY - hh,
				x + hw * 0.5 + 2,
				hutBaseY - hh,
				x,
				hutBaseY - hh - roofH,
			]).fill({ color: wallMid, alpha: 0.25 });
			// Stripe: a single vertical stripe on the door half
			g.rect(x - hw * 0.1, hutBaseY - hh, hw * 0.22, hh).fill({
				color: 0xfff8f0,
				alpha: 0.12,
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
		// Palace Pier: long row of cast-iron struts/legs over the water
		// + a roofed arcade building + helter-skelter at the pier head.
		const pierY = GAME_HEIGHT - 28;
		const pierLen = worldWidth * rng(0.38, 0.52);
		const pierStartX = rng(50, 150);
		const legCount = Math.floor(pierLen / rng(18, 26));
		const legSpacing = pierLen / legCount;

		// Pier deck beam
		g.rect(pierStartX, pierY - 20, pierLen, 5).fill({
			color: wallNear,
			alpha: 0.28,
		});

		// Lattice legs: each leg is two crossed struts
		for (let i = 0; i <= legCount; i++) {
			const lx = pierStartX + i * legSpacing;
			const legH = rng(12, 22);
			g.rect(lx - 1.5, pierY - 20, 3, legH).fill({
				color: wallNear,
				alpha: 0.24,
			});
			if (i < legCount) {
				// Diagonal brace
				g.moveTo(lx, pierY - 20)
					.lineTo(lx + legSpacing, pierY - 20 + legH * 0.6)
					.stroke({ color: wallNear, width: 1, alpha: 0.14 });
			}
		}

		// Arcade building (roofed pavilion) near the pier head.
		const buildX = pierStartX + pierLen * 0.6;
		const buildW = pierLen * 0.22;
		const buildH = 30;
		g.rect(buildX, pierY - 20 - buildH, buildW, buildH).fill({
			color: wallNear,
			alpha: 0.22,
		});
		// Domed/arched roofline
		g.ellipse(
			buildX + buildW * 0.5,
			pierY - 20 - buildH,
			buildW * 0.55,
			buildH * 0.3,
		).fill({ color: wallNear, alpha: 0.2 });
		// A smaller dome flanking it
		g.ellipse(
			buildX + buildW * 0.2,
			pierY - 20 - buildH * 0.7,
			buildW * 0.18,
			buildH * 0.18,
		).fill({ color: wallNear, alpha: 0.18 });

		// Helter-skelter at the very end: tapered tower with spiral stripe.
		const htX = pierStartX + pierLen * 0.88;
		const htH = 44;
		const htW = 14;
		g.poly([
			htX - htW * 0.5,
			pierY - 20,
			htX + htW * 0.5,
			pierY - 20,
			htX + htW * 0.25,
			pierY - 20 - htH,
			htX - htW * 0.25,
			pierY - 20 - htH,
		]).fill({ color: wallNear, alpha: 0.24 });
		// Conical cap
		g.poly([
			htX - htW * 0.25,
			pierY - 20 - htH,
			htX + htW * 0.25,
			pierY - 20 - htH,
			htX,
			pierY - 20 - htH - 10,
		]).fill({ color: wallNear, alpha: 0.22 });
	},

	platformTones(accent: string | undefined): PlatformTones {
		// Wet stone / wooden groyne palette — grey-brown, damp-dark.
		return {
			bodyCol: tint("#4a4840", accent, 0.3),
			rimCol: tint("#7a7470", accent, 0.28),
			shadowCol: tint("#28241e", accent, 0.35),
			sideShade: tint("#383430", accent, 0.35),
			mottleCol: tint("#58504c", accent, 0.3),
			crackCol: tint("#1e1c18", accent, 0.35),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
		// Wet-stone sheen: a faint gloss highlight on the top surface.
		if (width > 18) {
			g.rect(width * 0.06, 1, width * 0.5, 1.2).fill({
				color: 0xd0dce8,
				alpha: 0.2,
			});
		}
		// Groyne plank joint: one vertical dark seam.
		if (height >= 8 && width > 28) {
			const jx = width * 0.5 + wobble(width, 53, width * 0.16);
			g.moveTo(jx, 2)
				.lineTo(jx + wobble(width, 57, 1.5), height - 2)
				.stroke({
					color: crackCol,
					width: Math.max(0.7, height * 0.05),
					alpha: 0.3,
				});
		}
	},

	floorTones(accent: string | undefined): FloorTones {
		// Shingle: mid grey-brown, damp, muted teal wash.
		return {
			bodyTop: tint("#5a5650", accent, 0.3),
			bodyBot: tint("#30302c", accent, 0.35),
			rimCol: tint("#8a8480", accent, 0.28),
			mottle1: tint("#484440", accent, 0.35),
			mottle2: tint("#6a6460", accent, 0.3),
			edgeDark: tint("#101010", accent, 0.15),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		_accent: string | undefined,
	): void {
		// Shingle/pebble beach: clusters of rounded grey stones of varied size.
		// Stone colours: a handful of cool grey tones.
		const stonePalette: number[] = [
			0x8a8a8a, // mid grey
			0xa0a4a8, // light blue-grey
			0x686868, // dark grey
			0x9a9490, // warm grey
			0x788088, // cool blue-grey
		];
		const stoneSpacing = 14;
		for (let x = sx + 4; x < ex - 4; x += stoneSpacing) {
			// Two to three overlapping pebbles per slot, keyed to x for determinism.
			for (let s = 0; s < 3; s++) {
				const seed = x * 3 + s * 97;
				const ox = wobble(seed, 13, stoneSpacing * 0.45);
				const oy = Math.abs(wobble(seed, 17, 4));
				const rx = 3 + Math.abs(wobble(seed, 19, 2.5));
				const ry = rx * (0.55 + Math.abs(wobble(seed, 23, 0.25)));
				const colIdx =
					Math.abs(Math.floor(wobble(seed, 29, 100) + 100)) %
					stonePalette.length;
				g.ellipse(x + ox, surfaceY + 4 + oy, rx, ry).fill({
					color: stonePalette[colIdx],
					alpha: 0.55,
				});
			}
		}

		// A couple of stranded starfish / shells on the shingle (sparse).
		const shellSpacing = 180;
		for (let x = sx + 30; x < ex - 30; x += shellSpacing) {
			const sx2 = x + wobble(x, 41, shellSpacing * 0.35);
			const sy = surfaceY + 3;
			// Simple five-point star as a small starfish silhouette.
			const r = 4;
			const innerR = 1.8;
			const pts: number[] = [];
			for (let i = 0; i < 10; i++) {
				const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
				const rad = i % 2 === 0 ? r : innerR;
				pts.push(sx2 + Math.cos(angle) * rad, sy + Math.sin(angle) * rad);
			}
			g.poly(pts).fill({ color: 0xd08060, alpha: 0.5 });
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
		// Seagull touch: a small white "M" wing glyph above/beside the monster head
		// and a faint off-white beak stripe — subtle, never obscuring eyes/fangs.
		const wingY = isLurker ? -4 : headY - 10;
		const wingSpan = kind === "crawler" ? hw * 0.7 : hw * 0.55;

		// Two curved wing arcs forming a "M" silhouette.
		f.moveTo(-wingSpan, wingY + 4)
			.quadraticCurveTo(-wingSpan * 0.5, wingY - 3, 0, wingY)
			.quadraticCurveTo(wingSpan * 0.5, wingY - 3, wingSpan, wingY + 4)
			.stroke({ color: 0xf0eee8, width: 1.2, alpha: 0.55, cap: "round" });

		// Tiny yellow-orange beak dot beside head.
		const beakX = isLurker ? hw * 0.4 : hw * 0.45;
		const beakY = isLurker ? 18 : headY - 2;
		f.poly([beakX, beakY, beakX + 4, beakY + 1, beakX, beakY + 3]).fill({
			color: 0xe8b840,
			alpha: 0.7,
		});
	},
};
