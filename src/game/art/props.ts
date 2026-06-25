import { Container, Graphics, Text } from "pixi.js";
import type { ThemeStyle } from "../level/themes";
import { tint } from "./util";

/**
 * Iron manacle clamped on a captive caticorn (freed on contact). Two rounded
 * iron cuffs, each with a keyhole/bolt detail, joined by a slack chain of oval
 * links. Shaded cool-grey iron with lit edges and shadow. Bottom-centre origin,
 * sized to sit over a small caticorn. Purely decorative — the Game fades it out
 * on rescue.
 */
export function drawShackle(): Container {
	const c = new Container();
	const g = new Graphics();
	const iron = "#8a93a3";
	const ironLight = "#c2c9d4";
	const ironShadow = "#3f4654";

	// Slack hanging chain (a few oval links) drawn first so the cuffs sit on top.
	const links: [number, number][] = [
		[-4, -6],
		[-1.4, -3.6],
		[1.4, -3.6],
		[4, -6],
	];
	for (let i = 0; i < links.length; i++) {
		const [lx, ly] = links[i];
		// Alternate link orientation so the chain reads as interlocked.
		const horiz = i % 2 === 0;
		g.ellipse(lx, ly, horiz ? 2.4 : 1.6, horiz ? 1.6 : 2.4).stroke({
			color: ironShadow,
			width: 2.4,
		});
		g.ellipse(lx, ly, horiz ? 2.4 : 1.6, horiz ? 1.6 : 2.4).stroke({
			color: iron,
			width: 1.3,
		});
	}

	// Two cuffs around the lower body, each shaded with a lit top edge.
	for (const cx of [-9, 9]) {
		// Shadow ring.
		g.circle(cx, -8, 5.4).stroke({ color: ironShadow, width: 3.4 });
		// Main band.
		g.circle(cx, -8, 5).stroke({ color: iron, width: 3 });
		// Lit highlight on the upper-left arc.
		g.arc(cx, -8, 5, Math.PI * 1.05, Math.PI * 1.6).stroke({
			color: ironLight,
			width: 1.4,
			cap: "round",
		});
		// Keyhole/bolt detail on the face of the cuff.
		g.circle(cx, -8, 1.3).fill(ironShadow);
		g.rect(cx - 0.5, -8, 1, 2).fill(ironShadow);
	}

	c.addChild(g);
	return c;
}

/**
 * A barred iron cage trapping a caticorn (must be stomped to break). Shaded
 * vertical bars (lit edge + dark side each), a domed curved top with a hanging
 * ring, horizontal bands near the base and middle with rivets, and a little
 * padlock on the front. Cool-grey iron palette with highlights/shadows.
 * Bottom-centre origin (~40x50). The Game shatters + fades it on a stomp.
 */
