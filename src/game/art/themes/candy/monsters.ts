import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Candy-theme monster reskins. All three replace the base crawler/bat/lurker
 * shapes with sweet confectionery creatures. No `Math.random` / `Date.now` —
 * all geometry is fixed or derived via `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 *
 * Pastel sweet palette: chocolate brown, icing pink, mint, lilac, cream.
 */

/**
 * Gingerbread man crawler (~32x30, bottom-centre origin, drawn upward).
 * Chocolate-brown biscuit body with white icing trim, candy-button eyes, a
 * stitched smile, and round head on top so it reads stompable. Stubby legs
 * below the body keep the ground-walker silhouette. Tinted lightly toward
 * `accent` on the biscuit body; icing details stay pale.
 */
export function drawGingerbreadCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const biscuit = (hex: string) => tint(hex, accent, 0.2);
	const icingCol = tint("#fff4f8", accent, 0.15);
	const shadowCol = tint("#3a1a08", accent, 0.25);

	// --- Stubby legs (two pairs, below the waist) ---
	for (const lx of [-8, 8]) {
		// Leg.
		g.roundRect(lx - 4, -10, 8, 10, 4).fill(biscuit("#7b3e10"));
		// Rounded foot.
		g.ellipse(lx, -1, 5.5, 3.5).fill(biscuit("#8a4a14"));
		// Icing cuff at the ankle.
		g.roundRect(lx - 4.5, -5, 9, 2.5, 1.5).fill({
			color: icingCol,
			alpha: 0.8,
		});
	}

	// --- Body (rounded gingerbread torso) ---
	g.roundRect(-14, -28, 28, 20, 8).fill(biscuit("#8a4a14"));
	// Baked shadow at base of body.
	g.roundRect(-14, -15, 28, 7, 8).fill({ color: shadowCol, alpha: 0.28 });
	// Icing trim along the body bottom edge (wavy piping).
	for (let ix = -12; ix < 12; ix += 6) {
		g.circle(ix, -10, 2.8).fill({ color: icingCol, alpha: 0.78 });
	}
	// Icing bow-tie / chest button row.
	g.circle(-4, -20, 2).fill({ color: icingCol, alpha: 0.8 });
	g.circle(4, -20, 2).fill({ color: icingCol, alpha: 0.8 });

	// --- Arms stretched out to the sides ---
	for (const ax of [-1, 1]) {
		const armX = ax * 18;
		g.roundRect(ax > 0 ? 14 : -22, -27, 8, 6, 4).fill(biscuit("#7b3e10"));
		// Mitten-like hand blob.
		g.circle(armX, -24, 4.5).fill(biscuit("#8a4a14"));
		// Icing cuff.
		g.roundRect(ax > 0 ? 14 : -14, -27, 4, 6, 2).fill({
			color: icingCol,
			alpha: 0.7,
		});
	}

	// --- Round gingerbread head (sits on top — stompable) ---
	// Shadow neck join.
	g.ellipse(0, -30, 8, 4).fill({ color: shadowCol, alpha: 0.3 });
	// Cranium.
	g.circle(0, -37, 10).fill(biscuit("#9a5220"));
	// Baked shadow on lower cheek.
	g.ellipse(0, -33, 8, 4).fill({ color: shadowCol, alpha: 0.25 });
	// Icing outline around the head (piped border).
	g.circle(0, -37, 10).stroke({ color: icingCol, width: 1.8, alpha: 0.65 });

	// --- Candy-button eyes (vivid colours, deterministic via wobble) ---
	const eyeColL = tint("#ff7ec4", accent, 0.25); // pink candy
	const eyeColR = tint("#6ff0c8", accent, 0.25); // mint candy
	g.circle(-4, -38, 3.5).fill(eyeColL);
	g.circle(4, -38, 3.5).fill(eyeColR);
	// Dark pupil dot.
	g.circle(-4, -38, 1.4).fill(0x1a0808);
	g.circle(4, -38, 1.4).fill(0x1a0808);
	// Tiny white glint.
	g.circle(-3.2, -38.8, 0.9).fill({ color: 0xffffff, alpha: 0.85 });
	g.circle(4.8, -38.8, 0.9).fill({ color: 0xffffff, alpha: 0.85 });

	// --- Icing smile (three small dots) ---
	for (let i = -1; i <= 1; i++) {
		const sx = i * 2.5;
		const sy = -33 + wobble(sx + 50, i + 5, 0.5);
		g.circle(sx, sy, 0.9).fill({ color: icingCol, alpha: 0.85 });
	}

	// --- Rosy cheeks ---
	g.circle(-7, -35, 2.8).fill({
		color: tint("#ff9ec0", accent, 0.2),
		alpha: 0.45,
	});
	g.circle(7, -35, 2.8).fill({
		color: tint("#ff9ec0", accent, 0.2),
		alpha: 0.45,
	});

	c.addChild(g);
	return c;
}

/**
 * Winged gumdrop bat reskin (~38 wide x 26 tall body, bottom-centre origin,
 * drawn upward). A plump pastel gumdrop with two candy-wrapper wings. The
 * wrapper-twist "ears" serve the same silhouette as bat ears. Round body
 * centred like the base bat body, with large cartoon eyes. Tinted toward accent.
 */
export function drawGumdropBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const gumdrop = (hex: string) => tint(hex, accent, 0.28);
	const wrapCol = tint("#c87ad8", accent, 0.28); // lilac wrapper
	const wrapLit = tint("#e8b0f8", accent, 0.2);
	const bodyCol = gumdrop("#ff9ed8"); // pink gumdrop
	const bodyLit = gumdrop("#ffd0ee");
	const bodyShadow = gumdrop("#d06090");

	// --- Wings: candy-wrapper shapes (crinkled cellophane) ---
	// Left wing — two overlapping triangular lobes for a "twisted wrapper" look.
	g.poly([-6, -14, -28, -22, -22, -8, -26, -6, -10, -8]).fill({
		color: wrapCol,
		alpha: 0.82,
	});
	g.poly([-8, -12, -20, -24, -16, -10]).fill({ color: wrapLit, alpha: 0.38 });
	// Right wing.
	g.poly([6, -14, 28, -22, 22, -8, 26, -6, 10, -8]).fill({
		color: wrapCol,
		alpha: 0.82,
	});
	g.poly([8, -12, 20, -24, 16, -10]).fill({ color: wrapLit, alpha: 0.38 });

	// --- Gumdrop body (plump dome, centred at y≈-13 like base bat) ---
	g.ellipse(0, -13, 13, 11).fill(bodyCol);
	// Domed highlight shimmer.
	g.ellipse(-2, -18, 7, 5).fill({ color: bodyLit, alpha: 0.55 });
	// Shadow base.
	g.ellipse(0, -9, 10, 5).fill({ color: bodyShadow, alpha: 0.35 });

	// --- Wrapper-twist "ears" (the pinched top corners of the wrapper) ---
	// Left twist.
	g.poly([-8, -22, -5, -26, -2, -21]).fill({ color: wrapCol, alpha: 0.88 });
	g.moveTo(-8, -22)
		.lineTo(-5, -26)
		.stroke({ color: wrapLit, width: 0.8, alpha: 0.5 });
	// Right twist.
	g.poly([8, -22, 5, -26, 2, -21]).fill({ color: wrapCol, alpha: 0.88 });
	g.moveTo(8, -22)
		.lineTo(5, -26)
		.stroke({ color: wrapLit, width: 0.8, alpha: 0.5 });

	// --- Candy stripe across the body (two arc-ish bands) ---
	const stripeCol = tint("#ff7ec4", accent, 0.22);
	// Two horizontal stripe bands at different heights on the dome.
	g.moveTo(-9, -16)
		.quadraticCurveTo(0, -17, 9, -16)
		.stroke({ color: stripeCol, width: 1.5, alpha: 0.45 });
	g.moveTo(-8, -11)
		.quadraticCurveTo(0, -12, 8, -11)
		.stroke({ color: stripeCol, width: 1.2, alpha: 0.35 });

	// --- Eyes — large cartoon dots on the body dome ---
	g.circle(-4, -14, 4).fill({ color: 0xffffff, alpha: 0.92 });
	g.circle(4, -14, 4).fill({ color: 0xffffff, alpha: 0.92 });
	g.circle(-4, -14, 2.5).fill(0x1a1030);
	g.circle(4, -14, 2.5).fill(0x1a1030);
	// Glint.
	g.circle(-3, -15, 1).fill({ color: 0xffffff, alpha: 0.9 });
	g.circle(5, -15, 1).fill({ color: 0xffffff, alpha: 0.9 });

	// --- Little fangs (two icing drip points below body) ---
	g.poly([-3, -7, -1, -7, -2, -3]).fill({ color: 0xfff0f8, alpha: 0.88 });
	g.poly([1, -7, 3, -7, 2, -3]).fill({ color: 0xfff0f8, alpha: 0.88 });

	c.addChild(g);
	return c;
}

/**
 * Candy-cane / lollipop lurker (~36 wide, grown DOWNWARD from y=0). A giant
 * candy cane clings to the ceiling with its hook end dangling down. Red and
 * white spiral stripes wrap the shaft; the hooked end has two round candy eyes
 * at y≈16 matching the base lurker eye position so poop-drop and collision feel
 * identical. Stubby arm drips reach out like the base lurker arms.
 * Tinted lightly toward `accent`; stripe hues stay readable.
 */
export function drawCandyCaneLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const caneRed = (hex: string) => tint(hex, accent, 0.18);
	const caneWhite = (hex: string) => tint(hex, accent, 0.12);
	const candyPink = tint("#ff7ec4", accent, 0.22);

	// --- Ceiling anchor blob (the upper curve of the cane flush to y=0) ---
	g.ellipse(0, 4, 14, 6).fill(caneRed("#c41230"));

	// --- Straight shaft of the cane descending from ceiling (y=6..26) ---
	// White body of the shaft.
	g.roundRect(-7, 5, 14, 22, 6).fill(caneWhite("#ffeef8"));
	// Red spiral stripe bands — three horizontal wraps across the shaft.
	// Approximated as rounded rectangles at staggered y offsets.
	const stripeOffsets = [7, 13, 19];
	for (let i = 0; i < stripeOffsets.length; i++) {
		const sy = stripeOffsets[i];
		const sw = 3 + wobble(sy + 10, i + 3, 0.5);
		g.roundRect(-7, sy, 14, sw, 1.5).fill({
			color: caneRed("#d91c3a"),
			alpha: 0.88,
		});
	}
	// Lit gloss sliver down the left of the shaft.
	g.roundRect(-5, 5, 3, 22, 3).fill({
		color: caneWhite("#ffffff"),
		alpha: 0.35,
	});

	// --- Hooked bottom end (the curved hook ~y=24..32) ---
	// Hook arc: a squished circle offset to the right of centre.
	const hookR = 7;
	g.ellipse(hookR, 26, hookR, hookR * 0.72).fill(caneWhite("#ffeef8"));
	// Red stripe on hook.
	g.ellipse(hookR, 26, hookR * 0.72, hookR * 0.5).fill({
		color: caneRed("#d91c3a"),
		alpha: 0.6,
	});
	// Knob at the very tip.
	g.circle(hookR + hookR - 1, 26, 3.5).fill(caneRed("#ff3355"));
	g.circle(hookR + hookR - 1, 24.5, 1.2).fill({
		color: caneWhite("#ffffff"),
		alpha: 0.6,
	});

	// --- Stubby candy-arm drips (mirroring base lurker arms at ~y=9) ---
	// Left arm — icing drip tendril.
	g.moveTo(-7, 10)
		.lineTo(-16, 6)
		.stroke({ color: caneRed("#c41230"), width: 3.5, cap: "round" });
	g.circle(-16, 6, 3).fill(candyPink);
	g.circle(-15.5, 4.5, 1).fill({ color: 0xfff0f8, alpha: 0.65 });
	// Right arm.
	g.moveTo(7, 10)
		.lineTo(16, 6)
		.stroke({ color: caneRed("#c41230"), width: 3.5, cap: "round" });
	g.circle(16, 6, 3).fill(candyPink);
	g.circle(16.5, 4.5, 1).fill({ color: 0xfff0f8, alpha: 0.65 });

	// --- Eyes (at y=16, matching base lurker eye position exactly) ---
	// Outer candy-glow ring.
	g.circle(-5, 16, 5).fill({
		color: tint("#ffe066", accent, 0.35),
		alpha: 0.3,
	});
	g.circle(6, 16, 5).fill({ color: tint("#ffe066", accent, 0.35), alpha: 0.3 });
	// Iris — vivid sugar-yellow.
	g.circle(-5, 16, 3.8).fill(tint("#ffe066", accent, 0.3));
	g.circle(6, 16, 3.8).fill(tint("#ffe066", accent, 0.3));
	// Dark pupil.
	g.circle(-5, 16, 1.7).fill(0x1a0808);
	g.circle(6, 16, 1.7).fill(0x1a0808);
	// Bright highlight.
	g.circle(-4, 15, 1).fill({ color: 0xffffff, alpha: 0.82 });
	g.circle(7, 15, 1).fill({ color: 0xffffff, alpha: 0.82 });

	// --- Smug icing mouth below the eyes (matches base lurker at y≈24) ---
	g.moveTo(-5, 23)
		.quadraticCurveTo(0, 21, 5, 23)
		.stroke({ color: caneRed("#c41230"), width: 1.5, cap: "round" });

	// --- Sprinkle dots on shaft for extra candy identity ---
	const sprinkleColors = [0xff7ec4, 0x6ff0c8, 0xa78bff];
	for (let i = 0; i < 3; i++) {
		const spx = wobble(i * 30 + 5, i + 7, 2.5);
		const spy = 9 + i * 4;
		g.circle(spx, spy, 1.2).fill({
			color: sprinkleColors[i % sprinkleColors.length],
			alpha: 0.82,
		});
	}

	c.addChild(g);
	return c;
}
