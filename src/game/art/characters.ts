import { Container, Graphics } from "pixi.js";
import type { ThemeStyle } from "../level/themes";
import { EN } from "../strings/en";
import { tintStr } from "./util";

/**
 * Draw a straight unicorn horn into `g`, tip pointing straight up.
 * `baseX`/`baseY` is where the horn meets the head; `color` sets the horn's
 * single hue (per character). Spiral ridges are drawn in a darker shade of the
 * same colour for a twisted look.
 */
function addHorn(
	g: Graphics,
	baseX: number,
	baseY: number,
	color: string,
): void {
	const tipX = baseX;
	const tipY = baseY - 18;
	// Solid horn shape (a slim vertical triangle).
	g.poly([baseX - 4, baseY, baseX + 4, baseY, tipX, tipY]).fill(color);
	// Spiral ridges in a darker shade of the same colour for a twisted look.
	const ridge = tintStr(color, "#000000", 0.28);
	for (let i = 0; i < 4; i++) {
		const t0 = i / 4;
		const t1 = (i + 0.55) / 4;
		const x0 = baseX + (tipX - baseX) * t0;
		const y0 = baseY + (tipY - baseY) * t0;
		const x1 = baseX + (tipX - baseX) * t1;
		const y1 = baseY + (tipY - baseY) * t1;
		const w = 8 * (1 - t0);
		g.moveTo(x0 - w / 2, y0)
			.lineTo(x0 + w / 2, y0)
			.lineTo(x1 + (w * 0.45) / 2, y1)
			.lineTo(x1 - (w * 0.45) / 2, y1)
			.closePath()
			.fill(ridge);
	}
}

/** Per-variant hat id drawn above/between the ears. `"none"` draws nothing. */
type HatId =
	| "none"
	| "cap"
	| "acorn"
	| "sunhat"
	| "witch"
	| "strawberry"
	| "crystal";

/**
 * Draw a small, cute per-character hat into `g`, sitting above/between the ears
 * and clearing the horn. Origin matches the caticorn (bottom-centre); the head
 * centre is at roughly `(0, -40)` with ears topping out near y=-56. Each hat is
 * deliberately tiny so it never hides the horn or ears.
 *
 * @param g - Graphics to draw into.
 * @param hat - Which hat to draw.
 */