export function drawCage(): Container {
	const c = new Container();
	const g = new Graphics();
	const bar = "#b9c0cc";
	const barLight = "#e2e6ee";
	const barDark = "#727a88";
	const barShadow = "#4d5360";
	const w = 40;
	const h = 50;

	// Base plinth, shaded.
	g.roundRect(-w / 2 - 1, -7, w + 2, 7, 2).fill(barShadow);
	g.roundRect(-w / 2, -7, w, 5, 2).fill(barDark);
	g.roundRect(-w / 2, -7, w, 2, 2).fill(bar);

	// Domed top: a filled shaded arch band the bars hang from.
	g.moveTo(-w / 2, -h + 8)
		.quadraticCurveTo(0, -h - 6, w / 2, -h + 8)
		.lineTo(w / 2, -h + 11)
		.quadraticCurveTo(0, -h - 1, -w / 2, -h + 11)
		.closePath()
		.fill(barDark);
	// Lit edge along the top of the dome.
	g.moveTo(-w / 2, -h + 8)
		.quadraticCurveTo(0, -h - 6, w / 2, -h + 8)
		.stroke({ color: barLight, width: 1.4, cap: "round" });

	// Hanging ring + a short hook above the dome.
	g.rect(-1, -h - 9, 2, 4).fill(barDark);
	g.circle(0, -h - 11, 3).stroke({ color: bar, width: 2 });
	g.arc(0, -h - 11, 3, Math.PI * 1.1, Math.PI * 1.7).stroke({
		color: barLight,
		width: 1,
		cap: "round",
	});

	// Vertical bars, each with a dark shadow side and a lit edge for roundness.
	for (let i = 0; i <= 5; i++) {
		const x = -w / 2 + (i / 5) * w;
		// Shadow side.
		g.moveTo(x + 0.7, -h + 9)
			.lineTo(x + 0.7, -5)
			.stroke({ color: barShadow, width: 2.6, cap: "round" });
		// Main bar.
		g.moveTo(x, -h + 9)
			.lineTo(x, -5)
			.stroke({ color: bar, width: 2.4, cap: "round" });
		// Lit edge.
		g.moveTo(x - 0.7, -h + 9)
			.lineTo(x - 0.7, -5)
			.stroke({ color: barLight, width: 0.9, cap: "round" });
	}

	// Horizontal bands (mid + lower) with rivets, drawn over the bars.
	for (const by of [-h + 20, -12]) {
		g.roundRect(-w / 2, by - 1.5, w, 3, 1.5).fill(barDark);
		g.rect(-w / 2, by - 1.5, w, 1).fill(barLight);
		// Rivets along the band.
		for (let i = 0; i <= 5; i++) {
			const rx = -w / 2 + (i / 5) * w;
			g.circle(rx, by, 1).fill(barShadow);
			g.circle(rx - 0.3, by - 0.3, 0.5).fill(barLight);
		}
	}

	// Little padlock hanging on the front, centred low.
	const lockY = -10;
	// Shackle of the lock.
	g.arc(0, lockY - 4, 2.6, Math.PI, 0).stroke({ color: bar, width: 1.6 });
	// Lock body.
	g.roundRect(-3.5, lockY - 4, 7, 7, 1.5).fill(barDark);
	g.roundRect(-3.5, lockY - 4, 7, 2, 1.5).fill(bar);
	// Keyhole.
	g.circle(0, lockY - 0.5, 1).fill(barShadow);
	g.rect(-0.4, lockY - 0.5, 0.8, 2).fill(barShadow);

	c.addChild(g);
	return c;
}

/**
 * Layer a subtle per-cave-theme flourish on top of an already-built monster
 * container. All geometry is fixed (no `Math.random` / `Date.now`) so the result
 * is fully deterministic. The flourish never covers the eyes, fangs, or key
 * silhouette of the creature.
 *
 * Coordinate space matches the drawMonster conventions:
 *   - crawler / bat: bottom-centre origin, body drawn upward (negative y).
 *   - lurker: ceiling-attach origin, body drawn downward (positive y).
 *
 * @param c - The container to add the flourish child to.
 * @param kind - Which monster shape, used to place decor correctly.
 * @param style - Theme variant; absent or unrecognised → no flourish.
 */
