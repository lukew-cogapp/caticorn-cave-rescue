import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Sunny Block Plains: a bright outdoor overworld cave with rolling green hills,
 * cheerful white clouds, a distant castle silhouette, brick-block platforms and
 * a classic green-over-brown ground strip. The sunniest, most colourful theme —
 * a vivid contrast to every other dark cave in the game.
 */
export const marioPack: ThemePack = {
	style: "mario",
	name: "Sunny Block Plains",
	bg: ["#5c94fc", "#8fb6ff"],
	accent: "#ffcc00",
	ceilingKinds: ["crystal", "crack"],
	floorKinds: ["pebble", "mushroom", "moss"],
	ambient: "gemsparkle",
	// Very low intensity + pale blue so the bright sky stays sunny.
	lighting: { color: 0x1e3a6e, intensity: 0.12 },

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
		// Rolling green hill silhouettes across the far background.
		for (let x = rng(20, 80); x < worldWidth + 60; x += rng(160, 280)) {
			const hillW = rng(90, 160);
			const hillH = rng(30, 55);
			const base = GAME_HEIGHT - 52;
			// Rounded hill dome.
			g.ellipse(x, base - hillH * 0.5, hillW, hillH).fill({
				color: 0x4ab050,
				alpha: 0.28,
			});
			// Lighter highlight near the crown.
			g.ellipse(
				x - hillW * 0.12,
				base - hillH * 0.72,
				hillW * 0.55,
				hillH * 0.4,
			).fill({
				color: 0x78d060,
				alpha: 0.14,
			});
		}

		// Fluffy white clouds — two overlapping ellipses per cloud.
		for (let x = rng(60, 160); x < worldWidth; x += rng(200, 340)) {
			const cy =
				GAME_HEIGHT * 0.18 + Math.abs(wobble(x, 71, GAME_HEIGHT * 0.1));
			const cw = rng(40, 70);
			// Main cloud body.
			g.ellipse(x, cy, cw, cw * 0.42).fill({ color: 0xffffff, alpha: 0.55 });
			// Puffier top lobe.
			g.ellipse(x - cw * 0.12, cy - cw * 0.22, cw * 0.62, cw * 0.38).fill({
				color: 0xffffff,
				alpha: 0.48,
			});
			// Right lobe.
			g.ellipse(x + cw * 0.28, cy - cw * 0.1, cw * 0.48, cw * 0.32).fill({
				color: 0xffffff,
				alpha: 0.42,
			});
		}

		// Distant castle silhouette — one per world, keyed deterministically.
		const castleX =
			worldWidth * 0.72 + wobble(worldWidth, 17, worldWidth * 0.08);
		const castleBase = GAME_HEIGHT - 54;
		const castleH = 60;
		const castleW = 42;
		// Main keep block.
		g.rect(
			castleX - castleW * 0.5,
			castleBase - castleH,
			castleW,
			castleH,
		).fill({
			color: 0xe8d8b0,
			alpha: 0.25,
		});
		// Battlements: four small merlons across the top.
		const merlonW = castleW / 5;
		for (let m = 0; m < 4; m++) {
			if (m % 2 === 0) {
				g.rect(
					castleX - castleW * 0.5 + m * merlonW,
					castleBase - castleH - merlonW * 0.9,
					merlonW * 0.88,
					merlonW * 0.9,
				).fill({ color: 0xe8d8b0, alpha: 0.25 });
			}
		}
		// Two flanking towers.
		for (const tx of [-castleW * 0.62, castleW * 0.62]) {
			const towerH = castleH * 0.7;
			const towerW = castleW * 0.28;
			g.rect(
				castleX + tx - towerW * 0.5,
				castleBase - towerH,
				towerW,
				towerH,
			).fill({ color: 0xd4c89a, alpha: 0.22 });
			// Tower merlon.
			g.rect(
				castleX + tx - towerW * 0.5,
				castleBase - towerH - towerW * 0.7,
				towerW,
				towerW * 0.7,
			).fill({ color: 0xd4c89a, alpha: 0.22 });
		}
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		_wallNear: number,
		_wallLight: number,
		rng: Rng,
	): void {
		// Warp pipes (green rectangles with a wider cap) near the floor.
		for (let x = rng(80, 180); x < worldWidth - 60; x += rng(260, 420)) {
			const pipeH = rng(36, 56);
			const pipeW = 24;
			const capH = 10;
			const capW = pipeW + 6;
			const base = GAME_HEIGHT - 22;
			// Pipe shaft.
			g.rect(x - pipeW * 0.5, base - pipeH, pipeW, pipeH).fill({
				color: 0x2a8040,
				alpha: 0.5,
			});
			// Pipe rim highlight.
			g.rect(x - pipeW * 0.5 + 2, base - pipeH, 4, pipeH).fill({
				color: 0x50c060,
				alpha: 0.22,
			});
			// Cap block.
			g.rect(x - capW * 0.5, base - pipeH - capH, capW, capH).fill({
				color: 0x2a8040,
				alpha: 0.55,
			});
			// Cap highlight.
			g.rect(x - capW * 0.5 + 2, base - pipeH - capH, 5, capH).fill({
				color: 0x50c060,
				alpha: 0.22,
			});
		}

		// Round-topped bushes along the floor — three overlapping circles.
		for (let x = rng(50, 140); x < worldWidth - 40; x += rng(180, 320)) {
			const bx = x + wobble(x, 37, 20);
			const base = GAME_HEIGHT - 23;
			const r = rng(14, 22);
			// Three lobes.
			g.circle(bx - r * 0.55, base - r * 0.55, r * 0.7).fill({
				color: 0x2e8840,
				alpha: 0.38,
			});
			g.circle(bx, base - r * 0.75, r).fill({ color: 0x3a9e50, alpha: 0.42 });
			g.circle(bx + r * 0.55, base - r * 0.55, r * 0.7).fill({
				color: 0x2e8840,
				alpha: 0.38,
			});
		}
	},

	platformTones(accent: string | undefined): PlatformTones {
		// Brick-orange body with warm mortar-tan rim.
		return {
			bodyCol: tint("#c84010", accent, 0.18),
			rimCol: tint("#e89060", accent, 0.2),
			shadowCol: tint("#6a2008", accent, 0.2),
			sideShade: tint("#9a3010", accent, 0.2),
			mottleCol: tint("#d05030", accent, 0.18),
			crackCol: tint("#7a2808", accent, 0.2),
		};
	},

	platformSkin(g: Graphics, width: number, height: number): void {
		// Brick mortar lines: horizontal joint near the centre + vertical joints.
		if (height < 6) return;

		// Horizontal mortar groove across the middle.
		const midY = Math.round(height * 0.5);
		g.moveTo(1, midY)
			.lineTo(width - 1, midY)
			.stroke({ color: 0x7a2808, width: 1.2, alpha: 0.45 });

		// Vertical mortar joints — offset per row (classic brick stagger).
		const brickW = Math.max(14, width / Math.round(width / 20));
		const offsetBot = brickW * 0.5;
		// Top row joints.
		for (let bx = brickW; bx < width - 2; bx += brickW) {
			const jx = bx + wobble(bx + height, 11, 1.5);
			g.moveTo(jx, 1)
				.lineTo(jx, midY - 0.5)
				.stroke({ color: 0x7a2808, width: 1, alpha: 0.38 });
		}
		// Bottom row joints (staggered by half a brick width).
		for (let bx = offsetBot; bx < width - 2; bx += brickW) {
			const jx = bx + wobble(bx + height * 2, 13, 1.5);
			g.moveTo(jx, midY + 0.5)
				.lineTo(jx, height - 1)
				.stroke({ color: 0x7a2808, width: 1, alpha: 0.38 });
		}
		// Top-surface highlight — the sun-lit "top face" of the brick.
		if (width > 10) {
			g.rect(1, 0, width - 2, 2).fill({ color: 0xf0a060, alpha: 0.3 });
		}
	},

	floorTones(accent: string | undefined): FloorTones {
		// Brown soil body with a bright green grass rim.
		return {
			bodyTop: tint("#6a4020", accent, 0.2),
			bodyBot: tint("#3c1e08", accent, 0.2),
			rimCol: tint("#4aaa30", accent, 0.2),
			mottle1: tint("#7a5030", accent, 0.2),
			mottle2: tint("#5a3418", accent, 0.2),
			edgeDark: tint("#1a0800", accent, 0.1),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void {
		// Solid green grass band along the top of the floor strip.
		const grassH = 5;
		g.rect(sx, surfaceY, ex - sx, grassH).fill({
			color: tint("#4aaa30", accent, 0.2),
			alpha: 0.9,
		});
		// Brighter highlight stripe along the very top edge.
		g.rect(sx, surfaceY, ex - sx, 1.5).fill({ color: 0x78d060, alpha: 0.6 });

		// Little grass blade tufts poking above the strip — overworld ground texture.
		const tuftSpacing = 20;
		for (let x = sx + 6; x < ex - 6; x += tuftSpacing) {
			const tx = x + wobble(x, 41, tuftSpacing * 0.3);
			const th = 3 + Math.abs(wobble(x, 43, 1.5));
			// Two blades per tuft.
			g.moveTo(tx - 1.5, surfaceY)
				.lineTo(tx - 2.5, surfaceY - th)
				.stroke({ color: 0x78d060, width: 1.2, alpha: 0.7, cap: "round" });
			g.moveTo(tx + 1.5, surfaceY)
				.lineTo(tx + 2, surfaceY - th * 0.8)
				.stroke({ color: 0x5ec048, width: 1, alpha: 0.55, cap: "round" });
		}

		// Block-edge tick marks at the bottom of the grass band — the "ground block" look.
		const blockW = 32;
		for (let x = sx + blockW; x < ex - 4; x += blockW) {
			const bx = x + wobble(x, 47, 2);
			g.moveTo(bx, surfaceY + grassH)
				.lineTo(bx, surfaceY + grassH + 4)
				.stroke({ color: 0x3c1e08, width: 1, alpha: 0.35 });
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
		// Goomba-inspired angry brow — two thick dark wedge strokes over the eyes,
		// angled inward to give a classic disgruntled scowl. Never obscures eyes.
		const eyeY = isLurker ? 12 : headY - 2;
		const browOffset = isLurker ? 0 : 0;

		// Left brow: angled inward-downward.
		f.moveTo(-hw * 0.55 + browOffset, eyeY - 5)
			.lineTo(-hw * 0.18 + browOffset, eyeY - 2)
			.stroke({ color: 0x2a1008, width: 2.5, alpha: 0.85, cap: "round" });

		// Right brow: mirror.
		f.moveTo(hw * 0.55 - browOffset, eyeY - 5)
			.lineTo(hw * 0.18 - browOffset, eyeY - 2)
			.stroke({ color: 0x2a1008, width: 2.5, alpha: 0.85, cap: "round" });

		// For crawlers, add a pair of tiny coin-gold "star" glints on the forehead
		// (like the gold markings on overworld goombas).
		if (kind === "crawler") {
			f.circle(-hw * 0.3, headY - 8, 1.8).fill({ color: 0xffcc00, alpha: 0.7 });
			f.circle(hw * 0.3, headY - 8, 1.8).fill({ color: 0xffcc00, alpha: 0.7 });
		}
	},
};