function addHat(g: Graphics, hat: HatId): void {
	if (hat === "cap") {
		// Aubrey: a tiny backwards baseball cap perched on the head.
		// Crown dome.
		g.ellipse(-1, -55, 9, 6).fill("#e23b5a");
		g.ellipse(-1, -57, 8, 4).fill("#ff5d77");
		// Short brim poking forward (right).
		g.roundRect(5, -56, 8, 3, 1.5).fill("#c22f49");
		// Little button on top.
		g.circle(-1, -60, 1.4).fill("#ffd23f");
	} else if (hat === "acorn") {
		// Quinn: a leafy acorn cap.
		// Acorn nut body.
		g.ellipse(0, -57, 7, 6).fill("#8a5a2b");
		// Textured cap (lid) with a little point.
		g.ellipse(0, -60, 8, 4).fill("#5e3a18");
		g.poly([-2, -63, 2, -63, 0, -67]).fill("#5e3a18");
		// A small leaf sprig off to the side.
		g.ellipse(7, -61, 4, 2).fill("#46c66a");
		g.moveTo(3, -60)
			.lineTo(9, -62)
			.stroke({ color: "#34a052", width: 1, cap: "round" });
	} else if (hat === "sunhat") {
		// Summer: a wide straw sun hat with a flower.
		// Wide floppy brim.
		g.ellipse(-1, -54, 15, 5).fill("#e8c878");
		g.ellipse(-1, -55, 14, 4).fill("#f4dc9a");
		// Rounded crown.
		g.ellipse(-1, -58, 7, 5).fill("#e8c878");
		g.ellipse(-1, -60, 6, 3).fill("#f4dc9a");
		// Ribbon band.
		g.rect(-7, -57, 12, 2).fill("#ff8fc8");
		// Little flower on the band.
		for (let i = 0; i < 5; i++) {
			const a = (i / 5) * Math.PI * 2;
			g.circle(6 + Math.cos(a) * 2, -57 + Math.sin(a) * 2, 1.4).fill("#ff5da2");
		}
		g.circle(6, -57, 1.2).fill("#ffd23f");
	} else if (hat === "witch") {
		// Hallie: a small pointy witch hat (goth) with a star buckle.
		// Brim.
		g.ellipse(-1, -54, 13, 4).fill("#1b1620");
		// Tall cone leaning slightly, tip clearing the horn to the left.
		g.poly([-9, -55, 7, -55, -6, -74]).fill("#2a242e");
		// Lit left edge of the cone for a bit of form.
		g.poly([-9, -55, -3, -55, -6, -74]).fill("#3b3340");
		// Hat band + star buckle.
		g.rect(-9, -57, 16, 3).fill("#15121a");
		g.star(-1, -56, 4, 2.2).fill("#9b6bff");
	} else if (hat === "strawberry") {
		// Aubrey: a plump strawberry sitting on her head.
		// Berry body (rounded, pointing down).
		g.moveTo(-9, -58)
			.quadraticCurveTo(-11, -50, 0, -47)
			.quadraticCurveTo(11, -50, 9, -58)
			.quadraticCurveTo(0, -63, -9, -58)
			.fill("#ff3b5c");
		// Glossy highlight.
		g.ellipse(-3, -57, 3, 2).fill("#ff8095");
		// Seeds.
		for (const [sx, sy] of [
			[-4, -54],
			[3, -55],
			[0, -51],
			[5, -52],
			[-6, -51],
		] as const) {
			g.circle(sx, sy, 0.7).fill("#ffe14d");
		}
		// Green leafy calyx on top.
		for (let i = -2; i <= 2; i++) {
			g.poly([i * 3, -60, i * 3 - 2, -62, i * 3 + 2, -62]).fill("#46c66a");
		}
		g.poly([-2, -60, 2, -60, 0, -66]).fill("#34a052"); // little stem
	} else if (hat === "crystal") {
		// Hallie: a cluster of purple crystals.
		g.poly([-7, -54, -3, -54, -5, -66]).fill("#7a4fc0");
		g.poly([-3, -54, -3, -54, -5, -66]).fill("#9b6bff");
		g.poly([-1, -54, 5, -54, 2, -70]).fill("#8a5cd0");
		g.poly([2, -70, 5, -54, 3, -56]).fill("#b388ff"); // lit facet
		g.poly([4, -54, 9, -54, 7, -63]).fill("#7a4fc0");
		// Glints.
		g.circle(1, -64, 1).fill("#e6d8ff");
		g.circle(6, -60, 0.8).fill("#e6d8ff");
	}
}

/**
 * Shared caticorn renderer used by both the player and the rescuable cats.
 * Origin is bottom-centre; the body is built upward with negative y. `body`,
 * `ear`, and `mane` set the palette; `sad` swaps the happy face for a pleading,
 * trapped expression. An optional `hat` draws a small per-character hat above
 * the ears (player only; defaults to none).
 */
