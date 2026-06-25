import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Cube Mines: a blocky voxel-style cave where everything reads as stacked
 * square blocks. Dark stone background with earthy greens, diamond cyan ore
 * veins, and pixel-edged cubic forms. Every surface — platforms, floor,
 * silhouettes — is rendered as a grid of square block faces instead of organic
 * rock curves.
 *
 * No mechanic modifier; the blocky identity comes entirely from the draw hooks.
 */
export const minecraftPack: ThemePack = {
	style: "minecraft",
	name: "Cube Mines",
	bg: ["#1c2230", "#10131c"],
	accent: "#5fa83c",
	ceilingKinds: ["crystal", "crack"],
	floorKinds: ["pebble", "crystal"],
	ambient: "pixel",
	lighting: { color: 0x0a1018, intensity: 0.4 },

	// -------------------------------------------------------------------------
	// Far silhouettes: blocky cube-stack terrain on the horizon + ore patches.
	// -------------------------------------------------------------------------

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
		// Cube-stack horizon mounds: stepped rectangular profiles.
		for (let x = rng(40, 120); x < worldWidth; x += rng(130, 240)) {
			const blockW = 12;
			const cols = Math.floor(rng(3, 7));
			const baseY = GAME_HEIGHT - 56;
			for (let ci = 0; ci < cols; ci++) {
				const col = Math.floor(rng(0, cols));
				const bh =
					blockW * (Math.floor(rng(1, 4)) + (col < cols * 0.5 ? 1 : 0));
				const bx = x + ci * blockW;
				g.rect(bx, baseY - bh, blockW - 1, bh).fill({
					color: wallFar,
					alpha: 0.13,
				});
			}
		}
		// Embedded ore dots: diamond cyan + gold squares in dark stone.
		const oreColors: [number, number][] = [
			[0x3fd6c8, 0.22], // diamond cyan
			[0xe8b84b, 0.2], // gold
			[0xcc3333, 0.18], // redstone red
		];
		let oreX = rng(60, 160);
		while (oreX < worldWidth - 30) {
			const oreY = GAME_HEIGHT * 0.28 + rng(0, GAME_HEIGHT * 0.38);
			const [oreCol, oreAlpha] = oreColors[Math.floor(rng(0, 3))];
			const oreSize = rng(2, 5);
			// Square ore gem.
			g.rect(oreX, oreY, oreSize, oreSize).fill({
				color: oreCol,
				alpha: oreAlpha,
			});
			// Tiny highlight pixel on the ore.
			g.rect(oreX, oreY, 1, 1).fill({ color: 0xffffff, alpha: 0.18 });
			oreX += rng(80, 180);
		}
	},

	// -------------------------------------------------------------------------
	// Mid details: blocky stalactite-as-stacked-cubes from the ceiling.
	// -------------------------------------------------------------------------

	midDetails(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallMid: number,
		_wallNear: number,
		wallLight: number,
		rng: Rng,
	): boolean {
		// Stacked-cube stalactites: stepped rectangular columns hanging from ceiling.
		for (let x = rng(60, 150); x < worldWidth; x += rng(100, 200)) {
			const blockW = Math.floor(rng(10, 18));
			const steps = Math.floor(rng(2, 5));
			let curY = 0;
			let curW = blockW + steps * 4;
			for (let s = 0; s < steps; s++) {
				const bh = Math.floor(rng(6, 14));
				// Each block in the stack is slightly narrower as it goes down.
				g.rect(x - curW * 0.5, curY, curW, bh - 1).fill({
					color: wallMid,
					alpha: 0.22 - s * 0.025,
				});
				// Top-light face: a 1-px bright strip on top of each block.
				g.rect(x - curW * 0.5, curY, curW, 1).fill({
					color: wallLight,
					alpha: 0.14,
				});
				curY += bh;
				curW = Math.max(4, curW - Math.floor(rng(3, 7)));
			}
		}
		// Return true: keep the generic stalagmite row as well.
		return true;
	},

	// -------------------------------------------------------------------------
	// Near silhouettes: thick blocky wall chunks + glowing ore veins.
	// -------------------------------------------------------------------------

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		_wallLight: number,
		rng: Rng,
	): void {
		// Large cube-stack wall formations near the camera.
		for (let x = rng(70, 180); x < worldWidth; x += rng(200, 400)) {
			const blockSize = 18;
			const cols = Math.floor(rng(3, 6));
			const baseY = GAME_HEIGHT - 22;
			for (let ci = 0; ci < cols; ci++) {
				const bh = blockSize * Math.floor(rng(2, 5));
				const bx = x + ci * blockSize - (cols * blockSize) / 2;
				g.rect(bx, baseY - bh, blockSize - 1, bh).fill({
					color: wallNear,
					alpha: 0.28,
				});
				// Top-lit face of each column.
				g.rect(bx, baseY - bh, blockSize - 1, 2).fill({
					color: 0x5fa83c,
					alpha: 0.12,
				});
			}
		}
		// Glowing ore vein squares embedded in the near layer.
		for (let x = rng(100, 250); x < worldWidth; x += rng(150, 300)) {
			const vy = GAME_HEIGHT * 0.35 + rng(0, GAME_HEIGHT * 0.3);
			// Cluster of 2-3 adjacent ore squares.
			for (let ci = 0; ci < 3; ci++) {
				const cx = x + ci * 5;
				g.rect(cx, vy + ci * 2, 4, 4).fill({ color: 0x3fd6c8, alpha: 0.28 });
				// Bright glow centre pixel.
				g.rect(cx + 1, vy + ci * 2 + 1, 2, 2).fill({
					color: 0x8ff8ee,
					alpha: 0.3,
				});
			}
		}
	},

	// -------------------------------------------------------------------------
	// Platform tones: earthy dirt brown + stone grey.
	// -------------------------------------------------------------------------

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#4a3a28", accent, 0.25),
			rimCol: tint("#5fa83c", accent, 0.6), // grass-green top
			shadowCol: tint("#1e1812", accent, 0.25),
			sideShade: tint("#2e2618", accent, 0.3),
			mottleCol: tint("#3c3022", accent, 0.25),
			crackCol: tint("#1a140c", accent, 0.3),
		};
	},

	// -------------------------------------------------------------------------
	// Platform skin: stacked cube grid — the signature visual.
	// Each block face has a top-lit highlight and subtle side shading.
	// -------------------------------------------------------------------------

	platformSkin(g: Graphics, width: number, height: number): void {
		// Block size — aim for visible cubes but don't go below 6 px.
		const blockW = Math.max(6, Math.min(16, Math.floor(width / 6)));
		const blockH = Math.max(6, Math.min(14, height));

		// Vertical block joint lines (pixel-crisp, 1 px gaps between blocks).
		for (let bx = blockW; bx < width - 2; bx += blockW) {
			g.moveTo(bx, 0)
				.lineTo(bx, blockH)
				.stroke({ color: 0x1a140c, width: 1, alpha: 0.45 });
		}
		// Top-light highlight strip: bright grass-green row across the top face.
		g.rect(0, 0, width, 2).fill({ color: 0x5fa83c, alpha: 0.75 });
		// Second grass row slightly darker.
		g.rect(0, 2, width, 2).fill({ color: 0x4a8a2e, alpha: 0.45 });
		// Subtle top-face ambient sheen.
		if (width > 20) {
			g.rect(width * 0.06, 1, width * 0.5, 1).fill({
				color: 0x8fd86a,
				alpha: 0.3,
			});
		}
		// Pixel-style dirt texture specks — deterministic via wobble.
		if (height >= 10 && width > 20) {
			for (let si = 0; si < 4; si++) {
				const sx =
					width * 0.15 + wobble(width + si * 17, si * 13 + 7, width * 0.3);
				const sy =
					5 + Math.abs(wobble(height + si * 11, si * 19 + 3, height * 0.3));
				g.rect(sx, sy, 2, 2).fill({ color: 0x2e2618, alpha: 0.5 });
			}
		}
	},

	// -------------------------------------------------------------------------
	// Floor tones: dark stone with earthy green rim.
	// -------------------------------------------------------------------------

	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#3a3224", accent, 0.3),
			bodyBot: tint("#1a1610", accent, 0.3),
			rimCol: tint("#5fa83c", accent, 0.55),
			mottle1: tint("#2e2a1c", accent, 0.3),
			mottle2: tint("#3c3628", accent, 0.25),
			edgeDark: tint("#0c0a06", accent, 0.15),
		};
	},

	// -------------------------------------------------------------------------
	// Floor surface: a row of grass-top square block faces.
	// -------------------------------------------------------------------------

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void {
		const blockW = 16;
		const grassGreen = tint("#5fa83c", accent, 0.5);
		const grassDark = tint("#4a8a2e", accent, 0.45);
		const dirtTop = tint("#5a4a30", accent, 0.3);

		// Draw a row of square grass-top blocks along the floor surface.
		for (let bx = sx; bx < ex; bx += blockW) {
			const bRight = Math.min(bx + blockW - 1, ex - 1);
			const bw = bRight - bx;
			if (bw < 2) continue;

			// Grass-green top face: two rows.
			g.rect(bx, surfaceY, bw, 2).fill({ color: grassGreen, alpha: 0.85 });
			g.rect(bx, surfaceY + 2, bw, 2).fill({ color: grassDark, alpha: 0.6 });
			// Dirt underside strip.
			g.rect(bx, surfaceY + 4, bw, 3).fill({ color: dirtTop, alpha: 0.45 });
			// Bright top-light pixel.
			g.rect(bx + 1, surfaceY, Math.max(1, bw - 4), 1).fill({
				color: 0x8fd86a,
				alpha: 0.45,
			});
		}
		// Vertical block joint lines between blocks.
		for (let bx = sx + blockW; bx < ex - 2; bx += blockW) {
			g.moveTo(bx, surfaceY)
				.lineTo(bx, surfaceY + 7)
				.stroke({ color: 0x1a140c, width: 1, alpha: 0.4 });
		}
	},

	// -------------------------------------------------------------------------
	// Monster flourish: a faint creeper-green pixelated rim + two square "eye"
	// hints to suggest the blocky voxel creature style. Subtle enough that the
	// base monster silhouette reads clearly.
	// -------------------------------------------------------------------------

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Square pixel rim around the body outline (creeper-green hint).
		const rimColor = 0x3a8a28;
		if (!isLurker) {
			const rimR = kind === "crawler" ? 18 : 13;
			const rimTop = kind === "crawler" ? -26 : -22;
			const rimH = kind === "crawler" ? 24 : 20;
			// Draw as a square rect outline instead of an ellipse.
			f.rect(-rimR, rimTop, rimR * 2, rimH).stroke({
				color: rimColor,
				width: 1.2,
				alpha: 0.45,
			});
		} else {
			f.rect(-16, 4, 32, 26).stroke({
				color: rimColor,
				width: 1.2,
				alpha: 0.45,
			});
		}
		// Two small square "pixel eye" hints flanking the face — 3x3 squares.
		const eyeY = isLurker ? 12 : headY - 4;
		const eyeOffsets = [-6, 3] as const;
		for (const ex of eyeOffsets) {
			f.rect(ex, eyeY, 3, 3).fill({ color: rimColor, alpha: 0.35 });
		}
		// Tiny block corner dots at body corners (pixel-art callback).
		const dotY = isLurker ? 28 : headY + 2;
		for (const dx of [-hw + 3, hw - 3]) {
			f.rect(dx - 1, dotY - 1, 2, 2).fill({ color: 0x5fa83c, alpha: 0.5 });
		}
	},
};