function addMonsterFlourish(
	c: Container,
	kind: "crawler" | "bat" | "lurker",
	style?: ThemeStyle,
): void {
	if (!style) return;

	const f = new Graphics();

	// Vertical offset so flourishes sit on the "head" regardless of creature
	// orientation. Crawler/bat draw upward; lurker draws downward.
	const isLurker = kind === "lurker";
	// Flourish anchor y: near the top of the body in each creature's coordinate.
	//   crawler top-of-spikes ≈ y=-28; bat top-of-ears ≈ y=-26; lurker top ≈ y=6.
	const headY = isLurker ? 6 : kind === "crawler" ? -28 : -26;
	// Side offset for crystal/ice features that flank the head.
	const hw = kind === "bat" ? 10 : 12;

	switch (style) {
		case "blossom": {
			// A tiny five-petal bloom on the head + a soft pink halo ring.
			// Petals at fixed angles (72° apart) — no trig needed, use poly points.
			// Halo: faint pink ring around the head.
			f.circle(0, headY, 7).stroke({ color: "#ffb8d8", width: 1, alpha: 0.5 });
			// Five petals using pre-computed unit positions * 4.5px radius.
			// angles: 90°, 162°, 234°, 306°, 18° (offset so top petal is up).
			// cos/sin constants (exact for 72° step, starting at -90°):
			const petalOffsets: [number, number][] = [
				[0, -4.5],
				[4.28, -1.39],
				[2.65, 3.64],
				[-2.65, 3.64],
				[-4.28, -1.39],
			];
			for (const [px, py] of petalOffsets) {
				f.ellipse(px, headY + py, 2.2, 1.4).fill({
					color: "#ffcce5",
					alpha: 0.88,
				});
			}
			// Golden centre.
			f.circle(0, headY, 1.8).fill("#ffe680");
			// Soft pink edge glow on the body outline.
			if (!isLurker) {
				// Crawler: rim along the top blob; bat: rim along the body ellipse.
				const rimY = kind === "crawler" ? -22 : -12;
				f.roundRect(-10, rimY - 3, 20, 4, 2).fill({
					color: "#ff9ec9",
					alpha: 0.18,
				});
			}
			break;
		}

		case "crystal": {
			// Three small crystal shards growing from the back/shoulders + gem glints.
			// Shard positions: centre-top and two sides.
			const shards: [number, number, number][] = [
				// [x, baseY, height]
				[0, headY + 2, 8],
				[-hw + 2, headY + 4, 5],
				[hw - 2, headY + 4, 5],
			];
			for (const [sx, sy, sh] of shards) {
				// Shard: a slim triangle, pale lavender with a bright edge.
				f.poly([sx - 2, sy, sx + 2, sy, sx, sy - sh]).fill({
					color: "#c0aaff",
					alpha: 0.75,
				});
				f.moveTo(sx - 2, sy)
					.lineTo(sx, sy - sh)
					.stroke({ color: "#e8dcff", width: 0.8, cap: "round", alpha: 0.9 });
			}
			// Two gem-glint sparkles: a tiny four-point star shape (two crossed lines).
			const glints: [number, number][] = [
				[-hw + 6, headY - 2],
				[hw - 6, headY - 2],
			];
			for (const [gx, gy] of glints) {
				f.moveTo(gx - 2, gy)
					.lineTo(gx + 2, gy)
					.stroke({ color: "#ffffff", width: 1, alpha: 0.85 });
				f.moveTo(gx, gy - 2)
					.lineTo(gx, gy + 2)
					.stroke({ color: "#ffffff", width: 1, alpha: 0.85 });
			}
			break;
		}

		case "ice": {
			// Pale blue frosty rim around the body + two small icicle tips + frosted
			// "eyebrow" strokes above the eyes (which are left fully intact below).
			// Rim: a faint icy outline offset just outside the body.
			if (!isLurker) {
				const rimR = kind === "crawler" ? 17 : 12;
				const rimY = kind === "crawler" ? -14 : -12;
				f.ellipse(0, rimY, rimR, rimR - 4).stroke({
					color: "#9fe0ff",
					width: 1.2,
					alpha: 0.5,
				});
			} else {
				f.roundRect(-16, 5, 32, 24, 12).stroke({
					color: "#9fe0ff",
					width: 1.2,
					alpha: 0.5,
				});
			}
			// Icicle tips: two small downward triangles flanking the body.
			const icicleY = isLurker ? 28 : headY + 4;
			const icicleDir = isLurker ? 1 : -1; // lurker icicles point down (positive y)
			for (const ix of [-hw + 4, hw - 4]) {
				// Triangle: base at icicleY, tip 6px in icicleDir direction.
				f.poly([
					ix - 2,
					icicleY,
					ix + 2,
					icicleY,
					ix,
					icicleY + icicleDir * 6,
				]).fill({ color: "#c8f0ff", alpha: 0.8 });
			}
			// Frosted "eyebrow" streaks just above the eye positions.
			// Crawler eyes at y≈-13; bat eyes at y≈-13; lurker eyes at y≈16.
			const eyeY = isLurker ? 14 : -15;
			for (const ex of [-5, 6]) {
				f.moveTo(ex - 3, eyeY)
					.lineTo(ex + 3, eyeY)
					.stroke({ color: "#c8f0ff", width: 1, alpha: 0.65, cap: "round" });
			}
			break;
		}

		case "crypt": {
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
			break;
		}

		case "grove": {
			// A small mushroom cap sitting on top of the head + a moss-green tuft.
			// Mushroom stem.
			f.roundRect(-2, headY - 5, 4, 5, 1).fill("#d4b483");
			// Cap: a semicircle-ish rounded blob, red with white spots.
			f.ellipse(0, headY - 6, 8, 5).fill("#c0392b");
			f.ellipse(0, headY - 7, 8, 3).fill("#e05a4a");
			// Two white spots on the cap (fixed positions, deterministic).
			f.circle(-3, headY - 7, 1.5).fill({ color: "#ffffff", alpha: 0.9 });
			f.circle(3, headY - 7, 1.2).fill({ color: "#ffffff", alpha: 0.9 });
			// Tiny moss tuft: three small rounded bumps on one shoulder.
			const mossX = isLurker ? -12 : -hw + 2;
			const mossY = isLurker ? 10 : headY + 6;
			for (let i = 0; i < 3; i++) {
				f.ellipse(mossX + i * 4, mossY, 2.5, 2).fill({
					color: "#4aab5e",
					alpha: 0.85,
				});
			}
			break;
		}

		case "molten": {
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
			break;
		}

		default:
			// No flourish for unknown / neutral styles — safe fallback.
			break;
	}

	c.addChild(f);
}

