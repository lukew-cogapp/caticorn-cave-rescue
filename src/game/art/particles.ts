import { Container, Graphics } from "pixi.js";

/**
 * Build a tiny glowing firefly drawn around its own centre (origin 0,0), ~6px
 * across: a soft warm halo with a bright yellow-green core. A Fireflies system
 * spawns and drifts these in the background; this just draws the dot.
 *
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawFirefly(): Container {
	const c = new Container();
	const g = new Graphics();
	// Soft outer halo (warm yellow-green).
	g.circle(0, 0, 3).fill({ color: 0xc6ff5e, alpha: 0.22 });
	// Inner glow.
	g.circle(0, 0, 1.8).fill({ color: 0xeaff8a, alpha: 0.55 });
	// Bright core.
	g.circle(0, 0, 0.9).fill({ color: 0xffffe0, alpha: 0.95 });
	c.addChild(g);
	return c;
}

/**
 * Build a tiny effect particle drawn around its OWN centre (origin 0,0), only a
 * few pixels across. The Game loop owns its lifetime: scaling, fading and moving
 * it. This just draws a compact, centred sprite.
 *
 * - `"spark"`: a bright gold/white 4-point plus-glint.
 * - `"note"`: a small warm-gold musical note (notehead + stem).
 * - `"puff"`: a soft pale-grey smoke puff of overlapping circles.
 * - `"dust"`: a small brown/tan speck cluster.
 * - `"star"`: a bright gold/white 5-point star with a soft halo, for rescue
 *   celebration pops.
 * - `"mote"`: a very faint, tiny pale circle (~2px) for ambient foreground
 *   atmosphere — subtle drifting dust or spore.
 * - `"sparkle"`: a crisp 4-point cross-glint (thinner/brighter than "spark")
 *   with a faint coloured halo, for exit-beckon twinkles.
 * - `"petal"`: a soft pink cherry-blossom petal — a small rounded teardrop
 *   with a faint lighter highlight, ~4-5px. Caller rotates for variety.
 * - `"gemsparkle"`: a gem-coloured violet/cyan 4-point glint with a faint
 *   halo, ~4px. Distinct from the white "sparkle".
 * - `"snow"`: a soft white snow speck — a bright core with a pale halo and
 *   six faint spoke-lines, ~3-4px. Gentle and icy.
 * - `"fog"`: a drifting fog wisp — several overlapping very-low-alpha
 *   pale-grey circles, ~8-10px wide. Reads as thin mist.
 * - `"spore"`: a glowing mushroom spore — a soft green-yellow dot with a
 *   faint halo, ~3px. Like a smaller, greener firefly.
 * - `"ember"`: a glowing ember — a bright orange/yellow hot speck with a
 *   warm halo fading to red at the edge, ~3-4px.
 *
 * @param kind - Which particle to draw.
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawParticle(
	kind:
		| "spark"
		| "note"
		| "puff"
		| "dust"
		| "star"
		| "mote"
		| "sparkle"
		| "petal"
		| "gemsparkle"
		| "snow"
		| "fog"
		| "spore"
		| "ember"
		| "confetti"
		| "bubble"
		| "bat"
		| "pixel"
		| "sprinkle",
): Container {
	const c = new Container();
	const g = new Graphics();

	switch (kind) {
		case "spark":
			// Soft gold halo, then a bright white 4-point plus glint.
			g.circle(0, 0, 4).fill({ color: 0xffe14d, alpha: 0.35 });
			g.poly([0, -5, 1, -1, 0, 0, -1, -1]).fill("#fff6c4");
			g.poly([0, 5, 1, 1, 0, 0, -1, 1]).fill("#fff6c4");
			g.poly([-5, 0, -1, 1, 0, 0, -1, -1]).fill("#fff6c4");
			g.poly([5, 0, 1, 1, 0, 0, 1, -1]).fill("#fff6c4");
			g.circle(0, 0, 1.2).fill("#ffffff");
			break;
		case "note":
			// Stem rising from the notehead, with a small flag.
			g.rect(2, -8, 1.4, 8).fill("#e8b84b");
			g.moveTo(3.4, -8)
				.quadraticCurveTo(6, -7, 5, -4)
				.stroke({ color: "#e8b84b", width: 1.4, cap: "round" });
			// Filled, slightly tilted notehead.
			g.ellipse(0, 1, 3, 2.3).fill("#ffd884");
			break;
		case "puff":
			// A couple of overlapping pale-grey circles for soft smoke.
			g.circle(-1.5, 0, 3.5).fill({ color: 0xd6d6de, alpha: 0.7 });
			g.circle(2, -1, 3).fill({ color: 0xe4e4ea, alpha: 0.7 });
			g.circle(0.5, 1.5, 2.5).fill({ color: 0xc8c8d2, alpha: 0.7 });
			break;
		case "dust":
			// Small brown/tan speck cluster.
			g.circle(0, 0, 1.6).fill("#8a6a40");
			g.circle(-2.5, 1, 1.1).fill("#6b4f2e");
			g.circle(2.5, -1, 1).fill("#a8835a");
			g.circle(1, 2.5, 0.9).fill("#6b4f2e");
			break;
		case "star":
			// Soft gold outer halo.
			g.circle(0, 0, 7).fill({ color: 0xffe566, alpha: 0.25 });
			// Mid glow ring.
			g.circle(0, 0, 5).fill({ color: 0xfff0a0, alpha: 0.35 });
			// 5-point star: outer radius 5, inner radius 2, rotated so a point faces up.
			g.star(0, 0, 5, 5, 2, -Math.PI / 2).fill({ color: 0xffe14d, alpha: 1 });
			// Bright white centre highlight.
			g.circle(0, 0, 1.2).fill("#ffffff");
			break;
		case "mote":
			// A very faint, tiny pale circle — a drifting dust spore.
			g.circle(0, 0, 2.2).fill({ color: 0xf0ecd8, alpha: 0.18 });
			g.circle(0, 0, 1.2).fill({ color: 0xfaf8f0, alpha: 0.28 });
			break;
		case "petal":
			// A soft cherry-blossom petal: a rounded pink teardrop with a light
			// highlight. Drawn pointing "up" — caller rotates for variety.
			// Outer petal body — soft rose pink.
			g.ellipse(0, 0.5, 2.2, 3.2).fill({ color: 0xf9b8cc, alpha: 0.92 });
			// Slightly lighter inner highlight off-centre.
			g.ellipse(-0.5, -0.3, 1.1, 1.8).fill({ color: 0xfde0ec, alpha: 0.7 });
			// Faint tip notch (darker crease at the bottom of the petal).
			g.circle(0, 3, 0.7).fill({ color: 0xe88aad, alpha: 0.55 });
			break;
		case "gemsparkle":
			// A gem-coloured crystal twinkle: violet/cyan halo + 4-point glint.
			// Outer violet halo.
			g.circle(0, 0, 5).fill({ color: 0xb44fff, alpha: 0.18 });
			// Mid cyan ring.
			g.circle(0, 0, 3).fill({ color: 0x5af0ff, alpha: 0.22 });
			// Vertical glint arm.
			g.poly([0, -4.5, 0.6, -0.6, 0, 0, -0.6, -0.6]).fill({
				color: 0xd8aaff,
				alpha: 0.95,
			});
			g.poly([0, 4.5, 0.6, 0.6, 0, 0, -0.6, 0.6]).fill({
				color: 0xd8aaff,
				alpha: 0.95,
			});
			// Horizontal glint arm.
			g.poly([-4.5, 0, -0.6, 0.6, 0, 0, -0.6, -0.6]).fill({
				color: 0x88eeff,
				alpha: 0.95,
			});
			g.poly([4.5, 0, 0.6, 0.6, 0, 0, 0.6, -0.6]).fill({
				color: 0x88eeff,
				alpha: 0.95,
			});
			// Bright white centre.
			g.circle(0, 0, 0.9).fill("#ffffff");
			break;
		case "snow":
			// A gentle snowflake/snow speck: soft white core, pale halo, six
			// faint spokes for a delicate icy look.
			// Outer faint halo.
			g.circle(0, 0, 4).fill({ color: 0xe8f4ff, alpha: 0.2 });
			// Mid glow.
			g.circle(0, 0, 2.2).fill({ color: 0xf0f8ff, alpha: 0.55 });
			// Six spoke lines — thin rectangles at 60° steps (0, 60, 120°).
			// Vertical spoke.
			g.rect(-0.4, -3.4, 0.8, 6.8).fill({ color: 0xddeeff, alpha: 0.55 });
			// 60° spoke (approx 0.866 / 0.5).
			g.poly([0, -3.4, 0.5, -3.0, 0, 0, -0.5, -3.0]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			g.poly([0, 3.4, 0.5, 3.0, 0, 0, -0.5, 3.0]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			// 120° spoke.
			g.poly([-3.0, -1.7, -2.5, -2.2, 0, 0, -2.5, -1.2]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			g.poly([3.0, 1.7, 2.5, 2.2, 0, 0, 2.5, 1.2]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			g.poly([-3.0, 1.7, -2.5, 2.2, 0, 0, -2.5, 1.2]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			g.poly([3.0, -1.7, 2.5, -2.2, 0, 0, 2.5, -1.2]).fill({
				color: 0xddeeff,
				alpha: 0.55,
			});
			// Bright white centre dot.
			g.circle(0, 0, 1).fill("#ffffff");
			break;
		case "fog":
			// A drifting fog wisp: several overlapping very-low-alpha pale-grey
			// circles that together read as thin drifting mist. ~8-10px wide.
			g.circle(-3, 0, 5).fill({ color: 0xd8dce0, alpha: 0.13 });
			g.circle(2.5, -1, 4.5).fill({ color: 0xe0e4e8, alpha: 0.14 });
			g.circle(-0.5, 1.5, 4).fill({ color: 0xcdd1d5, alpha: 0.12 });
			g.circle(3.5, 1, 3.5).fill({ color: 0xd8dce0, alpha: 0.1 });
			g.circle(-2, -1, 3).fill({ color: 0xe4e8ec, alpha: 0.1 });
			break;
		case "spore":
			// A glowing mushroom spore: a soft green-yellow dot with a faint halo.
			// Like a small, greener firefly. ~3px.
			// Outer diffuse halo.
			g.circle(0, 0, 3.5).fill({ color: 0x8fdd44, alpha: 0.2 });
			// Mid glow.
			g.circle(0, 0, 2).fill({ color: 0xc2f060, alpha: 0.5 });
			// Bright yellow-green core.
			g.circle(0, 0, 1).fill({ color: 0xe8ff90, alpha: 0.95 });
			break;
		case "ember":
			// A glowing ember: bright orange/yellow centre with a warm halo fading
			// to red at the edge. ~3-4px.
			// Outer warm red halo.
			g.circle(0, 0, 4).fill({ color: 0xcc2200, alpha: 0.22 });
			// Mid orange glow.
			g.circle(0, 0, 2.5).fill({ color: 0xff6600, alpha: 0.45 });
			// Bright yellow-orange inner.
			g.circle(0, 0, 1.4).fill({ color: 0xffcc44, alpha: 0.9 });
			// Hot white core.
			g.circle(0, 0, 0.7).fill({ color: 0xfff8e0, alpha: 1 });
			break;
		case "confetti": {
			// Disco confetti: a small tilted colour rectangle. The colour is picked
			// from a tiny palette by a cheap position-free rotation so a field of them
			// reads multicoloured (the caller varies rotation per particle).
			const cols = [0xff5d8f, 0xffd23f, 0x5ad1c8, 0x9b6bff, 0x6cff9e];
			const col = cols[0];
			g.rect(-2, -3, 4, 6).fill({ color: col, alpha: 0.95 });
			g.rect(-2, -3, 4, 2).fill({ color: 0xffffff, alpha: 0.4 });
			break;
		}
		case "bubble":
			// Tropical bubble: a translucent ring with a tiny highlight.
			g.circle(0, 0, 3.5).fill({ color: 0x9fe0ff, alpha: 0.16 });
			g.circle(0, 0, 3.5).stroke({ color: 0xd6f3ff, width: 0.8, alpha: 0.6 });
			g.circle(-1.2, -1.2, 0.9).fill({ color: 0xffffff, alpha: 0.85 });
			break;
		case "bat":
			// Halloween bat: a tiny dark winged silhouette (two scalloped wings + body).
			g.ellipse(0, 0, 1.6, 2).fill({ color: 0x161021, alpha: 0.9 });
			g.poly([-1, -0.5, -6, -2.5, -5, 0.5, -2, 0.5]).fill({
				color: 0x161021,
				alpha: 0.85,
			});
			g.poly([1, -0.5, 6, -2.5, 5, 0.5, 2, 0.5]).fill({
				color: 0x161021,
				alpha: 0.85,
			});
			break;
		case "pixel":
			// Minecraft floating dust: a small flat square block speck.
			g.rect(-1.6, -1.6, 3.2, 3.2).fill({ color: 0xcdbb9a, alpha: 0.7 });
			g.rect(-1.6, -1.6, 3.2, 1).fill({ color: 0xe8dcc4, alpha: 0.5 });
			break;
		case "sprinkle":
			// Candy sprinkle: a short rounded pastel capsule.
			g.roundRect(-0.8, -2.5, 1.6, 5, 0.8).fill({
				color: 0xff8fc8,
				alpha: 0.95,
			});
			g.roundRect(-0.8, -2.5, 1.6, 1.6, 0.8).fill({
				color: 0xffffff,
				alpha: 0.5,
			});
			break;
		default:
			// "sparkle": crisp 4-point cross-glint, thinner than "spark", with a faint
			// coloured halo for the exit-beckon effect.
			g.circle(0, 0, 5).fill({ color: 0xaad4ff, alpha: 0.2 });
			// Vertical arm — narrow diamond.
			g.poly([0, -6, 0.7, -0.7, 0, 0, -0.7, -0.7]).fill("#ffffff");
			g.poly([0, 6, 0.7, 0.7, 0, 0, -0.7, 0.7]).fill("#ffffff");
			// Horizontal arm.
			g.poly([-6, 0, -0.7, 0.7, 0, 0, -0.7, -0.7]).fill("#ffffff");
			g.poly([6, 0, 0.7, 0.7, 0, 0, 0.7, -0.7]).fill("#ffffff");
			// Bright core dot.
			g.circle(0, 0, 1).fill("#ffffff");
			break;
	}

	c.addChild(g);
	return c;
}

/**
 * Build an expanding celebratory ring sprite for when a caticorn is freed.
 * Drawn centred on origin 0,0 at a base radius of ~10px: a thin bright stroked
 * circle with a soft inner glow fill. The caller scales it up and fades it out
 * over the lifetime — draw at full alpha, neutral size.
 *
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawRescueRing(): Container {
	const c = new Container();
	const g = new Graphics();
	// Soft inner glow — very faint fill that will bloom as the caller scales up.
	g.circle(0, 0, 10).fill({ color: 0xfff0a0, alpha: 0.18 });
	// Main bright ring stroke.
	g.circle(0, 0, 10).stroke({ color: 0xffe566, width: 2.5, alpha: 1 });
	// Thin outer halo ring for extra softness.
	g.circle(0, 0, 12).stroke({ color: 0xffd700, width: 1, alpha: 0.4 });
	c.addChild(g);
	return c;
}
