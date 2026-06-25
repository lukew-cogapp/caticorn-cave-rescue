import type { Container, Graphics } from "pixi.js";
import {
	drawDiscoBat,
	drawDiscoCrawler,
} from "../../art/themes/disco/monsters";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Neon Hollow: a hot neon-magenta dance-floor cave with mirror-ball silhouettes,
 * radiating light beams, light-up checkerboard floors and sparkle-rimmed monsters.
 * No physics changes — the disco vibe is purely visual.
 */
export const discoPack: ThemePack = {
	style: "disco",
	name: "Neon Hollow",
	bg: ["#1a0a2e", "#0c0518"],
	accent: "#ff3df0",
	ceilingKinds: ["crystal", "crack"],
	floorKinds: ["pebble", "gemcluster", "crystal"],
	ambient: "confetti",
	/** Purple-magenta night wash, kept modest so neon reads through it. */
	lighting: { color: 0x2a0a3a, intensity: 0.32 },

	// ---------------------------------------------------------------------------
	// Far layer: mirror-ball disc silhouettes + radiating light beams
	// ---------------------------------------------------------------------------
	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
		// A handful of large dim discs evoke distant mirror balls / disco globes.
		for (let x = rng(120, 240); x < worldWidth; x += rng(280, 480)) {
			const r = rng(22, 44);
			const y = rng(GAME_HEIGHT * 0.08, GAME_HEIGHT * 0.32);
			// Outer halo glow.
			g.ellipse(x, y, r * 1.55, r * 1.55).fill({
				color: 0xff00e0,
				alpha: 0.04,
			});
			// Core disc.
			g.ellipse(x, y, r, r).fill({ color: 0xcc00cc, alpha: 0.07 });

			// Radiating beams from the disc centre (8 spokes, low alpha).
			const spokeCount = 8;
			const spokeLen = rng(90, 180);
			for (let i = 0; i < spokeCount; i++) {
				// Use wobble to derive a stable angle offset per spoke + disc position.
				const angleBase = (Math.PI * 2 * i) / spokeCount;
				const angleShift = wobble(x + i * 13.7, i * 17 + 3, 0.18);
				const angle = angleBase + angleShift;
				const ex = x + Math.cos(angle) * spokeLen;
				const ey = y + Math.sin(angle) * spokeLen;
				g.moveTo(x, y)
					.lineTo(ex, ey)
					.stroke({ color: 0xe040fb, width: rng(0.8, 1.8), alpha: 0.07 });
			}
		}

		// Faint horizontal colour-band streaks across the far wall (stage lighting).
		const bandColors = [0xff3df0, 0x00e5ff, 0xffff00];
		for (let yi = 0; yi < 3; yi++) {
			const y = GAME_HEIGHT * 0.18 + yi * GAME_HEIGHT * 0.2 + wobble(yi, 31, 8);
			const col = bandColors[yi % bandColors.length];
			g.rect(0, y, worldWidth, rng(1, 2.5)).fill({ color: col, alpha: 0.05 });
		}
	},

	// ---------------------------------------------------------------------------
	// Near layer: closer mirror-ball + beam shapes for depth
	// ---------------------------------------------------------------------------
	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		_wallLight: number,
		rng: Rng,
	): void {
		// Dark angular wall panels evoke a night-club interior.
		for (let x = rng(60, 160); x < worldWidth; x += rng(240, 420)) {
			const bw = rng(28, 52);
			const bh = rng(30, 70);
			const base = GAME_HEIGHT - 22;
			g.poly([
				x - bw * 0.5,
				base,
				x + bw * 0.5,
				base,
				x + bw * 0.4,
				base - bh * 0.5,
				x + bw * 0.15,
				base - bh,
				x - bw * 0.2,
				base - bh * 0.9,
				x - bw * 0.45,
				base - bh * 0.45,
			]).fill({ color: wallNear, alpha: 0.28 });
			// Thin neon edge stripe on the panel.
			g.moveTo(x - bw * 0.45, base - bh * 0.45)
				.lineTo(x + bw * 0.15, base - bh)
				.stroke({ color: 0xff3df0, width: 1, alpha: 0.22 });
		}

		// Larger near mirror-ball with facet cross-hatch.
		for (let x = rng(200, 380); x < worldWidth; x += rng(480, 720)) {
			const r = rng(18, 32);
			const y = rng(GAME_HEIGHT * 0.06, GAME_HEIGHT * 0.22);
			g.ellipse(x, y, r, r).fill({ color: 0x1a0030, alpha: 0.35 });
			// Bright ring.
			g.ellipse(x, y, r, r).stroke({ color: 0xff3df0, width: 1.2, alpha: 0.3 });
			// Facet grid lines (horizontal + vertical cross-hatch).
			const lines = 4;
			for (let li = -lines; li <= lines; li++) {
				const offset = (r * li) / lines;
				const half = Math.sqrt(Math.max(0, r * r - offset * offset));
				g.moveTo(x - half, y + offset)
					.lineTo(x + half, y + offset)
					.stroke({ color: 0xe040fb, width: 0.6, alpha: 0.18 });
				g.moveTo(x + offset, y - half)
					.lineTo(x + offset, y + half)
					.stroke({ color: 0x00e5ff, width: 0.6, alpha: 0.18 });
			}
		}
	},

	// ---------------------------------------------------------------------------
	// Platform tones: deep purple body with neon magenta rim
	// ---------------------------------------------------------------------------
	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#2a1038", accent, 0.35),
			rimCol: tint("#cc00cc", accent, 0.45),
			shadowCol: tint("#150820", accent, 0.4),
			sideShade: tint("#1e0a2c", accent, 0.4),
			mottleCol: tint("#3a1850", accent, 0.35),
			crackCol: tint("#1a0828", accent, 0.4),
		};
	},

	// ---------------------------------------------------------------------------
	// Platform skin: neon edge stripe along the top surface
	// ---------------------------------------------------------------------------
	platformSkin(g: Graphics, width: number, height: number): void {
		if (width > 16) {
			// Bright magenta rim stripe.
			g.rect(width * 0.04, 0, width * 0.92, 1.5).fill({
				color: 0xff3df0,
				alpha: 0.65,
			});
			// Softer secondary stripe.
			g.rect(width * 0.04, 1.5, width * 0.92, 1).fill({
				color: 0x9900cc,
				alpha: 0.3,
			});
		}
		// Faint neon seam crack.
		if (height >= 8 && width > 20) {
			const crackX = width * 0.52 + wobble(width + height, 43, width * 0.2);
			const jx = wobble(width, 47, 3);
			const crackLen = Math.min(height - 4, 10);
			const cw = Math.max(0.6, height * 0.06);
			g.moveTo(crackX, 3)
				.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
				.lineTo(crackX + jx, 3 + crackLen)
				.stroke({ color: 0xe040fb, width: cw, alpha: 0.45 });
		}
	},

	// ---------------------------------------------------------------------------
	// Floor tones: dark base with neon-purple rim
	// ---------------------------------------------------------------------------
	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#1e0a2e", accent, 0.4),
			bodyBot: tint("#0e0518", accent, 0.4),
			rimCol: tint("#cc00cc", accent, 0.45),
			mottle1: tint("#2a1040", accent, 0.4),
			mottle2: tint("#3a1858", accent, 0.35),
			edgeDark: tint("#060310", accent, 0.15),
		};
	},

	// ---------------------------------------------------------------------------
	// Floor surface: light-up dance-floor checkerboard tiles
	// ---------------------------------------------------------------------------
	/**
	 * Draws an unmistakably disco light-up dance floor: alternating neon-tinted
	 * square tiles with glossy highlight dots. Tile colour is derived from the
	 * tile's world x-position (no Math.random) so it's always deterministic + static
	 * (safe for cacheAsTexture).
	 */
	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		_accent: string | undefined,
	): void {
		const tileW = 24;
		const tileH = 14;
		// Tile palette: 4 neon hues cycling by tile index.
		const tileColors = [0xff3df0, 0x00e5ff, 0xffff00, 0xff0080];
		// Snapped start so tiles align regardless of span offset.
		const startX = Math.floor(sx / tileW) * tileW;

		for (let tx = startX; tx < ex; tx += tileW) {
			if (tx + tileW < sx) continue;
			const clampX = Math.max(tx, sx);
			const clampW = Math.min(tx + tileW, ex) - clampX;
			if (clampW <= 0) continue;

			// Tile index from position — deterministic colour selection.
			const tileIndex = Math.floor(tx / tileW);
			// Alternate rows in a checkerboard by flipping even/odd tile index.
			const colorIdx = ((tileIndex % 2) + (tileIndex < 0 ? 2 : 0)) % 2;
			// Pick from palette using tile x + a wobble-derived offset.
			const paletteShift = Math.abs(Math.floor(wobble(tx, 71, 1.9))) % 2;
			const col = tileColors[(colorIdx + paletteShift) % tileColors.length];

			// Tile body — slightly inset for grout gap.
			const grout = 1;
			g.rect(
				clampX + grout,
				surfaceY + grout,
				clampW - grout * 2,
				tileH - grout,
			).fill({
				color: col,
				alpha: 0.18,
			});

			// Glossy highlight dot in tile centre (only when tile is fully visible).
			if (clampW >= tileW - 2) {
				const cx = tx + tileW * 0.35;
				const cy = surfaceY + tileH * 0.3;
				g.ellipse(cx, cy, 3, 2).fill({ color: 0xffffff, alpha: 0.3 });
			}
		}

		// Bright neon rim line running the full span.
		g.rect(sx, surfaceY, ex - sx, 1.5).fill({ color: 0xff3df0, alpha: 0.55 });
		// Softer secondary glow just below.
		g.rect(sx, surfaceY + 1.5, ex - sx, 1).fill({
			color: 0x9900cc,
			alpha: 0.25,
		});
	},

	// ---------------------------------------------------------------------------
	// Monster reskins: full per-kind replacements (crawler + bat only)
	// ---------------------------------------------------------------------------
	/**
	 * Full monster reskins for Neon Hollow:
	 *   - crawler → Groovy Dancing Bot (boxy neon robot, stompable head on top)
	 *   - bat     → Light-Up Disco Critter (mirror-ball sphere body, neon spots)
	 *   - lurker  → null (base lurker kept; disco flourish still applies)
	 *
	 * Both reskins stay within the base kind's footprint, use bottom-centre origin
	 * drawn upward, and are fully deterministic (no `Math.random`).
	 * When this hook returns a container, `monsterFlourish` is skipped for that kind.
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawDiscoCrawler(accent);
		if (kind === "bat") return drawDiscoBat(accent);
		return null; // lurker: base shape + monsterFlourish handles the disco rim
	},

	// ---------------------------------------------------------------------------
	// Monster flourish: neon sparkle rim + tiny colour dots (lurker only now)
	// ---------------------------------------------------------------------------
	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Neon magenta outer rim around the monster body silhouette.
		if (!isLurker) {
			const rimR = kind === "crawler" ? 17 : 12;
			const rimY = kind === "crawler" ? -14 : -12;
			f.ellipse(0, rimY, rimR, rimR - 3).stroke({
				color: "#ff3df0",
				width: 1.2,
				alpha: 0.5,
			});
		} else {
			f.roundRect(-16, 5, 32, 24, 12).stroke({
				color: "#ff3df0",
				width: 1.2,
				alpha: 0.5,
			});
		}

		// Three small neon sparkle dots positioned deterministically around the body.
		// Use headY and hw as seeds so each monster kind gets a unique pattern.
		const sparklePositions: [number, number][] = [
			[hw * 0.6 + wobble(hw, 11, 3), headY - 4 + wobble(headY, 13, 4)],
			[-hw * 0.5 + wobble(hw, 17, 2), headY + 2 + wobble(headY, 19, 3)],
			[wobble(hw, 23, hw * 0.4), headY - 10 + wobble(headY, 29, 5)],
		];
		const sparkleColors = [0xff3df0, 0x00e5ff, 0xffff00];
		for (let i = 0; i < sparklePositions.length; i++) {
			const [sx, sy] = sparklePositions[i];
			f.circle(sx, sy, 1.8).fill({
				color: sparkleColors[i % sparkleColors.length],
				alpha: 0.85,
			});
		}

		// Tiny under-glow ellipse for a stage-light feel.
		const glowY = isLurker ? 30 : 2;
		f.ellipse(0, glowY, 16, 4).fill({ color: 0xff3df0, alpha: 0.12 });
	},
};
