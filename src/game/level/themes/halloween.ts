import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../art/util";
import { GAME_HEIGHT } from "../../types";
import type { FloorTones, PlatformTones, Rng, ThemePack } from "../theme-pack";

/**
 * Pumpkin Hollow: a festive trick-or-treat Halloween cave — fun and kid-friendly,
 * not gory. Night-purple sky with a big full moon, bare spooky trees, bat swarms
 * and a witch-hat silhouette on the horizon. Carved jack-o'-lanterns and candy
 * corn dot the floor. Orange-tinted cobweb platforms, pumpkin-glow monster halos.
 *
 * Distinct from Spectre Crypt (dungeon-creepy green tomb) — this is warm
 * orange-purple festive Halloween.
 */
export const halloweenPack: ThemePack = {
	style: "halloween",
	name: "Pumpkin Hollow",
	bg: ["#241a3a", "#120c20"],
	accent: "#ff7a18",
	ceilingKinds: ["web", "web", "crack"],
	floorKinds: ["gravestone", "pebble"],
	ambient: "bat",
	lighting: { color: 0x1a0e28, intensity: 0.42 },

	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		_wallMid: number,
		rng: Rng,
	): void {
		// Large full moon — placed once, roughly centred on the level with slight
		// deterministic offset. Drawn as a bright cream disc + soft outer glow ring.
		const moonX = worldWidth * 0.38 + wobble(worldWidth, 11, worldWidth * 0.1);
		const moonY =
			GAME_HEIGHT * 0.18 + wobble(worldWidth, 13, GAME_HEIGHT * 0.06);
		const moonR = 36 + Math.abs(wobble(worldWidth, 17, 6));
		// Soft outer glow.
		g.circle(moonX, moonY, moonR + 10).fill({ color: 0xfff4c2, alpha: 0.07 });
		g.circle(moonX, moonY, moonR + 5).fill({ color: 0xfff8d8, alpha: 0.1 });
		// Moon disc.
		g.circle(moonX, moonY, moonR).fill({ color: 0xfff5cc, alpha: 0.82 });
		// Faint surface shading: a slightly darker arc on the right edge.
		g.circle(moonX + moonR * 0.22, moonY - moonR * 0.05, moonR * 0.82).fill({
			color: 0xe8ddb0,
			alpha: 0.18,
		});

		// Bat swarm silhouettes — small V-shapes drifting across the far sky.
		const batCount = 8;
		for (let i = 0; i < batCount; i++) {
			const bx =
				(worldWidth / (batCount + 1)) * (i + 1) +
				wobble(worldWidth + i, i * 17 + 3, worldWidth * 0.07);
			const by =
				GAME_HEIGHT * 0.08 +
				Math.abs(wobble(worldWidth + i, i * 23 + 7, GAME_HEIGHT * 0.12));
			const bw = 6 + Math.abs(wobble(bx, i * 31 + 5, 4));
			const bh = 3 + Math.abs(wobble(bx, i * 37 + 9, 2));
			// Left wing.
			g.poly([bx, by, bx - bw, by - bh, bx - bw * 0.45, by + bh * 0.4]).fill({
				color: wallFar,
				alpha: 0.28,
			});
			// Right wing.
			g.poly([bx, by, bx + bw, by - bh, bx + bw * 0.45, by + bh * 0.4]).fill({
				color: wallFar,
				alpha: 0.28,
			});
		}

		// Bare spooky tree silhouettes along the far horizon.
		for (let x = rng(60, 160); x < worldWidth - 40; x += rng(160, 320)) {
			const trunkH = rng(55, 90);
			const trunkW = rng(5, 9);
			const base = GAME_HEIGHT - 52;
			// Trunk.
			g.rect(x - trunkW * 0.5, base - trunkH, trunkW, trunkH).fill({
				color: wallFar,
				alpha: 0.22,
			});
			// Two main branches — reaching upward at angles.
			const branchLen = rng(28, 48);
			g.moveTo(x, base - trunkH * 0.72)
				.lineTo(x - branchLen, base - trunkH * 0.72 - branchLen * 0.6)
				.stroke({ color: wallFar, width: trunkW * 0.55, alpha: 0.22 });
			g.moveTo(x, base - trunkH * 0.56)
				.lineTo(x + branchLen * 0.85, base - trunkH * 0.56 - branchLen * 0.5)
				.stroke({ color: wallFar, width: trunkW * 0.45, alpha: 0.2 });
			// Thin twigs off the main branches.
			const bOff = branchLen * 0.55;
			g.moveTo(x - bOff, base - trunkH * 0.72 - bOff * 0.6)
				.lineTo(x - bOff - 10, base - trunkH * 0.72 - bOff * 0.6 - 14)
				.stroke({ color: wallFar, width: 1.2, alpha: 0.17 });
			g.moveTo(x - bOff, base - trunkH * 0.72 - bOff * 0.6)
				.lineTo(x - bOff + 7, base - trunkH * 0.72 - bOff * 0.6 - 12)
				.stroke({ color: wallFar, width: 1.2, alpha: 0.17 });
		}
	},

	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		_wallFar: number,
		wallNear: number,
		_wallLight: number,
		rng: Rng,
	): void {
		// Witch hat silhouettes on the near horizon — pointy brim-and-cone shapes.
		for (let x = rng(80, 200); x < worldWidth - 60; x += rng(320, 550)) {
			const brimW = rng(28, 42);
			const hatH = rng(38, 58);
			const base = GAME_HEIGHT - 24;
			// Brim (flat wide ellipse-ish shape).
			g.ellipse(x, base, brimW * 0.5, 6).fill({ color: wallNear, alpha: 0.32 });
			// Cone.
			g.poly([
				x - brimW * 0.38,
				base,
				x + brimW * 0.38,
				base,
				x + rng(-5, 5),
				base - hatH,
			]).fill({ color: wallNear, alpha: 0.32 });
			// Brim buckle band detail.
			g.rect(x - brimW * 0.22, base - hatH * 0.18, brimW * 0.44, 4).fill({
				color: wallNear,
				alpha: 0.18,
			});
		}

		// Large near-plane bare trees — taller, more menacing than the far ones.
		for (let x = rng(50, 140); x < worldWidth - 30; x += rng(260, 460)) {
			const trunkH = rng(90, 130);
			const trunkW = rng(8, 14);
			const base = GAME_HEIGHT - 22;
			g.rect(x - trunkW * 0.5, base - trunkH, trunkW, trunkH).fill({
				color: wallNear,
				alpha: 0.28,
			});
			// Three branching arms.
			for (let arm = 0; arm < 3; arm++) {
				const sign = arm % 2 === 0 ? -1 : 1;
				const armLen = rng(30, 55);
				const armY = base - trunkH * (0.45 + arm * 0.18);
				g.moveTo(x, armY)
					.lineTo(x + sign * armLen, armY - armLen * rng(0.45, 0.7))
					.stroke({
						color: wallNear,
						width: trunkW * (0.5 - arm * 0.1),
						alpha: 0.26,
					});
			}
		}

		// Haunted-house silhouette on the far right horizon — one per level.
		const houseX =
			worldWidth * 0.78 + wobble(worldWidth, 41, worldWidth * 0.06);
		const houseBase = GAME_HEIGHT - 22;
		const houseW = 60;
		const houseH = 54;
		// Main house block.
		g.rect(houseX - houseW * 0.5, houseBase - houseH, houseW, houseH).fill({
			color: wallNear,
			alpha: 0.24,
		});
		// Steep pointed roof.
		g.poly([
			houseX - houseW * 0.52,
			houseBase - houseH,
			houseX + houseW * 0.52,
			houseBase - houseH,
			houseX + wobble(worldWidth, 43, 4),
			houseBase - houseH - 36,
		]).fill({ color: wallNear, alpha: 0.26 });
		// Turret on the left.
		const turretX = houseX - houseW * 0.28;
		g.rect(turretX - 8, houseBase - houseH - 22, 16, 26).fill({
			color: wallNear,
			alpha: 0.22,
		});
		g.poly([
			turretX - 9,
			houseBase - houseH - 22,
			turretX + 9,
			houseBase - houseH - 22,
			turretX,
			houseBase - houseH - 38,
		]).fill({ color: wallNear, alpha: 0.24 });
		// Dark windows (black rectangles cut-out look).
		g.rect(houseX - 14, houseBase - houseH + 14, 10, 12).fill({
			color: 0xffd060,
			alpha: 0.18,
		});
		g.rect(houseX + 4, houseBase - houseH + 14, 10, 12).fill({
			color: 0xffd060,
			alpha: 0.18,
		});
	},

	platformTones(accent: string | undefined): PlatformTones {
		return {
			bodyCol: tint("#3a2850", accent, 0.38),
			rimCol: tint("#5e4878", accent, 0.38),
			shadowCol: tint("#221630", accent, 0.42),
			sideShade: tint("#2e1e3e", accent, 0.42),
			mottleCol: tint("#4a3860", accent, 0.38),
			crackCol: tint("#28184a", accent, 0.42),
		};
	},

	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void {
		// Cobweb corner: faint radial threads in the top-left corner, giving a
		// spooky haunted-shelf look without obscuring the platform body.
		if (width > 32 && height >= 8) {
			const cx = width * 0.12;
			const cy = 3;
			const maxR = Math.min(width * 0.22, height * 1.4, 14);
			// Radial strands.
			for (let i = 0; i < 5; i++) {
				const angle = (Math.PI * 0.55 * i) / 4; // sweep ~0 to ~PI/2
				const ex2 = cx + Math.cos(angle) * maxR;
				const ey = cy + Math.sin(angle) * maxR;
				g.moveTo(cx, cy)
					.lineTo(ex2, ey)
					.stroke({ color: crackCol, width: 0.6, alpha: 0.38 });
			}
			// Two arc cross-strands.
			for (let arc = 1; arc <= 2; arc++) {
				const r = maxR * (arc / 2.5);
				const a0 = 0;
				const a1 = Math.PI * 0.5;
				const pts: number[] = [];
				const steps = 4;
				for (let s = 0; s <= steps; s++) {
					const a = a0 + ((a1 - a0) * s) / steps;
					pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
				}
				for (let s = 0; s < pts.length - 2; s += 2) {
					g.moveTo(pts[s], pts[s + 1])
						.lineTo(pts[s + 2], pts[s + 3])
						.stroke({ color: crackCol, width: 0.5, alpha: 0.3 });
				}
			}
		}
		// Hairline crack (same rhythm as default, keeps structural read).
		if (height >= 10 && width > 28) {
			const crackX = width * 0.62 + wobble(width + height, 43, width * 0.18);
			const jx = wobble(width, 47, 3);
			const crackLen = Math.min(height - 4, 10);
			const cw = Math.max(0.6, height * 0.06);
			g.moveTo(crackX, 3)
				.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
				.lineTo(crackX + jx, 3 + crackLen)
				.stroke({ color: crackCol, width: cw, alpha: 0.28 });
		}
	},

	floorTones(accent: string | undefined): FloorTones {
		return {
			bodyTop: tint("#3a2e50", accent, 0.4),
			bodyBot: tint("#1e1630", accent, 0.4),
			rimCol: tint("#6a5888", accent, 0.36),
			mottle1: tint("#3e2e58", accent, 0.4),
			mottle2: tint("#524268", accent, 0.36),
			edgeDark: tint("#0c071a", accent, 0.15),
		};
	},

	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void {
		const spanW = ex - sx;

		// --- Jack-o'-lanterns ---
		// Placed at deterministic intervals, varying in size. Each is a simple
		// carved pumpkin: orange oval body, dark triangles for eyes and mouth,
		// stem nub, and a warm inner glow ellipse to sell the candle-lit look.
		const jSpacing = 180;
		for (let x = sx + 40; x < ex - 40; x += jSpacing) {
			const jx = x + wobble(x, 101, jSpacing * 0.28);
			const jy = surfaceY + 2; // sits just below the floor rim
			const jw = 16 + Math.abs(wobble(x, 103, 5)); // half-width
			const jh = 12 + Math.abs(wobble(x, 107, 4)); // half-height

			// Inner glow — warm orange bloom before the body so it layers under.
			g.ellipse(jx, jy, jw * 1.5, jh * 1.4).fill({
				color: 0xff8800,
				alpha: 0.13,
			});

			// Pumpkin body — orange oval.
			g.ellipse(jx, jy, jw, jh).fill({
				color: tint("#e8620a", accent, 0.18),
				alpha: 0.9,
			});
			// Body ribbing: two faint vertical seams.
			g.ellipse(jx - jw * 0.35, jy, jw * 0.18, jh * 0.85).fill({
				color: 0x0,
				alpha: 0.08,
			});
			g.ellipse(jx + jw * 0.35, jy, jw * 0.18, jh * 0.85).fill({
				color: 0x0,
				alpha: 0.08,
			});

			// Stem (dark green nub on top).
			g.rect(jx - 2, jy - jh - 4, 4, 6).fill({ color: 0x2e5a18, alpha: 0.9 });

			// Carved face: triangle eyes and a jagged-grin mouth (dark cutouts).
			// Left eye triangle (pointing down).
			const eyeSize = jw * 0.22;
			g.poly([
				jx - jw * 0.34,
				jy - jh * 0.2,
				jx - jw * 0.34 + eyeSize,
				jy - jh * 0.2,
				jx - jw * 0.34 + eyeSize * 0.5,
				jy - jh * 0.2 + eyeSize * 1.1,
			]).fill({ color: 0x0e0610, alpha: 0.88 });
			// Right eye triangle.
			g.poly([
				jx + jw * 0.12,
				jy - jh * 0.2,
				jx + jw * 0.12 + eyeSize,
				jy - jh * 0.2,
				jx + jw * 0.12 + eyeSize * 0.5,
				jy - jh * 0.2 + eyeSize * 1.1,
			]).fill({ color: 0x0e0610, alpha: 0.88 });
			// Jagged mouth: four triangular teeth (alternating up/down).
			const mouthY = jy + jh * 0.18;
			const mouthW = jw * 1.0;
			const toothW = mouthW / 4;
			for (let t = 0; t < 4; t++) {
				const tx = jx - mouthW * 0.5 + t * toothW;
				const upTooth = t % 2 === 0;
				g.poly([
					tx,
					mouthY,
					tx + toothW,
					mouthY,
					tx + toothW * 0.5,
					mouthY + (upTooth ? -jh * 0.24 : jh * 0.24),
				]).fill({ color: 0x0e0610, alpha: 0.85 });
			}
			// Bright inner candle glow — a small warm circle centred on the face.
			g.circle(jx, jy + jh * 0.05, jw * 0.28).fill({
				color: 0xffc040,
				alpha: 0.22,
			});
		}

		// --- Candy corn ---
		// Scattered small candy corn shapes (three-band triangles) in orange/yellow/white.
		const candySpacing = 90;
		for (let x = sx + 18; x < ex - 18; x += candySpacing) {
			const cx2 = x + wobble(x, 113, candySpacing * 0.38);
			// Only draw every other slot to keep them sparse.
			if (Math.abs(wobble(cx2, 119, 1)) < 0.55) continue;
			const cy = surfaceY + 4;
			const cw2 = 5 + Math.abs(wobble(cx2, 117, 2));
			const ch = 9 + Math.abs(wobble(cx2, 121, 3));
			// White tip (top third).
			g.poly([
				cx2 - cw2 * 0.25,
				cy - ch,
				cx2 + cw2 * 0.25,
				cy - ch,
				cx2 + cw2 * 0.38,
				cy - ch * 0.68,
				cx2 - cw2 * 0.38,
				cy - ch * 0.68,
			]).fill({ color: 0xf0f0f0, alpha: 0.82 });
			// Orange middle band.
			g.poly([
				cx2 - cw2 * 0.38,
				cy - ch * 0.68,
				cx2 + cw2 * 0.38,
				cy - ch * 0.68,
				cx2 + cw2 * 0.65,
				cy - ch * 0.32,
				cx2 - cw2 * 0.65,
				cy - ch * 0.32,
			]).fill({ color: 0xff7a18, alpha: 0.88 });
			// Yellow base.
			g.poly([
				cx2 - cw2 * 0.65,
				cy - ch * 0.32,
				cx2 + cw2 * 0.65,
				cy - ch * 0.32,
				cx2 + cw2,
				cy,
				cx2 - cw2,
				cy,
			]).fill({ color: 0xffdd00, alpha: 0.88 });
		}

		// Sparse glowing dots along the rim — residual pumpkin-light scatter.
		const glowSpacing = 72;
		for (let x = sx + 20; x < ex - 20; x += glowSpacing) {
			const gx = x + wobble(x, 127, glowSpacing * 0.3);
			if (Math.abs(wobble(gx, 131, 1)) > 0.7) {
				g.circle(gx, surfaceY + 4, 2).fill({ color: 0xff8800, alpha: 0.2 });
			}
		}

		// Halloween-purple moss accent (replaces plain green moss).
		const mossCol = tint("#4a2e5a", accent, 0.28);
		const mossLit = tint("#6a4a7a", accent, 0.28);
		const mossSpacing = 76;
		for (let x = sx + 12; x < ex - 12; x += mossSpacing) {
			if (Math.abs(wobble(x, 137, 1)) < 0.3) continue; // skip ~15% of slots
			const mx = x + wobble(x, 23, mossSpacing * 0.35);
			const mh = 4 + Math.abs(wobble(x, 29, 2));
			g.poly([
				mx - 4,
				surfaceY + 3,
				mx + 4,
				surfaceY + 3,
				mx,
				surfaceY + 3 - mh,
			]).fill({ color: mossCol, alpha: 0.5 });
			g.poly([
				mx + 2,
				surfaceY + 3,
				mx + 8,
				surfaceY + 3,
				mx + 5,
				surfaceY + 3 - mh * 0.7,
			]).fill({ color: mossLit, alpha: 0.38 });
		}

		// Suppress "unused" lint warning — spanW used for optional future guard.
		void spanW;
	},

	monsterFlourish(
		_c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		_headY: number,
		_hw: number,
	): void {
		// Pumpkin-glow under-halo: a warm orange ellipse below/above the monster
		// body that sells the jack-o'-lantern candle-light ambience.
		const glowY = isLurker ? 28 : -2;
		f.ellipse(0, glowY, 16, 5).fill({ color: 0xff7010, alpha: 0.2 });
		f.ellipse(0, glowY, 10, 3).fill({ color: 0xffc040, alpha: 0.14 });

		// Tiny witch hat perched on the head — cute and festive, not scary.
		// Brim + cone in near-black purple, slightly different for lurker
		// (ceiling-facing) vs ground monster.
		const hatBaseY = isLurker ? 30 : kind === "bat" ? -20 : -24;
		const hatDir = isLurker ? 1 : -1; // 1 = hat spike goes down for lurker
		const brimHalfW = 9;
		// Brim.
		f.ellipse(0, hatBaseY, brimHalfW, 3).fill({ color: 0x1e1030, alpha: 0.82 });
		// Cone (points away from body in the monster's "up" direction).
		f.poly([
			-brimHalfW * 0.7,
			hatBaseY,
			brimHalfW * 0.7,
			hatBaseY,
			2,
			hatBaseY + hatDir * -16,
		]).fill({ color: 0x1e1030, alpha: 0.82 });
		// Orange hat-band.
		f.rect(-brimHalfW * 0.6, hatBaseY + hatDir * -4, brimHalfW * 1.2, 2.5).fill(
			{
				color: 0xff7a18,
				alpha: 0.72,
			},
		);
	},
};
