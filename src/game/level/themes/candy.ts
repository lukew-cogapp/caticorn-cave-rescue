import type { Container, Graphics } from "pixi.js";
import {
	drawCandyCaneLurker,
	drawGingerbreadCrawler,
	drawGumdropBat,
} from "../../art/themes/candy/monsters";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Gumdrop Grotto: a sweet pastel candy-land cave with lollipop trees, giant
 * candy canes, iced-biscuit platforms, chocolate-icing floors scattered with
 * sprinkles and gumdrops. Bright + airy lighting, no mechanic tweaks.
 */
export const candyPack: ThemePack = {
	style: "candy",
	name: "Gumdrop Grotto",
	bg: ["#3a2336", "#1e1220"],
	accent: "#ff7ec4",
	ceilingKinds: ["icicle", "icicle", "crystal"],
	floorKinds: ["pebble", "crystal", "pebble"],
	ambient: "sprinkle",
	lighting: { color: 0x2a1430, intensity: 0.2 },

	// -------------------------------------------------------------------------
	// Far silhouettes: gumdrop hills + peppermint swirl discs in the distance.
	// -------------------------------------------------------------------------
	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		rng: Rng,
	): void {
		// Gumdrop dome hills along the floor horizon.
		for (let x = rng(40, 120); x < worldWidth; x += rng(110, 220)) {
			const dw = rng(32, 68);
			const dh = rng(18, 38);
			const base = GAME_HEIGHT - 58;
			g.ellipse(x, base - dh * 0.4, dw, dh).fill({
				color: wallFar,
				alpha: 0.13,
			});
			// Highlight dome cap — pale sugary shimmer.
			g.ellipse(x - dw * 0.1, base - dh * 0.75, dw * 0.38, dh * 0.3).fill({
				color: wallMid,
				alpha: 0.09,
			});
		}
		// Peppermint swirl discs floating mid-air (simple concentric ring pairs).
		for (let x = rng(80, 180); x < worldWidth; x += rng(200, 360)) {
			const cx = x + wobble(x, 11, 20);
			const cy = GAME_HEIGHT * 0.38 + wobble(x, 17, 28);
			const r = rng(14, 28);
			g.circle(cx, cy, r).fill({ color: wallFar, alpha: 0.1 });
			g.circle(cx, cy, r * 0.62).fill({ color: wallMid, alpha: 0.08 });
		}
	},

	// -------------------------------------------------------------------------
	// Mid details: giant candy canes drooping from the ceiling.
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
		// Candy-cane drips: two parallel tapered columns (red + white stripe pair).
		for (let x = rng(50, 130); x < worldWidth; x += rng(110, 200)) {
			const caneW = rng(5, 10);
			const caneLen = rng(28, 60);
			// Shadow body.
			g.roundRect(x - caneW, 0, caneW * 2, caneLen, caneW * 0.4).fill({
				color: wallMid,
				alpha: 0.22,
			});
			// Lit sliver — the white stripe of the cane.
			g.roundRect(x - caneW * 0.5, 0, caneW * 0.55, caneLen * 0.9, 1).fill({
				color: wallLight,
				alpha: 0.12,
			});
			// Curved hook at the bottom tip (a partial arc approximated by a small
			// ellipse segment, no trig needed — just a squished circle).
			const hookR = caneW * 1.1;
			g.ellipse(x + hookR * 0.6, caneLen, hookR, hookR * 0.55).fill({
				color: wallMid,
				alpha: 0.18,
			});
		}
		return true;
	},

	// -------------------------------------------------------------------------
	// Near silhouettes: lollipop trees (disc on stick) + large gumdrop mounds.
	// -------------------------------------------------------------------------
	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): void {
		// Lollipop trees: a stick rising from the floor with a swirl disc on top.
		for (let x = rng(60, 160); x < worldWidth; x += rng(180, 340)) {
			const stickH = rng(45, 80);
			const discR = rng(18, 34);
			const base = GAME_HEIGHT - 22;
			const stickX = x + wobble(x, 7, 14);
			// Stick.
			g.roundRect(stickX - 3, base - stickH, 6, stickH, 2).fill({
				color: wallNear,
				alpha: 0.26,
			});
			// Main disc.
			g.circle(stickX, base - stickH, discR).fill({
				color: wallNear,
				alpha: 0.3,
			});
			// Lit half — the peppermint swirl highlight (just a half-disc).
			g.poly([
				stickX,
				base - stickH - discR,
				stickX + discR,
				base - stickH,
				stickX,
				base - stickH,
			]).fill({ color: wallLight, alpha: 0.12 });
			// Outer ring for swirl depth.
			g.circle(stickX, base - stickH, discR).stroke({
				color: wallLight,
				width: 1.2,
				alpha: 0.1,
			});
		}
		// Large gumdrop mounds at the floor edge.
		for (let x = rng(30, 100); x < worldWidth; x += rng(220, 420)) {
			const gw = rng(40, 72);
			const gh = rng(28, 52);
			const base = GAME_HEIGHT - 22;
			g.ellipse(x + wobble(x, 13, 22), base - gh * 0.45, gw, gh).fill({
				color: wallNear,
				alpha: 0.25,
			});
		}
	},

	// -------------------------------------------------------------------------
	// Platform tones: iced biscuit — warm honey-tan body with a pale icing rim.
	// -------------------------------------------------------------------------
	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#6b4e2a", accent, 0.32), // biscuit brown
			rimCol: tint("#f5d9b0", accent, 0.28), // pale icing rim
			shadowCol: tint("#3a2010", accent, 0.38),
			sideShade: tint("#4e3418", accent, 0.38),
			mottleCol: tint("#7c5c36", accent, 0.32),
			crackCol: tint("#2a180a", accent, 0.38),
		};
	},

	// -------------------------------------------------------------------------
	// Platform skin: candy-stripe bands (alternating pink + white) across the top.
	// -------------------------------------------------------------------------
	platformSkin(g: Graphics, width: number, height: number): void {
		if (width > 20 && height >= 6) {
			// Two candy-stripe bands at 1/3 and 2/3 across the top.
			const bandW = Math.min(width * 0.14, 10);
			const offsets = [0.28, 0.58];
			for (const t of offsets) {
				const bx = width * t + wobble(width * t, 61, width * 0.04);
				g.roundRect(bx, 1, bandW, Math.min(height - 2, 8), 1).fill({
					color: 0xff9ed8,
					alpha: 0.45,
				});
				// White stripe beside it.
				g.roundRect(
					bx + bandW + 1,
					1,
					bandW * 0.55,
					Math.min(height - 2, 8),
					1,
				).fill({
					color: 0xfff0f8,
					alpha: 0.3,
				});
			}
			// Icing drip: a small rounded blob hanging off the rim edge.
			const dripX = width * 0.42 + wobble(width, 67, width * 0.12);
			const dripH = 3 + Math.abs(wobble(width, 71, 1.5));
			g.roundRect(dripX, 0, 5, dripH, 2).fill({
				color: 0xffe8f4,
				alpha: 0.5,
			});
		}
	},

	// -------------------------------------------------------------------------
	// Floor tones: chocolate/icing ground — deep cocoa body with a pastel rim.
	// -------------------------------------------------------------------------
	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#5a2e18", accent, 0.35), // dark chocolate top
			bodyBot: tint("#2e1208", accent, 0.35),
			rimCol: tint("#f0c8a0", accent, 0.3), // icing rim
			mottle1: tint("#4a2410", accent, 0.38),
			mottle2: tint("#6e3c20", accent, 0.32),
			edgeDark: tint("#100500", accent, 0.12),
		};
	},

	// -------------------------------------------------------------------------
	// Floor surface: swirly icing piping + scattered sprinkles + a gumdrop or two.
	// -------------------------------------------------------------------------
	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		_accent: string | undefined,
	): void {
		// Icing swirl piping: a wavy horizontal squiggle just below the rim.
		const pipingSpacing = 72;
		for (let x = sx + 12; x < ex - 12; x += pipingSpacing) {
			const ox = x + wobble(x, 19, pipingSpacing * 0.3);
			const pw = 18 + Math.abs(wobble(x, 23, 8));
			// Three-point gentle wave (quadratic bezier approximated by poly).
			const midY = surfaceY + 2.5 + wobble(x, 29, 1.5);
			g.moveTo(ox, surfaceY + 4)
				.quadraticCurveTo(ox + pw * 0.5, midY - 2, ox + pw, surfaceY + 4)
				.stroke({ color: 0xffeef8, width: 1.8, alpha: 0.65 });
		}

		// Sprinkles: tiny coloured line segments at varied angles.
		// Angle variety via wobble (no trig): we use pre-baked unit vectors for
		// four directions (0°, 45°, 90°, 135°) and pick by index.
		const sprinkleDirections: [number, number][] = [
			[4, 0],
			[2.8, 2.8],
			[0, 4],
			[-2.8, 2.8],
		];
		const sprinkleColors = [
			0xff7ec4, // pink
			0x6ff0c8, // mint
			0xffe066, // yellow
			0xa78bff, // lavender
			0xff8c69, // coral
		];
		const sprinkleSpacing = 28;
		for (let x = sx + 6; x < ex - 6; x += sprinkleSpacing) {
			const sx2 = x + wobble(x, 37, sprinkleSpacing * 0.4);
			const sy2 = surfaceY + 1 + Math.abs(wobble(x, 41, 2.5));
			const dirIdx =
				Math.abs(Math.round(wobble(x, 43, 1.9))) % sprinkleDirections.length;
			const colIdx =
				Math.abs(Math.round(wobble(x, 47, 2.4))) % sprinkleColors.length;
			const [dx, dy] = sprinkleDirections[dirIdx];
			const col = sprinkleColors[colIdx];
			g.moveTo(sx2 - dx * 0.5, sy2 - dy * 0.5)
				.lineTo(sx2 + dx * 0.5, sy2 + dy * 0.5)
				.stroke({ color: col, width: 1.6, alpha: 0.82 });
		}

		// Gumdrops: small rounded teardrops placed sparsely.
		const gumdropColors = [0xff7ec4, 0x6ff0c8, 0xa78bff, 0xffe066];
		const gumdropSpacing = 120;
		for (let x = sx + 20; x < ex - 20; x += gumdropSpacing) {
			const gx = x + wobble(x, 53, gumdropSpacing * 0.35);
			const gy = surfaceY - 1;
			const gr = 4 + Math.abs(wobble(x, 57, 1.5));
			const colIdx =
				Math.abs(Math.round(wobble(x, 61, 1.9))) % gumdropColors.length;
			const col = gumdropColors[colIdx];
			// Body ellipse.
			g.ellipse(gx, gy - gr * 0.55, gr, gr * 1.1).fill({
				color: col,
				alpha: 0.88,
			});
			// Highlight dot.
			g.ellipse(gx - gr * 0.22, gy - gr * 0.85, gr * 0.28, gr * 0.2).fill({
				color: 0xffffff,
				alpha: 0.55,
			});
		}
	},

	// -------------------------------------------------------------------------
	// Monster reskins: gingerbread man, gumdrop bat, candy-cane lurker.
	// -------------------------------------------------------------------------
	/**
	 * Full per-kind monster reskins for Gumdrop Grotto:
	 *   - crawler  → gingerbread man (chocolate body, icing trim, candy-button eyes)
	 *   - bat      → winged gumdrop / wrapped-sweet critter (pastel dome + wrapper wings)
	 *   - lurker   → candy cane clinging from the ceiling, grown downward from y=0
	 *
	 * All keep the base gameplay footprint and origin conventions. Deterministic —
	 * no `Math.random`. When this hook fires, `monsterFlourish` is skipped entirely.
	 */
	monsterSkin(
		kind: "crawler" | "bat" | "lurker",
		accent: string | undefined,
	): Container | null {
		if (kind === "crawler") return drawGingerbreadCrawler(accent);
		if (kind === "bat") return drawGumdropBat(accent);
		if (kind === "lurker") return drawCandyCaneLurker(accent);
		return null;
	},

	// -------------------------------------------------------------------------
	// Monster flourish: a candy-shell glaze sheen + scattered sprinkle dots.
	// (Only runs when monsterSkin returns null for a kind — currently unused.)
	// -------------------------------------------------------------------------
	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void {
		// Glaze sheen: a pale ellipse arc across the top of the head.
		f.ellipse(0, headY - 2, hw * 0.7, 3).fill({
			color: 0xfff0fa,
			alpha: 0.38,
		});
		// Three tiny sprinkle dashes on the body.
		const sprinkleDashes: [number, number, number][] = [
			[-hw * 0.35, headY + 5, 0xff7ec4],
			[hw * 0.2, headY + 8, 0x6ff0c8],
			[-hw * 0.1, headY + 12, 0xffe066],
		];
		for (const [sx, sy, col] of sprinkleDashes) {
			f.moveTo(sx - 2, sy)
				.lineTo(sx + 2, sy + 1.5)
				.stroke({ color: col, width: 1.4, alpha: 0.75 });
		}
		// Candy-pink rim ring around the head.
		f.circle(0, headY, hw * 0.62).stroke({
			color: 0xff9ed8,
			width: 1,
			alpha: 0.38,
		});
		// For crawlers: a faint icing drip highlight on the shoulder area.
		if (!isLurker && kind === "crawler") {
			f.roundRect(-hw * 0.55, headY - 4, hw * 0.3, 4, 2).fill({
				color: 0xffe8f4,
				alpha: 0.22,
			});
		}
	},
};