/**
 * Build a cave baddie. `"crawler"` is a spiky dark ground blob (~32x28) with
 * eyes, little legs and fangs; `"bat"` is a winged purple flyer (~36 wide x
 * ~22 tall body) with pointy ears, fangs and glowing eyes. Both face right with
 * a bottom-centre origin.
 *
 * When a theme `accent` (`#rrggbb`) is given, the monster's body/wing/spike fills
 * are blended toward it so it reads as part of the level's mood; the eyes, fangs,
 * highlights and mouths are left intact so it stays readable. Omitting `accent`
 * keeps the original colours, so existing call sites are unaffected.
 *
 * When a `style` is given a subtle per-theme flourish is layered on top of the
 * base silhouette (e.g. crystal shards, icy rim, ghostly glow). The flourish
 * never obscures the eyes, fangs, or silhouette that signal the creature type.
 * All decoration uses only fixed geometry — no `Math.random` / `Date.now`.
 *
 * @param kind - Which baddie to draw.
 * @param accent - Optional theme accent `#rrggbb` to recolour the body toward.
 * @param style - Optional cave theme driving a subtle visual flourish.
 * @returns A Pixi {@link Container} ready to position at a world point.
 */
export function drawMonster(
	kind: "crawler" | "bat" | "lurker",
	accent?: string,
	style?: ThemeStyle,
): Container {
	const c = new Container();
	const g = new Graphics();
	// Body fills blend a fair way toward the accent; outlines a touch less.
	const body = (hex: string) => tint(hex, accent, 0.45);
	const line = (hex: string) => tint(hex, accent, 0.3);

	if (kind === "lurker") {
		// Ceiling-dweller: clings overhead and drops poop. Drawn growing DOWNWARD
		// from its anchor (origin at the ceiling attach point, body below y=0) so
		// the caller positions it flush to the ceiling.
		// Gooey attach blob + drip.
		g.ellipse(0, 4, 14, 6).fill(body("#3a2a1a"));
		// Squat sack body hanging below.
		g.roundRect(-15, 6, 30, 22, 11).fill(body("#4a3520"));
		g.ellipse(0, 18, 9, 7).fill(body("#5c4327")); // belly highlight
		// Stubby clinging arms.
		g.moveTo(-13, 9)
			.lineTo(-20, 4)
			.stroke({ color: line("#3a2a1a"), width: 3, cap: "round" });
		g.moveTo(13, 9)
			.lineTo(20, 4)
			.stroke({ color: line("#3a2a1a"), width: 3, cap: "round" });
		// Sleepy-mean eyes (looking down) — left untinted so they pop.
		g.circle(-5, 16, 4).fill("#cfe34d");
		g.circle(6, 16, 4).fill("#cfe34d");
		g.circle(-5, 18, 1.8).fill("#1b1230");
		g.circle(6, 18, 1.8).fill("#1b1230");
		// Smug mouth.
		g.moveTo(-5, 24)
			.quadraticCurveTo(0, 22, 5, 24)
			.stroke({ color: "#1b1230", width: 1.5, cap: "round" });
		c.addChild(g);
		addMonsterFlourish(c, kind, style);
		return c;
	}

	if (kind === "crawler") {
		// Little legs poking out below the blob.
		for (const lx of [-10, -3, 4, 11]) {
			g.moveTo(lx, -6)
				.lineTo(lx, 0)
				.stroke({ color: line("#1b1230"), width: 2.5, cap: "round" });
		}
		// Spiky dark body: a rounded blob with triangular spikes on top.
		g.roundRect(-16, -22, 32, 18, 8).fill(body("#2c1a4d"));
		const spikes = [-12, -6, 0, 6, 12];
		for (const sx of spikes) {
			g.poly([sx - 4, -20, sx + 4, -20, sx, -28]).fill(body("#3d2566"));
		}
		// Glowing eyes with highlight — untinted.
		g.circle(-5, -13, 4).fill("#ffe14d");
		g.circle(6, -13, 4).fill("#ffe14d");
		g.circle(-5, -13, 1.8).fill("#1b1230");
		g.circle(6, -13, 1.8).fill("#1b1230");
		// Grumpy mouth with fangs.
		g.moveTo(-7, -7).lineTo(7, -7).stroke({ color: "#1b1230", width: 1.5 });
		g.poly([-5, -7, -2, -7, -3.5, -3]).fill("#ffffff");
		g.poly([2, -7, 5, -7, 3.5, -3]).fill("#ffffff");
	} else {
		// Two membranous wings (back-left and front-right of body).
		g.poly([-4, -16, -22, -22, -18, -10, -24, -8, -8, -8]).fill(
			body("#6a3fb0"),
		);
		g.poly([4, -16, 22, -22, 18, -10, 24, -8, 8, -8]).fill(body("#7a4fc0"));
		// Body.
		g.ellipse(0, -12, 11, 10).fill(body("#5a2f9a"));
		// Pointy ears.
		g.poly([-7, -20, -3, -26, -1, -19]).fill(body("#5a2f9a"));
		g.poly([7, -20, 3, -26, 1, -19]).fill(body("#5a2f9a"));
		// Glowing eyes — untinted.
		g.circle(-4, -13, 3).fill("#ff4d6d");
		g.circle(4, -13, 3).fill("#ff4d6d");
		g.circle(-4, -13, 1.2).fill("#ffe9a8");
		g.circle(4, -13, 1.2).fill("#ffe9a8");
		// Fangs.
		g.poly([-3, -7, -1, -7, -2, -3]).fill("#ffffff");
		g.poly([1, -7, 3, -7, 2, -3]).fill("#ffffff");
	}

	c.addChild(g);
	addMonsterFlourish(c, kind, style);
	return c;
}

