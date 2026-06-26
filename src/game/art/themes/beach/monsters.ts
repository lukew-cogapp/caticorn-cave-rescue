import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Brighton Beach monster reskins. All three replace the base crawler/bat/lurker
 * shapes with British-seaside creatures. No `Math.random` / `Date.now` — all
 * geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Shingle crab crawler (~32×28, bottom-centre origin, drawn upward).
 * Grey-orange shell body with two raised claws on top (head/claw reads stompable),
 * four stubby legs, and cartoonish eye-stalks. Shell tinted lightly toward
 * `accent`; claw tips and eye-stalks stay bright.
 */
export function drawCrabCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const shell = (hex: string) => tint(hex, accent, 0.25);

	// --- Legs: four pairs of stubby limbs below the shell ---
	// Outer legs splay further; inner ones shorter and steeper.
	const legPairs: [number, number, number][] = [
		[-14, -4, -10], // [startX, startY, endX]
		[-7, -5, -6],
		[6, -5, 5],
		[13, -4, 9],
	];
	for (const [sx, sy, ex] of legPairs) {
		// Down-and-out leg.
		g.moveTo(sx, sy)
			.lineTo(ex, 0)
			.stroke({ color: shell("#7a6a58"), width: 2.8, cap: "round" });
		// Mirrored leg on the right.
		g.moveTo(-sx, sy)
			.lineTo(-ex, 0)
			.stroke({ color: shell("#7a6a58"), width: 2.8, cap: "round" });
	}

	// --- Shell body: smooth rounded dome sitting on the legs ---
	// Dark underside rim.
	g.roundRect(-15, -20, 30, 14, 7).fill(shell("#5a4a38"));
	// Main carapace — warm grey-orange.
	g.roundRect(-14, -22, 28, 14, 7).fill(shell("#9a7a5a"));
	// Shell highlight: a lit ridge running left-to-right across the dome.
	g.ellipse(0, -22, 10, 3).fill({ color: shell("#c8a880"), alpha: 0.55 });
	// Shell mottle: faint darker patch at the back.
	g.ellipse(-3, -19, 7, 4).fill({ color: shell("#7a5a40"), alpha: 0.4 });

	// --- Claws: two raised pincers on top of the shell (keep head stompable) ---
	// Left claw arm.
	g.moveTo(-10, -22)
		.lineTo(-16, -28)
		.stroke({ color: shell("#8a6a48"), width: 4, cap: "round" });
	// Left claw upper finger.
	g.moveTo(-16, -28)
		.lineTo(-20, -24)
		.stroke({ color: shell("#b07848"), width: 3, cap: "round" });
	// Left claw lower finger.
	g.moveTo(-16, -28)
		.lineTo(-13, -24)
		.stroke({ color: shell("#b07848"), width: 3, cap: "round" });
	// Left claw gap (dark slash between the fingers).
	g.moveTo(-18, -26)
		.lineTo(-14, -25)
		.stroke({ color: 0x281a0e, width: 1.2, alpha: 0.7, cap: "round" });

	// Right claw arm.
	g.moveTo(10, -22)
		.lineTo(16, -28)
		.stroke({ color: shell("#8a6a48"), width: 4, cap: "round" });
	// Right claw upper finger.
	g.moveTo(16, -28)
		.lineTo(20, -24)
		.stroke({ color: shell("#b07848"), width: 3, cap: "round" });
	// Right claw lower finger.
	g.moveTo(16, -28)
		.lineTo(13, -24)
		.stroke({ color: shell("#b07848"), width: 3, cap: "round" });
	// Right claw gap.
	g.moveTo(18, -26)
		.lineTo(14, -25)
		.stroke({ color: 0x281a0e, width: 1.2, alpha: 0.7, cap: "round" });

	// --- Eye-stalks: two upright stalks with big round eyes ---
	// Stalk shafts.
	g.moveTo(-5, -22)
		.lineTo(-5, -30)
		.stroke({ color: shell("#9a7a5a"), width: 2.2, cap: "round" });
	g.moveTo(4, -22)
		.lineTo(4, -30)
		.stroke({ color: shell("#9a7a5a"), width: 2.2, cap: "round" });
	// Eye bulbs — white sclera.
	g.circle(-5, -31, 3.4).fill(0xfff0e0);
	g.circle(4, -31, 3.4).fill(0xfff0e0);
	// Dark pupils.
	g.circle(-5, -31, 1.8).fill(0x1a1010);
	g.circle(4, -31, 1.8).fill(0x1a1010);
	// Tiny glint.
	g.circle(-4, -32, 0.9).fill({ color: 0xffffff, alpha: 0.85 });
	g.circle(5, -32, 0.9).fill({ color: 0xffffff, alpha: 0.85 });

	c.addChild(g);
	return c;
}