function buildCaticorn(opts: {
	body: string;
	bodyDark: string;
	ear: string;
	mane: string[];
	sad: boolean;
	/** Optional shirt colour drawn over the torso. */
	shirt?: string;
	/** Draw a white skull motif on the shirt (goth look). */
	skull?: boolean;
	/** Optional little hat drawn above/between the ears (player only). */
	hat?: HatId;
	/** Draw a fuller head of hair (extra mane strands over the head). */
	bigHair?: boolean;
	/** Horn colour (per character). Defaults to gold. */
	horn?: string;
	/** Draw big floppy koala-alien ears (the tropical "Stitch" captive look). */
	alien?: boolean;
	/** Draw clear round glasses over the eyes (Ruth). */
	glasses?: boolean;
}): Container {
	const c = new Container();
	const g = new Graphics();

	// Tail curling out the back-left, behind the body.
	g.moveTo(-12, -10)
		.quadraticCurveTo(-26, -14, -24, -30)
		.quadraticCurveTo(-23, -38, -16, -36)
		.stroke({ color: opts.body, width: 7, cap: "round" });
	g.circle(-16, -36, 4).fill(opts.mane[0] ?? opts.body);

	// Back legs / paws.
	g.roundRect(-11, -10, 8, 10, 3).fill(opts.bodyDark);
	g.roundRect(3, -10, 8, 10, 3).fill(opts.bodyDark);
	// Little paw toes.
	g.circle(-7, -1, 2).fill(opts.body);
	g.circle(7, -1, 2).fill(opts.body);

	// Body (rounded, sitting upright).
	g.roundRect(-14, -30, 28, 26, 12).fill(opts.body);
	// Belly shading highlight.
	g.ellipse(0, -14, 8, 9).fill(opts.bodyDark);

	// Optional shirt over the torso.
	if (opts.shirt) {
		g.roundRect(-14, -26, 28, 20, 10).fill(opts.shirt);
		if (opts.skull) {
			// White skull motif on the chest.
			g.circle(0, -18, 5).fill("#f4f4f4"); // cranium
			g.roundRect(-3, -15, 6, 4, 1).fill("#f4f4f4"); // jaw
			g.circle(-2, -19, 1.3).fill(opts.shirt); // eye socket
			g.circle(2, -19, 1.3).fill(opts.shirt); // eye socket
			g.rect(-0.6, -17, 1.2, 2).fill(opts.shirt); // nose
		}
	}

	// Front paws resting in front.
	g.roundRect(-9, -8, 7, 8, 3).fill(opts.body);
	g.roundRect(2, -8, 7, 8, 3).fill(opts.body);

	// Head.
	g.circle(0, -40, 14).fill(opts.body);

	if (opts.alien) {
		// Big floppy koala-alien ears (rounded, swept down the sides) instead of
		// the cat triangles — the blue-alien look. Inner ear in a soft pink.
		g.ellipse(-14, -46, 6, 9).fill(opts.body);
		g.ellipse(14, -46, 6, 9).fill(opts.body);
		g.ellipse(-14, -45, 3, 5.5).fill("#ff9ec4");
		g.ellipse(14, -45, 3, 5.5).fill("#ff9ec4");
		// A little tuft of head fur between the ears.
		g.poly([-3, -52, 0, -58, 3, -52]).fill(opts.bodyDark);
	} else {
		// Ears (cat triangles) with pink inner ear.
		g.poly([-13, -48, -6, -56, -3, -46]).fill(opts.body);
		g.poly([13, -48, 6, -56, 3, -46]).fill(opts.body);
		g.poly([-10, -49, -6, -54, -5, -48]).fill("#ff9ec4");
		g.poly([10, -49, 6, -54, 5, -48]).fill("#ff9ec4");
	}

	// Mane: a few coloured strands framing the face/neck.
	const maneStrands: [number, number, number][] = [
		[-12, -50, -18],
		[-13, -44, -22],
		[-12, -36, -20],
		[12, -50, 18],
		[13, -44, 22],
	];
	for (let i = 0; i < maneStrands.length; i++) {
		const [sx, sy, ex] = maneStrands[i];
		const col = opts.mane[i % opts.mane.length];
		g.moveTo(sx, sy)
			.quadraticCurveTo(ex, sy - 4, ex + (ex < 0 ? -1 : 1), sy + 6)
			.stroke({ color: col, width: 3, cap: "round" });
	}

	// Big hair: a fuller swept mass over the head plus longer side locks, in the
	// mane colours (used instead of a hat, e.g. Summer's pink hair).
	if (opts.bigHair) {
		const hair = opts.mane[0] ?? opts.body;
		const hairDark = opts.mane[2] ?? hair;
		// Rounded hair mass sitting on top of the head, between the ears.
		g.ellipse(0, -52, 13, 8).fill(hair);
		g.ellipse(-5, -54, 6, 5).fill(hairDark);
		g.ellipse(6, -53, 5, 4).fill(hairDark);
		// A few longer locks falling down each side of the face.
		for (const lx of [-13, -11, 11, 13]) {
			g.moveTo(lx, -48)
				.quadraticCurveTo(lx * 1.25, -36, lx, -26)
				.stroke({ color: hair, width: 3.5, cap: "round" });
		}
	}

	// Horn (per-character colour, defaults to gold).
	addHorn(g, 0, -52, opts.horn ?? "#ffd23f");

	// Cheek blush.
	g.circle(-8, -37, 3).fill("#ff9ec4");
	g.circle(8, -37, 3).fill("#ff9ec4");

	// Eyes.
	if (opts.sad) {
		// Big pleading eyes, downturned brows.
		g.ellipse(-5, -41, 3.2, 4).fill("#28323c");
		g.ellipse(5, -41, 3.2, 4).fill("#28323c");
		g.circle(-6, -43, 1.3).fill("#ffffff");
		g.circle(4, -43, 1.3).fill("#ffffff");
		// Worried brows.
		g.moveTo(-9, -46)
			.lineTo(-3, -45)
			.stroke({ color: "#28323c", width: 1.4, cap: "round" });
		g.moveTo(9, -46)
			.lineTo(3, -45)
			.stroke({ color: "#28323c", width: 1.4, cap: "round" });
		// Small frown.
		g.moveTo(-3, -33)
			.quadraticCurveTo(0, -36, 3, -33)
			.stroke({ color: "#28323c", width: 1.4, cap: "round" });
	} else {
		// Bright happy eyes with highlight.
		g.circle(-5, -41, 3).fill("#28323c");
		g.circle(5, -41, 3).fill("#28323c");
		g.circle(-6, -42, 1.2).fill("#ffffff");
		g.circle(4, -42, 1.2).fill("#ffffff");
		// Cheerful smile.
		g.moveTo(-4, -34)
			.quadraticCurveTo(0, -30, 4, -34)
			.stroke({ color: "#28323c", width: 1.5, cap: "round" });
	}

	// Nose.
	g.poly([-2, -37, 2, -37, 0, -35]).fill("#ff5d8f");

	// Optional clear round glasses over the eyes (Ruth). Pale near-clear lenses
	// with a thin warm rim + a bridge, sitting on the two eyes at y≈-41.
	if (opts.glasses) {
		g.circle(-5, -41, 4.5).fill({ color: 0xffffff, alpha: 0.16 });
		g.circle(5, -41, 4.5).fill({ color: 0xffffff, alpha: 0.16 });
		g.circle(-5, -41, 4.5).stroke({ color: 0xe7d6a0, width: 1.4 });
		g.circle(5, -41, 4.5).stroke({ color: 0xe7d6a0, width: 1.4 });
		g.moveTo(-0.6, -41)
			.lineTo(0.6, -41)
			.stroke({ color: 0xe7d6a0, width: 1.4, cap: "round" });
	}

	// Optional little hat above/between the ears (drawn last so it sits on top).
	if (opts.hat && opts.hat !== "none") {
		addHat(g, opts.hat);
	}

	c.addChild(g);
	return c;
}