/**
 * Build the static level-exit gate: a dark stone frame with a recessed dark
 * inner opening and an "EXIT" label. The pulsing purple portal glow is NOT baked
 * in — build it separately with {@link drawExitGlow} and place it inside the
 * frame so the Exit entity can animate its alpha/scale by player proximity.
 * Bottom-centre origin.
 *
 * @returns A Pixi {@link Container} ready to position at the exit point.
 */
export function drawExit(): Container {
	const c = new Container();
	const g = new Graphics();

	const w = 46;
	const h = 64;
	// Stone gate frame.
	g.roundRect(-w / 2, -h, w, h, 6).fill("#3a3550");
	g.roundRect(-w / 2 + 4, -h + 4, w - 8, h - 4, 4).fill("#2a2740");
	// Recessed dark inner opening (the glow sits inside this).
	g.roundRect(-16, -h + 10, 32, h - 12, 14).fill("#1c1830");
	// A few carved stone notches on the frame for texture.
	for (const ny of [-h + 16, -h + 32, -h + 48]) {
		g.rect(-w / 2 + 2, ny, 3, 2).fill("#2a2740");
		g.rect(w / 2 - 5, ny, 3, 2).fill("#2a2740");
	}

	c.addChild(g);

	const label = new Text({
		text: "EXIT",
		// High resolution keeps the label crisp when the stage scales up.
		resolution: 4,
		style: {
			fontFamily: "Arial",
			fontSize: 12,
			fontWeight: "bold",
			fill: "#ffe14d",
		},
	});
	label.anchor.set(0.5, 0.5);
	label.position.set(0, -h - 8);
	c.addChild(label);

	return c;
}

