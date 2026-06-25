import { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../../util";

/**
 * Disco-theme monster reskins. Two of the three base kinds get full replacements;
 * lurker keeps the base shape (return null handled in the pack).
 * No `Math.random` / `Date.now` — all geometry is fixed or derived from `wobble()`.
 *
 * Coordinate conventions (matching `drawMonster` in props.ts):
 *   - crawler / bat: bottom-centre origin, drawn upward (negative y).
 *   - lurker: ceiling-attach origin, drawn DOWNWARD (positive y from 0).
 */

/**
 * Groovy Dancing Bot crawler reskin (~32x28, bottom-centre origin, drawn upward).
 * A boxy/rounded robot body with a light-up chest panel, antenna, neon rim, and
 * stubby leg joints — as if it's mid-bop. Head sits visually on top so it reads
 * stompable. Tinted lightly toward `accent`; neon details stay vivid.
 */
export function drawDiscoCrawler(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Neon disco palette helpers — lightly blended toward accent.
	const neon = (hex: string) => tint(hex, accent, 0.18);
	const body = (hex: string) => tint(hex, accent, 0.32);

	// --- Leg joints: two chunky blocks below the body, slightly splayed ---
	// Left leg — angled outward a touch to read as mid-bop shuffle.
	g.roundRect(-14, -8, 8, 8, 2).fill(body("#2a1a40"));
	g.roundRect(-16, -3, 4, 4, 1.5).fill(body("#3a2855")); // foot pad
	// Right leg.
	g.roundRect(6, -8, 8, 8, 2).fill(body("#2a1a40"));
	g.roundRect(12, -3, 4, 4, 1.5).fill(body("#3a2855")); // foot pad
	// Neon ankle stripe on each foot.
	g.rect(-16, -4, 4, 1).fill({ color: neon("#00e5ff"), alpha: 0.9 });
	g.rect(12, -4, 4, 1).fill({ color: neon("#00e5ff"), alpha: 0.9 });

	// --- Main body: a boxy rounded torso ---
	g.roundRect(-15, -22, 30, 14, 5).fill(body("#1e0e32"));
	// Body rim glow — neon magenta outline.
	g.roundRect(-15, -22, 30, 14, 5).stroke({
		color: neon("#ff3df0"),
		width: 1.4,
		alpha: 0.75,
	});
	// Side panels — slightly lighter inset rectangles.
	g.roundRect(-13, -20, 7, 10, 2).fill(body("#2e1a4a"));
	g.roundRect(6, -20, 7, 10, 2).fill(body("#2e1a4a"));

	// --- Chest panel: a glowing rectangle on the torso front ---
	g.roundRect(-5, -20, 10, 8, 2).fill(body("#160a28"));
	// Three small indicator lights cycling magenta/cyan/yellow.
	const panelLights: [number, number, number][] = [
		[-3, -17, neon("#ff3df0")],
		[0, -17, neon("#00e5ff")],
		[3, -17, neon("#ffff00")],
	];
	for (const [lx, ly, col] of panelLights) {
		g.circle(lx, ly, 1.5).fill({ color: col, alpha: 0.95 });
	}
	// Tiny horizontal scan line on the chest panel.
	g.rect(-4, -14, 8, 1).fill({ color: neon("#ff3df0"), alpha: 0.45 });

	// --- Shoulders / neck connector ---
	g.roundRect(-16, -24, 6, 4, 2).fill(body("#2a1840")); // left shoulder bump
	g.roundRect(10, -24, 6, 4, 2).fill(body("#2a1840")); // right shoulder bump

	// --- Head: a small rounded square — stompable top silhouette ---
	g.roundRect(-11, -34, 22, 13, 4).fill(body("#241030"));
	// Neon rim on head.
	g.roundRect(-11, -34, 22, 13, 4).stroke({
		color: neon("#ff3df0"),
		width: 1.2,
		alpha: 0.65,
	});
	// Visor strip — a single cyan bar across the face (reads as "eyes").
	g.roundRect(-8, -31, 16, 5, 2).fill(body("#0a1820"));
	// Glowing visor slit: two eye-shaped cyan lights side-by-side.
	g.ellipse(-4, -29, 4, 2.2).fill({ color: neon("#00e5ff"), alpha: 0.95 });
	g.ellipse(4, -29, 4, 2.2).fill({ color: neon("#00e5ff"), alpha: 0.95 });
	// Highlight glints on visor.
	g.ellipse(-5, -30, 1.5, 1).fill({ color: 0xffffff, alpha: 0.6 });
	g.ellipse(3, -30, 1.5, 1).fill({ color: 0xffffff, alpha: 0.6 });

	// --- Antenna: a thin rod with a glowing tip ---
	// Shaft: slight wobble-derived lean so each level's bot looks a little different.
	const lean = wobble(22, 5, 2); // deterministic, keyed off fixed value
	g.moveTo(0, -34)
		.lineTo(lean, -42)
		.stroke({ color: body("#3a2060"), width: 2, cap: "round" });
	// Antenna ball tip — bright magenta.
	g.circle(lean, -42, 3).fill({ color: neon("#ff3df0"), alpha: 1.0 });
	g.circle(lean, -42, 1.5).fill({ color: 0xffffff, alpha: 0.6 }); // highlight

	// --- Neon rim arc at the very top of the head (disco halo effect) ---
	g.arc(0, -34, 12, Math.PI, 0).stroke({
		color: neon("#ff3df0"),
		width: 1,
		alpha: 0.35,
	});

	c.addChild(g);
	return c;
}

/**
 * Light-Up Disco Critter bat reskin (~36 wide x 22 tall body, bottom-centre
 * origin, drawn upward). A small flyer with a mini mirror-ball sphere body
 * (faceted cross-hatch), glowing neon spots, and little triangular wings.
 * Centred like the base bat. Bright magenta/cyan palette.
 */
export function drawDiscoBat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const neon = (hex: string) => tint(hex, accent, 0.18);
	const body = (hex: string) => tint(hex, accent, 0.32);

	// --- Wings: small triangular flaps on each side (base bat footprint) ---
	// Left wing.
	g.poly([-4, -16, -22, -20, -18, -10, -22, -8, -8, -8]).fill({
		color: body("#4a0a5a"),
		alpha: 0.85,
	});
	// Wing membrane vein lines (neon).
	g.moveTo(-4, -16)
		.lineTo(-20, -19)
		.stroke({ color: neon("#ff3df0"), width: 0.7, alpha: 0.5 });
	g.moveTo(-8, -10)
		.lineTo(-22, -9)
		.stroke({ color: neon("#ff3df0"), width: 0.5, alpha: 0.35 });

	// Right wing.
	g.poly([4, -16, 22, -20, 18, -10, 22, -8, 8, -8]).fill({
		color: body("#5a0a6a"),
		alpha: 0.85,
	});
	g.moveTo(4, -16)
		.lineTo(20, -19)
		.stroke({ color: neon("#ff3df0"), width: 0.7, alpha: 0.5 });
	g.moveTo(8, -10)
		.lineTo(22, -9)
		.stroke({ color: neon("#ff3df0"), width: 0.5, alpha: 0.35 });

	// --- Mirror-ball sphere body (centred at y≈-12 matching base bat) ---
	// Outer haze glow.
	g.ellipse(0, -12, 14, 13).fill({ color: neon("#ff3df0"), alpha: 0.12 });
	// Main sphere body.
	g.ellipse(0, -12, 11, 10).fill(body("#1a0a2a"));
	// Sphere rim.
	g.ellipse(0, -12, 11, 10).stroke({
		color: neon("#ff3df0"),
		width: 1.2,
		alpha: 0.7,
	});

	// Facet grid lines on the sphere (3h × 3v cross-hatch = mirror-ball effect).
	const facetLines = 3;
	const rx = 11;
	const ry = 10;
	for (let li = -facetLines; li <= facetLines; li++) {
		// Horizontal facet lines.
		const offsetH = (ry * li) / facetLines;
		const halfH = Math.sqrt(Math.max(0, ry * ry - offsetH * offsetH));
		const scaledH = (halfH / ry) * rx;
		g.moveTo(-scaledH, -12 + offsetH)
			.lineTo(scaledH, -12 + offsetH)
			.stroke({ color: neon("#e040fb"), width: 0.55, alpha: 0.4 });
		// Vertical facet lines.
		const offsetV = (rx * li) / facetLines;
		const halfV = Math.sqrt(Math.max(0, rx * rx - offsetV * offsetV));
		const scaledV = (halfV / rx) * ry;
		g.moveTo(offsetV, -12 - scaledV)
			.lineTo(offsetV, -12 + scaledV)
			.stroke({ color: neon("#00e5ff"), width: 0.55, alpha: 0.4 });
	}

	// Glowing neon spots scattered over the sphere — deterministic positions.
	// Keyed off fixed constants so they're identical every time.
	const spots: [number, number, number, number][] = [
		[-4, -16, 2.2, neon("#ff3df0")],
		[5, -14, 1.8, neon("#00e5ff")],
		[0, -9, 2.0, neon("#ffff00")],
		[-6, -10, 1.6, neon("#ff3df0")],
		[4, -20, 1.5, neon("#00e5ff")],
	];
	for (const [sx, sy, sr, col] of spots) {
		g.circle(sx, sy, sr).fill({ color: col, alpha: 0.9 });
		// Tiny bright highlight inside each spot.
		g.circle(sx - 0.5, sy - 0.5, sr * 0.4).fill({
			color: 0xffffff,
			alpha: 0.6,
		});
	}

	// --- Ears: small pointed nubs on top of the sphere ---
	g.poly([-6, -21, -3, -26, -1, -21]).fill(body("#3a0a4a"));
	g.poly([6, -21, 3, -26, 1, -21]).fill(body("#3a0a4a"));
	// Neon inner ear fill.
	g.poly([-5, -21, -3, -24, -2, -21]).fill({
		color: neon("#ff3df0"),
		alpha: 0.6,
	});
	g.poly([5, -21, 3, -24, 2, -21]).fill({ color: neon("#ff3df0"), alpha: 0.6 });

	// Under-glow ellipse beneath the body.
	g.ellipse(0, -4, 14, 4).fill({ color: neon("#ff3df0"), alpha: 0.13 });

	c.addChild(g);
	return c;
}