/** Selectable hero caticorn identity. */
export type PlayerVariant = "aubrey" | "quinn" | "summer" | "hallie" | "ruth";

/** Per-variant palette + optional outfit for the hero caticorn. */
const PLAYER_PALETTES: Record<
	PlayerVariant,
	{
		body: string;
		bodyDark: string;
		mane: string[];
		shirt?: string;
		skull?: boolean;
		/** Little hat drawn above the ears, distinct per hero. */
		hat: HatId;
		/** Draw a fuller head of hair instead of a hat. */
		bigHair?: boolean;
		/** Horn colour, distinct per hero. */
		horn: string;
		/** Draw clear round glasses over the eyes. */
		glasses?: boolean;
	}
> = {
	aubrey: {
		body: "#4f8cff",
		bodyDark: "#3a6bd0",
		mane: ["#7ad0ff", "#ff9ec4", "#c8e6ff", "#ff5d8f"],
		hat: "strawberry",
		horn: "#ffd23f",
	},
	quinn: {
		body: "#46c66a",
		bodyDark: "#34a052",
		mane: ["#b6f55a", "#ff9ec4", "#d8ffb0", "#ff5d8f"],
		hat: "acorn",
		horn: "#ffe07a",
	},
	// Summer: an older caticorn with a full head of pink hair (cream coat). No
	// hat — the big pink hair is her look.
	summer: {
		body: "#f3e3d0",
		bodyDark: "#d8c2a8",
		mane: ["#ff8fc8", "#ff5da2", "#ffb3d9", "#ff6fb5"],
		hat: "none",
		bigHair: true,
		horn: "#ff8fc8",
	},
	// Hallie: goth caticorn with black hair, all-black clothes + a skull tee.
	hallie: {
		body: "#3b3340",
		bodyDark: "#2a242e",
		mane: ["#1a1620", "#2a242e", "#1a1620", "#3b3340"],
		shirt: "#15121a",
		skull: true,
		hat: "crystal",
		horn: "#c9a6ff",
	},
	// Ruth: strawberry-blonde caticorn with a layered fringe (big hair), clear
	// round glasses, and a denim-blue shirt.
	ruth: {
		body: "#f0d9b8",
		bodyDark: "#d6bc94",
		mane: ["#d9a05a", "#c98a44", "#e8c188", "#b87636"],
		shirt: "#8fb6d8",
		hat: "none",
		bigHair: true,
		horn: "#ffd23f",
		glasses: true,
	},
};

