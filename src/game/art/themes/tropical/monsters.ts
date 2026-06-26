import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Tropical-theme monster reskins. All three replace the base crawler/bat/lurker
 * shapes with bright beach-island creatures. No `Math.random` / `Date.now` —
 * all geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Tropical crab crawler (~32x28, bottom-centre origin, drawn upward).
 * Round carapace shell, two eye-stalks with bubble eyes, little claws at the
 * sides, and four stubby walking legs below. Shell sits on top so it reads
 * stompable. Bright coral/teal palette tinted toward `accent`.
 */
export function drawCrabCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const shell = (hex: string) => tint(hex, accent, 0.25);
	const claw = (hex: string) => tint(hex, accent, 0.3);

	// --- Legs: four pairs of short walking legs below the body ---
	for (const lx of [-10, -3, 4, 11]) {
		// Upper leg segment.
		g.moveTo(lx, -4)
			.lineTo(lx + wobble(lx, 5, 3), 0)
			.stroke({ color: shell("#cc5533"), width: 2.5, cap: "round" });
		// Lower leg / foot, angled outward.
		g.moveTo(lx + wobble(lx, 5, 3), 0)
			.lineTo(lx + wobble(lx, 7, 5) + (lx < 0 ? -4 : 4), 0)
			.stroke({ color: shell("#dd6644"), width: 2, cap: "round" });
	}

	// --- Round carapace shell (body) ---
	// Main shell dome — coral-orange with a warmer highlight.
	g.ellipse(0, -14, 16, 12).fill(shell("#e85c2a"));
	// Shell highlight (lit left quarter).
	g.ellipse(-5, -17, 8, 6).fill({ color: shell("#f5834e"), alpha: 0.7 });
	// Dark rim shadow under the shell.
	g.ellipse(0, -11, 14, 4).fill({ color: shell("#b03010"), alpha: 0.55 });
	// Shell pattern: three curved stripes across the carapace.
	for (let i = 0; i < 3; i++) {
		const sy = -18 + i * 3;
		const sw = 10 - i * 2;
		g.moveTo(-sw, sy)
			.quadraticCurveTo(0, sy - 3, sw, sy)
			.stroke({ color: shell("#b03010"), width: 1, alpha: 0.45 });
	}

	// --- Claws: two larger pincers at the sides, level with mid-body ---
	// Left claw.
	g.moveTo(-16, -14)
		.lineTo(-22, -18)
		.stroke({ color: claw("#cc5533"), width: 4, cap: "round" });
	// Left pincer nip (two small wedges).
	g.poly([-22, -18, -26, -21, -24, -17]).fill(claw("#dd6644"));
	g.poly([-22, -18, -25, -15, -22, -15]).fill(claw("#ee7755"));
	// Right claw.
	g.moveTo(16, -14)
		.lineTo(22, -18)
		.stroke({ color: claw("#cc5533"), width: 4, cap: "round" });
	// Right pincer nip.
	g.poly([22, -18, 26, -21, 24, -17]).fill(claw("#dd6644"));
	g.poly([22, -18, 25, -15, 22, -15]).fill(claw("#ee7755"));

	// --- Eye-stalks: two tall stalks rising above the shell ---
	// Left stalk.
	g.moveTo(-5, -22)
		.lineTo(-6, -28)
		.stroke({ color: shell("#cc5533"), width: 2.2, cap: "round" });
	// Right stalk.
	g.moveTo(5, -22)
		.lineTo(6, -28)
		.stroke({ color: shell("#cc5533"), width: 2.2, cap: "round" });
	// Eye bulbs at the top of each stalk.
	g.circle(-6, -29, 3.8).fill(tint("#ffffff", accent, 0.1));
	g.circle(6, -29, 3.8).fill(tint("#ffffff", accent, 0.1));
	// Pupils — dark, forward-facing.
	g.circle(-5.5, -29, 2.2).fill(0x0a0814);
	g.circle(6.5, -29, 2.2).fill(0x0a0814);
	// Tiny glint highlights.
	g.circle(-4.8, -30, 0.9).fill({ color: 0xffffff, alpha: 0.85 });
	g.circle(7.2, -30, 0.9).fill({ color: 0xffffff, alpha: 0.85 });

	c.addChild(g);
	return c;
}

/**
 * Tropical parrot bat reskin (~36 wide x 22 tall body, bottom-centre origin,
 * drawn upward). Bright feathered wings spread wide, a rounded bird body, a
 * short curved beak, and tail feathers. Teal/coral/yellow palette.
 */