/**
 * Chip-stealing seagull bat reskin (~40 wide × 24 tall body, bottom-centre
 * origin, drawn upward). White-grey plumage with outstretched wings, an orange
 * beak, black wingtips and beady eyes. Floats like the base bat around y≈-12.
 */
export function drawSeagullBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const feather = (hex: string) => tint(hex, accent, 0.15);

	// --- Wings: wide swept-back gull wings ---
	// Left wing — light grey-white upper surface, slightly darker leading edge.
	g.poly([-4, -16, -26, -20, -22, -8, -28, -6, -8, -8]).fill(
		feather("#c8ccd0"),
	);
	// Left wing tip — dark grey (herring gull wingtip markings).
	g.poly([-22, -8, -28, -6, -26, -20]).fill(feather("#484c50"));
	// Left wing upper highlight.
	g.poly([-4, -16, -18, -20, -16, -12]).fill({
		color: feather("#e8ecf0"),
		alpha: 0.7,
	});

	// Right wing — mirrored.
	g.poly([4, -16, 26, -20, 22, -8, 28, -6, 8, -8]).fill(feather("#c8ccd0"));
	// Right wing tip.
	g.poly([22, -8, 28, -6, 26, -20]).fill(feather("#484c50"));
	// Right wing upper highlight.
	g.poly([4, -16, 18, -20, 16, -12]).fill({
		color: feather("#e8ecf0"),
		alpha: 0.7,
	});

	// --- Body: plump rounded torso ---
	g.ellipse(0, -12, 11, 9).fill(feather("#dde0e4"));
	// Underbelly — slightly warmer white.
	g.ellipse(0, -9, 7, 5).fill(feather("#f0f0ec"));

	// --- Head: round head sitting just above the body ---
	g.circle(0, -21, 7).fill(feather("#e8ecf0"));
	// Grey cap on top of the head (lesser black-backed colouring).
	g.ellipse(0, -25, 5, 3).fill(feather("#8a9098"));

	// --- Beak: orange-yellow hooked gull beak ---
	// Upper mandible.
	g.poly([4, -21, 12, -21, 10, -19, 5, -19]).fill(0xe89030);
	// Hook tip.
	g.poly([10, -19, 12, -21, 11, -17]).fill(0xc06818);
	// Lower mandible hint.
	g.poly([4, -20, 9, -20, 9, -18, 5, -18]).fill(0xd07820);
	// Red gonydeal spot (classic herring gull marker).
	g.circle(9, -19, 1).fill({ color: 0xcc2020, alpha: 0.8 });

	// --- Eyes: small round beady eyes ---
	g.circle(-3, -22, 2.5).fill(0xfff8e0);
	g.circle(-3, -22, 1.4).fill(0x151010);
	// Tiny glint.
	g.circle(-2, -23, 0.7).fill({ color: 0xffffff, alpha: 0.9 });

	// --- Feet: two small orange-yellow feet dangling below ---
	g.moveTo(-3, -8)
		.lineTo(-5, -2)
		.stroke({ color: 0xd08028, width: 2, cap: "round" });
	// Three toes left foot.
	g.moveTo(-5, -2)
		.lineTo(-9, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });
	g.moveTo(-5, -2)
		.lineTo(-5, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });
	g.moveTo(-5, -2)
		.lineTo(-2, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });

	g.moveTo(3, -8)
		.lineTo(5, -2)
		.stroke({ color: 0xd08028, width: 2, cap: "round" });
	g.moveTo(5, -2)
		.lineTo(2, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });
	g.moveTo(5, -2)
		.lineTo(5, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });
	g.moveTo(5, -2)
		.lineTo(8, 0)
		.stroke({ color: 0xd08028, width: 1.5, cap: "round" });

	c.addChild(g);
	return c;
}