/**
 * Metadata for the character-select screen: each selectable hero with a
 * display name and its main colour swatch.
 */
export const CHARACTERS: { id: PlayerVariant; name: string; color: string }[] =
	[
		{
			id: "aubrey",
			name: EN.characters.aubrey,
			color: PLAYER_PALETTES.aubrey.body,
		},
		{
			id: "quinn",
			name: EN.characters.quinn,
			color: PLAYER_PALETTES.quinn.body,
		},
		{
			id: "summer",
			name: EN.characters.summer,
			color: PLAYER_PALETTES.summer.mane[0],
		},
		{ id: "hallie", name: EN.characters.hallie, color: "#c9c2d6" },
		{ id: "ruth", name: EN.characters.ruth, color: "#d9a05a" },
	];

/**
 * Build the heroic player caticorn. `"aubrey"` uses a blue palette (blue body
 * and mane with cyan + pink accents); `"quinn"` uses a green palette (green
 * body and mane with lime + pink accents). Same detailed design for all, only
 * the colours, outfit, and little hat differ per variant (aubrey: a cap; quinn:
 * an acorn cap; summer: a straw sun hat; hallie: a witch hat). Faces right,
 * bottom-centre origin, sized to roughly {@link PLAYER_W} x {@link PLAYER_H}.
 *
 * @param variant - Which hero to draw.
 * @returns A Pixi {@link Container} ready to position at a world point.
 */
export function drawPlayer(variant: PlayerVariant): Container {
	const p = PLAYER_PALETTES[variant];
	return buildCaticorn({
		body: p.body,
		bodyDark: p.bodyDark,
		ear: p.body,
		mane: p.mane,
		sad: false,
		shirt: p.shirt,
		skull: p.skull,
		hat: p.hat,
		bigHair: p.bigHair,
		horn: p.horn,
		glasses: p.glasses,
	});
}

/** A captive-caticorn palette: body, its darker shade, and mane strands. */
type CaticornPalette = { body: string; bodyDark: string; mane: string[] };

/**
 * Pool of cute rescuable-caticorn palettes. Deliberately distinct from the four
 * hero palettes (Aubrey blue `#4f8cff`, Quinn green `#46c66a`, Summer cream
 * `#f3e3d0`, Hallie black `#3b3340`) so captives never read as a hero. Each is a
 * soft, readable colour that pops against the dark cave background, paired with a
 * darker shade for shading and a pink-leaning mane.
 */