export function drawParrotBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const feather = (hex: string) => tint(hex, accent, 0.28);

	// --- Wings: broad feathered wings, drawn behind the body ---
	// Left wing — teal primary.
	g.poly([-4, -16, -22, -24, -20, -12, -26, -9, -8, -8]).fill(
		feather("#1ab5a0"),
	);
	// Left wing inner highlight band.
	g.poly([-4, -16, -16, -22, -14, -12, -6, -10]).fill({
		color: feather("#34d4be"),
		alpha: 0.65,
	});
	// Right wing — coral/yellow accent.
	g.poly([4, -16, 22, -24, 20, -12, 26, -9, 8, -8]).fill(feather("#e8a020"));
	// Right wing inner highlight band.
	g.poly([4, -16, 16, -22, 14, -12, 6, -10]).fill({
		color: feather("#f0c040"),
		alpha: 0.65,
	});

	// --- Body: rounded bird torso ---
	g.ellipse(0, -13, 11, 10).fill(feather("#e05020"));
	// Breast highlight.
	g.ellipse(-2, -15, 6, 5).fill({ color: feather("#f07040"), alpha: 0.6 });

	// --- Head: a rounder knob sitting on the torso ---
	g.circle(0, -21, 7).fill(feather("#1ab5a0"));
	// Head cap patch (brighter stripe on top).
	g.ellipse(0, -25, 5, 3).fill({ color: feather("#f0e030"), alpha: 0.8 });

	// --- Beak: short curved triangle pointing right ---
	g.poly([6, -22, 13, -20, 6, -18]).fill(feather("#f0c030"));
	// Beak tip hook.
	g.poly([11, -20, 14, -19, 12, -22]).fill(feather("#d4a020"));
	// Nostril dot.
	g.circle(8, -22, 0.9).fill({ color: 0x2a1a08, alpha: 0.6 });

	// --- Eyes: bright round eyes with a dark pupil ---
	g.circle(-3, -21, 3.5).fill(tint("#ffffff", accent, 0.1));
	g.circle(-3, -21, 2).fill(0x0d0d1a);
	g.circle(-2.2, -22, 0.8).fill({ color: 0xffffff, alpha: 0.85 });

	// --- Tail feathers: short fan below body ---
	const tailAngles = [-30, -12, 6, 24] as const;
	for (const angleDeg of tailAngles) {
		const rad = (angleDeg * Math.PI) / 180;
		const fx = Math.sin(rad) * 10;
		const fy = -4 + Math.cos(rad) * 10;
		const col = angleDeg < 0 ? feather("#1ab5a0") : feather("#e8a020");
		g.moveTo(0, -5)
			.lineTo(fx, fy)
			.stroke({ color: col, width: 2.5, cap: "round" });
	}

	c.addChild(g);
	return c;
}

/**
 * Coconut lurker (~34 wide, grown DOWNWARD from y=0). A hairy coconut clings to
 * the ceiling on a short vine; round brown husk with fibre texture, a ring of
 * dark "eyes" (the three dark spots of a real coconut), and two small vine-tendril
 * arms reaching sideways. Drawn downward from y=0 to match the lurker convention
 * (eyes at y≈16 like the base lurker). Tinted toward `accent` on the husk.
 */
export function drawCoconutLurker(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const husk = (hex: string) => tint(hex, accent, 0.22);

	// --- Vine rope attaching to ceiling ---
	// Short dangling stem from ceiling to the top of the coconut.
	g.moveTo(-1, 0)
		.lineTo(-1 + wobble(3, 1, 2), 6)
		.stroke({ color: husk("#4a7c30"), width: 2.5, cap: "round" });
	g.moveTo(1, 0)
		.lineTo(1 + wobble(3, 2, 2), 6)
		.stroke({ color: husk("#3e6828"), width: 2, cap: "round" });
	// Small leaf tuft at ceiling attach.
	g.poly([-6, 0, 0, -3, 6, 0, 2, 4]).fill({
		color: husk("#5aa034"),
		alpha: 0.7,
	});

	// --- Coconut husk body (centred ~y=16, radius ~12) ---
	// Outer husk — dark warm brown.
	g.circle(0, 16, 13).fill(husk("#6b4226"));
	// Mid-tone husk layer.
	g.circle(0, 16, 11).fill(husk("#7d5030"));
	// Lit highlight on upper-left.
	g.ellipse(-4, 12, 7, 5).fill({ color: husk("#9e6e46"), alpha: 0.65 });
	// Fibre texture: a few curved strokes across the husk.
	for (let i = 0; i < 4; i++) {
		const fy = 10 + i * 4;
		const fw = 8 - Math.abs(i - 1.5) * 2;
		g.moveTo(-fw, fy)
			.quadraticCurveTo(wobble(fy, i + 13, 3), fy - 2, fw, fy)
			.stroke({ color: husk("#4e2e18"), width: 0.9, alpha: 0.4 });
	}

	// --- Three dark "eye" spots (real coconut face pattern) at y≈16 ---
	// These are the three dark germination pores — they double as the creature face.
	// Left eye spot.
	g.circle(-5, 16, 2.8).fill(0x100808);
	g.circle(-5, 16, 1.6).fill(tint("#2fd6c8", accent, 0.6)); // glowing iris
	g.circle(-4.4, 15.3, 0.7).fill({ color: 0xffffff, alpha: 0.75 });
	// Right eye spot.
	g.circle(5, 16, 2.8).fill(0x100808);
	g.circle(5, 16, 1.6).fill(tint("#2fd6c8", accent, 0.6));
	g.circle(5.6, 15.3, 0.7).fill({ color: 0xffffff, alpha: 0.75 });
	// Central nose/mouth pore (smaller, lower).
	g.circle(0, 20, 2).fill(0x180e08);
	// Smug curved mouth below the pores.
	g.moveTo(-5, 23)
		.quadraticCurveTo(0, 21, 5, 23)
		.stroke({ color: 0x180e08, width: 1.3, cap: "round" });

	// --- Vine tendril arms reaching outward from mid-body ---
	// Left tendril.
	g.moveTo(-11, 14)
		.quadraticCurveTo(-18, 10, -22, 6)
		.stroke({ color: husk("#4a7c30"), width: 2.5, cap: "round" });
	// Left leaf.
	g.poly([-22, 6, -28, 2, -24, 8]).fill({
		color: husk("#5aa034"),
		alpha: 0.75,
	});
	// Right tendril.
	g.moveTo(11, 14)
		.quadraticCurveTo(18, 10, 22, 6)
		.stroke({ color: husk("#4a7c30"), width: 2.5, cap: "round" });
	// Right leaf.
	g.poly([22, 6, 28, 2, 24, 8]).fill({ color: husk("#5aa034"), alpha: 0.75 });

	c.addChild(g);
	return c;
}