/**
 * Barnacle cluster lurker (~36 wide, grown DOWNWARD from y=0). A mass of
 * barnacles crusted onto the cave ceiling, each a small conical shell with a
 * dark feathery opening. Grey-white shells tinted toward `accent`. Eyes read at
 * y≈16 inside the central barnacle — matching the base lurker so poop-drop and
 * collision still feel identical.
 */
export function drawBarnacleLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const shell = (hex: string) => tint(hex, accent, 0.22);

	// --- Crusty attach patch at the ceiling (y=0..4) ---
	g.ellipse(0, 3, 17, 4).fill(shell("#6a6a6a"));

	// Helper to draw one barnacle cone at (cx, cy) with given size.
	// A barnacle is a truncated cone (trapezoid) with a dark plate at the base
	// opening. Drawn downward — base (wide) at y=cy, tip (narrow) at y=cy-h.
	const barnacle = (
		cx: number,
		cy: number,
		hw: number,
		h: number,
		alpha = 1,
	): void => {
		const tipW = hw * 0.35;
		// Shell body — off-white with a grey rim.
		g.poly([
			cx - hw,
			cy,
			cx + hw,
			cy,
			cx + tipW,
			cy - h,
			cx - tipW,
			cy - h,
		]).fill({ color: shell("#b8bcba"), alpha });
		// Dark opening at the base.
		g.ellipse(cx, cy, hw * 0.88, hw * 0.32).fill({ color: 0x181818, alpha });
		// Feathery cirri hint — a couple of faint curved lines inside the opening.
		g.moveTo(cx - hw * 0.4, cy)
			.quadraticCurveTo(cx, cy + hw * 0.5, cx + hw * 0.4, cy)
			.stroke({ color: shell("#8ab0a8"), width: 0.8, alpha: 0.45 * alpha });
		// Lit edge along the left ridge.
		g.moveTo(cx - hw, cy)
			.lineTo(cx - tipW, cy - h)
			.stroke({ color: shell("#d8dcda"), width: 0.9, alpha: 0.55 * alpha });
	};

	// --- Cluster of barnacles: 7 shells of varied sizes ---
	// Central large barnacle — this is where the eyes live.
	barnacle(0, 28, 9, 18);
	// Mid-tier flanking barnacles.
	barnacle(-13, 24, 7, 14);
	barnacle(12, 24, 7, 14);
	// Outer smaller shells.
	barnacle(-22, 18, 5, 10, 0.85);
	barnacle(20, 18, 5, 10, 0.85);
	// Tiny accent barnacles filling gaps.
	barnacle(-7, 16, 4, 8, 0.7);
	barnacle(7, 16, 4, 8, 0.7);

	// Barnacle-on-barnacle texture: horizontal ridge lines on the central shell.
	for (let i = 1; i <= 3; i++) {
		const t = i / 4;
		const ry = 28 - 18 * t;
		const rw = 9 * (1 - t * 0.6);
		g.moveTo(-rw, ry)
			.lineTo(rw, ry)
			.stroke({ color: shell("#909490"), width: 0.7, alpha: 0.4 });
	}

	// --- Eyes: peering from inside the central barnacle opening (y≈16) ---
	// Pale iris — slightly luminous teal (beachy).
	const eyeCol = tint("#60c8b0", accent, 0.4);
	g.circle(-5, 29, 4).fill({ color: eyeCol, alpha: 0.9 });
	g.circle(6, 29, 4).fill({ color: eyeCol, alpha: 0.9 });
	// Dark slit pupils.
	g.circle(-5, 29, 2).fill(0x101010);
	g.circle(6, 29, 2).fill(0x101010);
	// Tiny highlight.
	g.circle(-4, 28, 1).fill({ color: 0xffffff, alpha: 0.75 });
	g.circle(7, 28, 1).fill({ color: 0xffffff, alpha: 0.75 });

	// Disgusting mouth — a dark gap below the eyes with a couple of barnacle "teeth".
	g.moveTo(-5, wobble(33, 11, 1) + 33)
		.quadraticCurveTo(0, 31, 5, wobble(33, 13, 1) + 33)
		.stroke({ color: 0x141414, width: 1.4, cap: "round" });

	c.addChild(g);
	return c;
}