const CATICORN_PALETTES: CaticornPalette[] = [
	// Teal (the original captive colour, kept as index 0 for back-compat).
	{
		body: "#5ad1c8",
		bodyDark: "#39a8a0",
		mane: ["#ff9ec4", "#c8f5ff", "#ff5d8f"],
	},
	// Coral.
	{
		body: "#ff8a6b",
		bodyDark: "#d9624a",
		mane: ["#ffd0b0", "#fff0d6", "#ff5d8f"],
	},
	// Lavender.
	{
		body: "#b89bff",
		bodyDark: "#8f6fe0",
		mane: ["#e6d6ff", "#fff0ff", "#ff9ec4"],
	},
	// Mint.
	{
		body: "#86e3a6",
		bodyDark: "#56bb7d",
		mane: ["#d6ffe4", "#fff7d0", "#ff9ec4"],
	},
	// Peach.
	{
		body: "#ffc08a",
		bodyDark: "#e0975a",
		mane: ["#ffe6c4", "#fff6e6", "#ff9ec4"],
	},
	// Sky.
	{
		body: "#7ec8ff",
		bodyDark: "#4f9bdb",
		mane: ["#d0ecff", "#f0faff", "#ff9ec4"],
	},
	// Butter yellow.
	{
		body: "#ffe07a",
		bodyDark: "#e0b94a",
		mane: ["#fff3c4", "#fffae6", "#ff9ec4"],
	},
	// Rose.
	{
		body: "#ff9ec4",
		bodyDark: "#e06fa0",
		mane: ["#ffd6e8", "#fff0f6", "#ff5d8f"],
	},
];

/** Number of distinct rescuable-caticorn palettes available. */
export const CATICORN_PALETTE_COUNT = CATICORN_PALETTES.length;

/**
 * Build a rescuable caticorn in one of several cute palettes (see
 * {@link CATICORN_PALETTES}). Trapped (`happy` false) wears a sad, pleading
 * expression; once rescued (`happy` true) it beams. The `paletteIndex` selects a
 * colour from the pool (wrapped modulo the pool size); pass the SAME index for
 * the trapped and rescued draws so a captive keeps its colour when freed.
 * Faces right, bottom-centre origin.
 *
 * @param happy - Draw the cheerful rescued face instead of the trapped one.
 * @param paletteIndex - Index into the palette pool (defaults to 0; wraps).
 * @returns A Pixi {@link Container} ready to position at a world point.
 */
export function drawCaticorn(
	happy = false,
	paletteIndex = 0,
	style?: ThemeStyle,
): Container {
	// Tropical caves render captives as the blue koala-alien (with the caticorn
	// horn kept) — a fun "Stitch"-flavoured rescue. A small blue palette family,
	// varied per captive via the palette index.
	if (style === "tropical") {
		const blues: CaticornPalette[] = [
			{
				body: "#5aa9ff",
				bodyDark: "#3f7fd0",
				mane: ["#bfe2ff", "#eaf6ff", "#2f6fd0"],
			},
			{
				body: "#4f8fe6",
				bodyDark: "#3768b0",
				mane: ["#9fd0ff", "#dff0ff", "#2a5db0"],
			},
			{
				body: "#6cb6ff",
				bodyDark: "#4a8ad8",
				mane: ["#cdebff", "#f0faff", "#3a7fd0"],
			},
		];
		const b = blues[paletteIndex % blues.length];
		return buildCaticorn({
			body: b.body,
			bodyDark: b.bodyDark,
			ear: b.body,
			mane: b.mane,
			sad: !happy,
			alien: true,
			// Keep a bright caticorn horn so it's still a caticorn.
			horn: "#ffd23f",
		});
	}
	const p = CATICORN_PALETTES[paletteIndex % CATICORN_PALETTES.length];
	return buildCaticorn({
		body: p.body,
		bodyDark: p.bodyDark,
		ear: p.body,
		mane: p.mane,
		sad: !happy,
		// Individual horn per captive: the palette's accent mane colour.
		horn: p.mane[2] ?? p.mane[0] ?? "#ffd23f",
	});
}

/**
 * Build a cute-spooky ghost caticorn for the death animation: a pale, translucent
 * sheet body with a wavy bottom hem, the caticorn horn + ear silhouette, and big
 * sad eyes. Tinted faintly toward the variant colour so it reads as the hero who
 * died. Bottom-centre origin; the caller floats it upward.
 *
 * @param variant - Which hero died (controls the faint tint).
 * @returns A Pixi {@link Container} ready to position and float.
 */