/**
 * Build just the inner purple portal glow for the exit, centred on its own
 * origin (0,0) so the Exit entity can position it inside the gate opening and
 * animate its `alpha`/`scale` by player proximity. Soft layered radial-ish
 * purple fill (outer haze to a bright core) plus a couple of sparkle stars.
 * Roughly fits the gate's ~32x52 inner opening.
 *
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawExitGlow(): Container {
	const c = new Container();
	const g = new Graphics();

	// Concentric soft ellipses from a faint outer haze to a bright pale core,
	// approximating a radial glow within the portal opening.
	g.ellipse(0, 0, 17, 27).fill({ color: 0x7a4fc0, alpha: 0.35 });
	g.ellipse(0, 0, 13, 22).fill({ color: 0x9b6bff, alpha: 0.5 });
	g.ellipse(0, 0, 9, 16).fill({ color: 0xb07bff, alpha: 0.7 });
	g.ellipse(0, 0, 5, 10).fill({ color: 0xe4ccff, alpha: 0.85 });
	g.ellipse(0, 0, 2.5, 6).fill({ color: 0xffffff, alpha: 0.85 });

	// Sparkle stars drifting in the portal.
	g.star(0, -4, 4, 3).fill({ color: 0xffffff, alpha: 0.9 });
	g.circle(-5, 8, 1.4).fill({ color: 0xffffff, alpha: 0.8 });
	g.circle(6, 1, 1.1).fill({ color: 0xffffff, alpha: 0.8 });

	c.addChild(g);
	return c;
}

/** A bouncy trampoline, bottom-centre origin, ~64px wide. */
export function drawTrampoline(): Container {
	const c = new Container();
	const g = new Graphics();
	// Two legs.
	g.roundRect(-26, -10, 8, 12, 2).fill("#3a2f55");
	g.roundRect(18, -10, 8, 12, 2).fill("#3a2f55");
	// Springy frame ring.
	g.ellipse(0, -16, 32, 9).fill("#6d5a8c");
	// Bouncy pad (brighter, slightly domed).
	g.ellipse(0, -18, 28, 7).fill("#ff5ea2");
	g.ellipse(0, -19, 28, 6).fill("#ff8cc4");
	// Spring stitches around the pad.
	for (let i = -3; i <= 3; i++) {
		const x = i * 8;
		g.circle(x, -16, 1.4).fill("#ffd9ec");
	}
	c.addChild(g);
	return c;
}

/** A floating flute pickup (extra life), bottom-centre origin, ~30px tall. */
export function drawFlute(): Container {
	const c = new Container();
	const g = new Graphics();
	// Soft glow halo behind the flute.
	g.circle(0, -18, 16).fill({ color: 0xffe680, alpha: 0.25 });
	// Flute body: a slim golden pipe leaning slightly.
	g.roundRect(-3, -32, 6, 30, 3).fill("#e8b84b");
	// Lighter highlight stripe.
	g.roundRect(-1, -31, 2, 28, 1).fill("#ffd884");
	// Finger holes.
	g.circle(0, -26, 1.3).fill("#9c7a28");
	g.circle(0, -20, 1.3).fill("#9c7a28");
	g.circle(0, -14, 1.3).fill("#9c7a28");
	g.circle(0, -8, 1.3).fill("#9c7a28");
	// Mouthpiece flare at the top.
	g.poly([-4, -32, 4, -32, 2, -36, -2, -36]).fill("#f0c860");
	// A couple of music-note sparkles.
	g.circle(8, -28, 1.6).fill("#fff3c4");
	g.circle(-8, -16, 1.4).fill("#fff3c4");
	c.addChild(g);
	return c;
}

/** A classic swirly poop hazard, bottom-centre origin, ~26px wide. */
export function drawPoop(): Container {
	const c = new Container();
	const g = new Graphics();
	const brown = "#6b4423";
	const light = "#8a5a30";

	// Three stacked blobs, widest at the base, tapering to a tip.
	g.ellipse(0, -6, 13, 7).fill(brown);
	g.ellipse(0, -14, 9, 6).fill(brown);
	g.ellipse(0, -21, 5, 5).fill(brown);
	// Highlights on the left of each tier for a glossy look.
	g.ellipse(-3, -7, 5, 2.5).fill(light);
	g.ellipse(-2, -14, 3.5, 2).fill(light);
	// Tiny stink curl tip.
	g.circle(0, -25, 2).fill(brown);
	// Cartoon eyes so it reads as a cute obstacle, not just grime.
	g.circle(-3, -15, 1.6).fill("#fff");
	g.circle(3, -15, 1.6).fill("#fff");
	g.circle(-3, -15, 0.8).fill("#1a1124");
	g.circle(3, -15, 0.8).fill("#1a1124");

	c.addChild(g);
	return c;
}