export function drawGhost(variant: PlayerVariant): Container {
	const c = new Container();
	const g = new Graphics();
	const tint = PLAYER_PALETTES[variant].body;

	// Faint tint halo behind the sheet so the variant colour shows through.
	g.ellipse(0, -26, 18, 22).fill({ color: tint, alpha: 0.28 });

	// Sheet body: rounded top, wavy hem along the bottom.
	g.moveTo(-15, -14)
		.lineTo(-15, -38)
		.quadraticCurveTo(-15, -54, 0, -54)
		.quadraticCurveTo(15, -54, 15, -38)
		.lineTo(15, -14)
		// Wavy hem (three scallops) back to the start.
		.quadraticCurveTo(11, -8, 7, -14)
		.quadraticCurveTo(3, -8, 0, -14)
		.quadraticCurveTo(-3, -8, -7, -14)
		.quadraticCurveTo(-11, -8, -15, -14)
		.closePath()
		.fill({ color: "#eef2ff", alpha: 0.72 });

	// Ear silhouette poking through the sheet.
	g.poly([-12, -48, -6, -56, -3, -47]).fill({ color: "#eef2ff", alpha: 0.72 });
	g.poly([12, -48, 6, -56, 3, -47]).fill({ color: "#eef2ff", alpha: 0.72 });

	// Horn silhouette (faint, no rainbow on a ghost).
	g.poly([-3, -52, 3, -52, 4, -68]).fill({ color: "#dfe6ff", alpha: 0.8 });

	// Big sad eyes.
	g.ellipse(-5, -36, 3, 4).fill("#3a3550");
	g.ellipse(5, -36, 3, 4).fill("#3a3550");
	g.circle(-6, -38, 1.2).fill("#ffffff");
	g.circle(4, -38, 1.2).fill("#ffffff");
	// Worried brows + small frown.
	g.moveTo(-9, -41)
		.lineTo(-3, -40)
		.stroke({ color: "#3a3550", width: 1.2, cap: "round" });
	g.moveTo(9, -41)
		.lineTo(3, -40)
		.stroke({ color: "#3a3550", width: 1.2, cap: "round" });
	g.moveTo(-3, -29)
		.quadraticCurveTo(0, -32, 3, -29)
		.stroke({ color: "#3a3550", width: 1.2, cap: "round" });

	c.addChild(g);
	c.alpha = 0.85;
	return c;
}

/**
 * Draw "Luke": a human boss-crawler for the final cave, a friendly likeness of a
 * real person — roughly the size of a rescuable caticorn (taller than a normal
 * crawler). Recognisable look: a big bushy brown beard, a full head of brown
 * curls, square AMBER glasses, and a bright YELLOW zip jacket over a dark tee.
 * He carries a sword. Bottom-centre origin (feet at y=0), drawn upward with
 * negative y, facing right (the caller flips scale.x for the leftward leg).
 *
 * When `swinging` is true the sword is drawn EXTENDED out to the right (a wide
 * horizontal slash) instead of held upright — the telegraph for the frames where
 * his hitbox widens. Geometry is deterministic (fixed coords); the caller drives
 * the swing timing.
 *
 * @param swinging - Draw the sword extended (wide-slash pose) instead of resting.
 * @returns A Pixi {@link Container} drawn at its local origin (bottom-centre).
 */
export function drawLuke(swinging = false): Container {
	const c = new Graphics();

	const skin = "#e8b88f";
	const skinDark = "#d39a6f";
	const hair = "#6b4a2b";
	const hairDark = "#4f361f";
	const jacket = "#f6b21a"; // bright yellow zip jacket
	const jacketDark = "#d8930c";
	const tee = "#2b3038"; // dark tee under the open jacket
	const trouser = "#37404a";
	const amber = "#f0a81e"; // square amber glasses frames
	const blade = "#d8dde6";
	const bladeLit = "#f4f7fb";
	const guard = "#caa23a";

	// Legs (short, planted for the walk) — bottom-centre origin at the feet.
	c.roundRect(-7, -12, 5, 12, 2).fill(trouser);
	c.roundRect(2, -12, 5, 12, 2).fill(trouser);
	c.roundRect(-8, -2, 7, 3, 1).fill("#222831"); // shoes
	c.roundRect(1, -2, 7, 3, 1).fill("#222831");

	// Torso: yellow jacket, a touch taller than a crawler so he reads as bigger.
	c.roundRect(-10, -31, 20, 21, 5).fill(jacket);
	// Dark tee showing in the open V of the jacket.
	c.poly([-3, -31, 3, -31, 1.5, -16, -1.5, -16]).fill(tee);
	// Jacket zip edges + a side shade for form.
	c.rect(-1, -31, 0.8, 15).fill(jacketDark);
	c.rect(0.2, -31, 0.8, 15).fill(jacketDark);
	c.ellipse(6, -19, 3.5, 7).fill(jacketDark);

	// Arms (jacket sleeves). The right arm holds the sword; pose changes on swing.
	if (swinging) {
		// Right arm thrust out to the side for a wide horizontal slash.
		c.roundRect(7, -27, 14, 5, 2.5).fill(jacket);
		c.circle(21, -24, 2.6).fill(skinDark); // fist
	} else {
		// Right arm bent up, sword resting upright.
		c.roundRect(7, -29, 5, 13, 2.5).fill(jacket);
		c.circle(10, -31, 2.6).fill(skinDark); // fist near the hilt
	}
	// Left arm at the side.
	c.roundRect(-12, -29, 5, 13, 2.5).fill(jacket);

	// Sword: extended to the right when swinging (the wide-hitbox telegraph),
	// otherwise held upright.
	if (swinging) {
		c.roundRect(21, -26, 30, 4, 2).fill(blade);
		c.rect(21, -26, 30, 1.5).fill(bladeLit); // lit top edge
		c.poly([51, -24, 57, -24, 51, -20]).fill(blade); // pointed tip
		c.rect(17, -28, 3, 8).fill(guard); // crossguard
		c.roundRect(12, -27, 6, 6, 2).fill("#5a3a1f"); // grip
	} else {
		c.roundRect(11, -53, 4, 26, 2).fill(blade);
		c.rect(11, -53, 1.5, 26).fill(bladeLit);
		c.poly([11, -53, 15, -53, 13, -59]).fill(blade); // tip
		c.rect(8, -27, 10, 3).fill(guard); // crossguard
		c.roundRect(11, -24, 4, 6, 2).fill("#5a3a1f"); // grip
	}

	// Head.
	c.circle(0, -39, 8).fill(skin);
	c.ellipse(4, -39, 3, 5).fill(skinDark); // cheek shading

	// Big bushy beard: a broad rounded mass covering the lower face + jaw.
	c.moveTo(-8, -41)
		.quadraticCurveTo(-10, -30, -4, -26)
		.quadraticCurveTo(0, -24, 4, -26)
		.quadraticCurveTo(10, -30, 8, -41)
		.quadraticCurveTo(4, -35, 0, -35)
		.quadraticCurveTo(-4, -35, -8, -41)
		.fill(hair);
	// A few darker tufts for a bushy, textured beard.
	c.circle(-5, -31, 2.4).fill(hairDark);
	c.circle(0, -29, 2.6).fill(hairDark);
	c.circle(5, -31, 2.4).fill(hairDark);

	// Full curly brown hair: a fuller mound of overlapping circles, framing down
	// the sides past the temples.
	for (const [hx, hy, hr] of [
		[-7, -44, 4.5],
		[-2, -47, 5],
		[3, -47, 5],
		[7, -44, 4.5],
		[-9, -40, 3.8],
		[9, -40, 3.8],
		[-8, -36, 3],
		[8, -36, 3],
	] as const) {
		c.circle(hx, hy, hr).fill(hair);
	}
	c.circle(-2, -48, 2.2).fill(hairDark);
	c.circle(5, -47, 2).fill(hairDark);

	// Square amber glasses: two rounded-rect rims + a bridge, over the eyes.
	c.roundRect(-7, -41.5, 6, 5, 1.5).stroke({ color: amber, width: 1.6 });
	c.roundRect(1, -41.5, 6, 5, 1.5).stroke({ color: amber, width: 1.6 });
	c.moveTo(-1, -39)
		.lineTo(1, -39)
		.stroke({ color: amber, width: 1.6, cap: "round" });
	// Eyes behind the lenses.
	c.circle(-4, -39, 1.2).fill("#28323c");
	c.circle(4, -39, 1.2).fill("#28323c");

	const wrap = new Container();
	wrap.addChild(c);
	return wrap;
}
