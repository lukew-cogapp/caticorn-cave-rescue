import { Container, Graphics, Text } from "pixi.js";
import { EN } from "./strings/en";
import type { Decor } from "./types";
import { GAME_HEIGHT, PLAYER_H, PLAYER_W } from "./types";

/**
 * Parse a `#rrggbb` (or `rrggbb`) hex string into an `[r, g, b]` triple of
 * 0-255 integers. Used by the background gradient interpolation.
 */
function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	const r = Number.parseInt(h.slice(0, 2), 16);
	const g = Number.parseInt(h.slice(2, 4), 16);
	const b = Number.parseInt(h.slice(4, 6), 16);
	return [r, g, b];
}

/** Linear-interpolate two 0-255 channel values and clamp to an integer. */
function lerp(a: number, b: number, t: number): number {
	return Math.round(a + (b - a) * t);
}

/** Pack an `[r, g, b]` triple into a single `0xRRGGBB` colour number. */
function packRgb(r: number, g: number, b: number): number {
	return (r << 16) | (g << 8) | b;
}

/** Clamp a colour channel to a valid 0-255 integer (guards against under/overflow). */
function clampByte(n: number): number {
	return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * Draw a spiral/rainbow unicorn horn into `g`, tip pointing up-forward.
 * `baseX`/`baseY` is where the horn meets the head; it leans slightly right
 * (the facing direction) to read as a jaunty heroic horn.
 */
function addHorn(g: Graphics, baseX: number, baseY: number): void {
	const tipX = baseX + 5;
	const tipY = baseY - 18;
	// Solid horn shape (a slim triangle, leaning forward).
	g.poly([baseX - 4, baseY, baseX + 4, baseY, tipX, tipY]).fill("#ffd23f");
	// Rainbow spiral stripes across the horn.
	const stripes = ["#ff5d8f", "#ffd23f", "#5ad1c8", "#9b6bff"];
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
			.fill(stripes[i]);
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

	// Ears (cat triangles) with pink inner ear.
	g.poly([-13, -48, -6, -56, -3, -46]).fill(opts.body);
	g.poly([13, -48, 6, -56, 3, -46]).fill(opts.body);
	g.poly([-10, -49, -6, -54, -5, -48]).fill("#ff9ec4");
	g.poly([10, -49, 6, -54, 5, -48]).fill("#ff9ec4");

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

	// Horn.
	addHorn(g, 0, -52);

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

	// Optional little hat above/between the ears (drawn last so it sits on top).
	if (opts.hat && opts.hat !== "none") {
		addHat(g, opts.hat);
	}

	c.addChild(g);
	return c;
}

/** Selectable hero caticorn identity. */
export type PlayerVariant = "aubrey" | "quinn" | "summer" | "hallie";

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
	}
> = {
	aubrey: {
		body: "#4f8cff",
		bodyDark: "#3a6bd0",
		mane: ["#7ad0ff", "#ff9ec4", "#c8e6ff", "#ff5d8f"],
		hat: "strawberry",
	},
	quinn: {
		body: "#46c66a",
		bodyDark: "#34a052",
		mane: ["#b6f55a", "#ff9ec4", "#d8ffb0", "#ff5d8f"],
		hat: "acorn",
	},
	// Summer: an older caticorn with a full head of pink hair (cream coat).
	summer: {
		body: "#f3e3d0",
		bodyDark: "#d8c2a8",
		mane: ["#ff8fc8", "#ff5da2", "#ffb3d9", "#ff6fb5"],
		hat: "sunhat",
	},
	// Hallie: goth caticorn with black hair, all-black clothes + a skull tee.
	hallie: {
		body: "#3b3340",
		bodyDark: "#2a242e",
		mane: ["#1a1620", "#2a242e", "#1a1620", "#3b3340"],
		shirt: "#15121a",
		skull: true,
		hat: "crystal",
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
	});
}

/**
 * Build a rescuable caticorn in a teal/cyan palette with pink accents. Trapped
 * (`happy` false) wears a sad, pleading expression; once rescued (`happy` true)
 * it beams. Faces right, bottom-centre origin.
 *
 * @param happy - Draw the cheerful rescued face instead of the trapped one.
 * @returns A Pixi {@link Container} ready to position at a world point.
 */
export function drawCaticorn(happy = false): Container {
	return buildCaticorn({
		body: "#5ad1c8",
		bodyDark: "#39a8a0",
		ear: "#5ad1c8",
		mane: ["#ff9ec4", "#c8f5ff", "#ff5d8f"],
		sad: !happy,
	});
}

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
 * @param kind - Which baddie to draw.
 * @param accent - Optional theme accent `#rrggbb` to recolour the body toward.
 * @returns A Pixi {@link Container} ready to position at a world point.
 */
export function drawMonster(
	kind: "crawler" | "bat" | "lurker",
	accent?: string,
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
 *
 * @param kind - Which particle to draw.
 * @returns A Pixi {@link Container} drawn centred on its origin.
 */
export function drawParticle(
	kind: "spark" | "note" | "puff" | "dust",
): Container {
	const c = new Container();
	const g = new Graphics();

	if (kind === "spark") {
		// Soft gold halo, then a bright white 4-point plus glint.
		g.circle(0, 0, 4).fill({ color: 0xffe14d, alpha: 0.35 });
		g.poly([0, -5, 1, -1, 0, 0, -1, -1]).fill("#fff6c4");
		g.poly([0, 5, 1, 1, 0, 0, -1, 1]).fill("#fff6c4");
		g.poly([-5, 0, -1, 1, 0, 0, -1, -1]).fill("#fff6c4");
		g.poly([5, 0, 1, 1, 0, 0, 1, -1]).fill("#fff6c4");
		g.circle(0, 0, 1.2).fill("#ffffff");
	} else if (kind === "note") {
		// Stem rising from the notehead, with a small flag.
		g.rect(2, -8, 1.4, 8).fill("#e8b84b");
		g.moveTo(3.4, -8)
			.quadraticCurveTo(6, -7, 5, -4)
			.stroke({ color: "#e8b84b", width: 1.4, cap: "round" });
		// Filled, slightly tilted notehead.
		g.ellipse(0, 1, 3, 2.3).fill("#ffd884");
	} else if (kind === "puff") {
		// A couple of overlapping pale-grey circles for soft smoke.
		g.circle(-1.5, 0, 3.5).fill({ color: 0xd6d6de, alpha: 0.7 });
		g.circle(2, -1, 3).fill({ color: 0xe4e4ea, alpha: 0.7 });
		g.circle(0.5, 1.5, 2.5).fill({ color: 0xc8c8d2, alpha: 0.7 });
	} else {
		// Small brown/tan speck cluster.
		g.circle(0, 0, 1.6).fill("#8a6a40");
		g.circle(-2.5, 1, 1.1).fill("#6b4f2e");
		g.circle(2.5, -1, 1).fill("#a8835a");
		g.circle(1, 2.5, 0.9).fill("#6b4f2e");
	}

	c.addChild(g);
	return c;
}

/**
 * Mix two `#rrggbb` hex colours and pack the result, reusing the existing
 * {@link hexToRgb}/{@link lerp}/{@link packRgb} helpers. `t=0` returns `a`,
 * `t=1` returns `b`. Lets the decor tone ramps be derived from one base colour.
 */
function mixHex(a: string, b: string, t: number): number {
	const [ar, ag, ab] = hexToRgb(a);
	const [br, bg, bb] = hexToRgb(b);
	return packRgb(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
}

/**
 * Recolour a base `#rrggbb` colour toward a theme `accent`, returning a packed
 * `0xRRGGBB`. Blends each channel a fraction `t` toward the accent (clamped to
 * 0-255), so a level's monsters/decor pick up its mood without losing their
 * silhouette. With no accent it returns the base colour unchanged.
 *
 * @param base - The sprite's intrinsic `#rrggbb` colour.
 * @param accent - Optional theme accent `#rrggbb` to blend toward.
 * @param t - Blend strength 0..1 (0 keeps base; 1 is full accent).
 * @returns Packed `0xRRGGBB` colour ready for a Pixi fill/stroke.
 */
function tint(base: string, accent: string | undefined, t: number): number {
	const [br, bg, bb] = hexToRgb(base);
	if (!accent) return packRgb(clampByte(br), clampByte(bg), clampByte(bb));
	const [ar, ag, ab] = hexToRgb(accent);
	return packRgb(
		clampByte(lerp(br, ar, t)),
		clampByte(lerp(bg, ag, t)),
		clampByte(lerp(bb, ab, t)),
	);
}

/**
 * As {@link tint}, but returns a `#rrggbb` string for the few helpers (such as
 * {@link addSpire}) that take colour strings rather than packed numbers.
 *
 * @param base - The intrinsic `#rrggbb` colour.
 * @param accent - Optional theme accent `#rrggbb` to blend toward.
 * @param t - Blend strength 0..1.
 * @returns A `#rrggbb` hex string.
 */
function tintStr(base: string, accent: string | undefined, t: number): string {
	return `#${tint(base, accent, t).toString(16).padStart(6, "0")}`;
}

/**
 * Deterministic small offset in `[-amp, amp]` keyed off `size` and an integer
 * `seed`, so repeated decor of the same kind varies without `Math.random`. Uses
 * the fractional part of a scaled sine as a cheap pseudo-random source.
 */
function wobble(size: number, seed: number, amp: number): number {
	const f = Math.sin(size * 12.9898 + seed * 78.233) * 43758.5453;
	return ((f - Math.floor(f)) * 2 - 1) * amp;
}

/**
 * Draw a tapered, multi-segment cave spire into `g` from a base at y=0 toward a
 * tip at `(tipX, dir*len)`, where `dir` is `+1` (down, stalactite) or `-1` (up,
 * stalagmite). Renders a 3-tone ramp (shadow body, lit edge, dark core seam) and
 * faint mineral bands. `seg` segment count and the per-segment lean give variety.
 */
function addSpire(
	g: Graphics,
	halfW: number,
	len: number,
	dir: number,
	tipX: number,
	seg: number,
	light: string,
	mid: string,
	dark: string,
): void {
	// Build a slightly wavy left and right edge that converges toward the tip.
	const left: number[] = [];
	const right: number[] = [];
	for (let i = 0; i <= seg; i++) {
		const t = i / seg;
		const y = dir * len * t;
		// Width tapers with a soft curve so the spire bulges near the base.
		const w = halfW * (1 - t) * (0.85 + 0.15 * (1 - t));
		const cx = tipX * t + wobble(len + i, i * 7 + 1, halfW * 0.06);
		left.push(cx - w, y);
		right.push(cx + w, y);
	}
	// Shadowed full silhouette.
	const poly = left.concat(right.reverse());
	g.poly(poly).fill(mid);
	// Lit edge: a slim sliver down the left side using the lighter tone.
	const lit: number[] = [];
	for (let i = 0; i <= seg; i++) {
		const lx = left[i * 2];
		const ly = left[i * 2 + 1];
		lit.push(lx, ly);
	}
	for (let i = seg; i >= 0; i--) {
		const t = i / seg;
		lit.push(left[i * 2] + halfW * 0.28 * (1 - t), left[i * 2 + 1]);
	}
	g.poly(lit).fill(light);
	// Dark core seam on the right for depth.
	const seam: number[] = [];
	for (let i = 0; i <= seg; i++) {
		seam.push(right[i * 2] - halfW * 0.22 * (1 - i / seg), right[i * 2 + 1]);
	}
	for (let i = seg; i >= 0; i--) {
		seam.push(right[i * 2], right[i * 2 + 1]);
	}
	g.poly(seam).fill(dark);
	// Faint mineral banding: a couple of thin cross strokes.
	for (let b = 1; b <= 2; b++) {
		const t = b / 3;
		const y = dir * len * t;
		const w = halfW * (1 - t) * 0.9;
		const cx = tipX * t;
		g.moveTo(cx - w, y)
			.lineTo(cx + w, y)
			.stroke({ color: dark, width: Math.max(1, halfW * 0.12), alpha: 0.35 });
	}
}

/**
 * Build a single decor piece at its local origin, scaled by `d.size`. The caller
 * positions it. Kinds: `stalactite` spikes DOWN from y=0 (ceiling); `stalagmite`
 * spikes UP from y=0 (floor); `crystal` is a small faceted gem centred on the
 * origin; `pebble`/`mushroom`/`moss` stand on the floor (drawn upward from the
 * base); `crack` is a faint jagged line drawn downward from the origin for walls.
 *
 * Gentle deterministic variation (segment counts, facet offsets, tuft layout) is
 * derived from `d.size` via {@link wobble} so repeated decor never looks
 * identical, with no `Math.random`/`Date.now`.
 *
 * When a theme `accent` (`#rrggbb`) is given, the structural fills (spire tones,
 * stones, mushroom cap, moss, crystal base) are blended toward it so the decor
 * matches the level mood; glints, glows, spots and contact shadows are left as-is
 * for readability. Omitting `accent` keeps the original colours, so existing call
 * sites are unaffected.
 *
 * @param d - Decor spec providing `kind` and `size`.
 * @param accent - Optional theme accent `#rrggbb` to recolour the decor toward.
 * @returns A Pixi {@link Container} drawn at its local origin.
 */
export function drawDecor(d: Decor, accent?: string): Container {
	const c = new Container();
	const g = new Graphics();
	const s = d.size;
	// Structural fills lean a fair way toward the accent; crystals stay subtle.
	const col = (hex: string) => tint(hex, accent, 0.4);

	if (d.kind === "stalactite") {
		// Tapered multi-segment spire hanging DOWN from the ceiling (y=0).
		const seg = 3 + (Math.floor(s) % 2); // 3-4 segments from size.
		const tipX = wobble(s, 3, s * 0.18); // gentle lean.
		addSpire(
			g,
			s * 0.5,
			s * 2,
			1,
			tipX,
			seg,
			tintStr("#5f5780", accent, 0.4),
			tintStr("#4a4360", accent, 0.4),
			tintStr("#332e47", accent, 0.4),
		);
		// Wet drip glint near the tip.
		g.circle(tipX, s * 1.82, s * 0.07).fill({ color: 0xbdb2e0, alpha: 0.8 });
	} else if (d.kind === "stalagmite") {
		// Tapered multi-segment spire rising UP from the floor (y=0).
		const seg = 3 + (Math.floor(s) % 2);
		const tipX = wobble(s, 5, s * 0.16);
		addSpire(
			g,
			s * 0.55,
			s * 2,
			-1,
			tipX,
			seg,
			tintStr("#5b567f", accent, 0.4),
			tintStr("#43406a", accent, 0.4),
			tintStr("#2d2a47", accent, 0.4),
		);
		// Faint lit cap on the tip.
		g.circle(tipX, -s * 1.85, s * 0.08).fill({ color: 0x726c95, alpha: 0.6 });
	} else if (d.kind === "crystal") {
		// Small faceted gem centred on the origin: light face, dark face, glint.
		// Crystals pull only gently toward the accent so they keep their gem read.
		const r = s * 0.5;
		const off = wobble(s, 2, r * 0.18); // facet asymmetry.
		const base = accent ? tintStr("#3aa9cf", accent, 0.5) : "#3aa9cf";
		const lightFace = mixHex(base, "#dffaff", 0.7);
		const darkFace = mixHex(base, "#10303f", 0.55);
		// Soft glow halo.
		g.circle(0, 0, r * 1.15).fill({ color: 0x8fe6ff, alpha: 0.18 });
		// Full gem silhouette (elongated hexagon).
		g.poly([
			off,
			-r,
			r * 0.72,
			-r * 0.25,
			r * 0.42,
			r,
			-r * 0.42,
			r,
			-r * 0.72,
			-r * 0.25,
		]).fill(mixHex(base, "#0b2733", 0.15));
		// Dark right face.
		g.poly([off, -r, r * 0.72, -r * 0.25, r * 0.42, r, off, r * 0.1]).fill(
			darkFace,
		);
		// Light left face.
		g.poly([off, -r, off, r * 0.1, -r * 0.42, r, -r * 0.72, -r * 0.25]).fill(
			lightFace,
		);
		// Bright glint on the lit face.
		g.poly([
			off - r * 0.12,
			-r * 0.45,
			off - r * 0.32,
			-r * 0.05,
			off - r * 0.16,
			-r * 0.08,
		]).fill({ color: 0xffffff, alpha: 0.9 });
	} else if (d.kind === "pebble") {
		// Cluster of 2-4 rounded stones with top-light and a contact shadow.
		const dark = col("#46414f");
		const mid = col("#5b5668");
		const top = col("#6f6a7e");
		// Soft contact shadow on the floor.
		g.ellipse(0, -s * 0.04, s * 0.62, s * 0.1).fill({
			color: 0x000000,
			alpha: 0.18,
		});
		const stones: [number, number, number][] = [
			[0, -s * 0.34, s * 0.42],
			[-s * 0.52, -s * 0.2, s * 0.3],
			[s * 0.5, -s * 0.18, s * 0.27],
			[s * 0.12, -s * 0.5, s * 0.22 + wobble(s, 9, s * 0.05)],
		];
		for (let i = 0; i < stones.length; i++) {
			const [px, py, pr] = stones[i];
			g.ellipse(px, py, pr, pr * 0.78).fill(i === 0 ? mid : dark);
			// Top-light highlight on the upper-left of each stone.
			g.ellipse(px - pr * 0.2, py - pr * 0.32, pr * 0.45, pr * 0.28).fill(
				i === 0 ? top : mid,
			);
		}
	} else if (d.kind === "mushroom") {
		// Cute cave mushroom: shaded stem, domed capped rim, glowing spots, shadow.
		const lean = wobble(s, 4, s * 0.06);
		// Ground shadow.
		g.ellipse(0, -s * 0.02, s * 0.34, s * 0.08).fill({
			color: 0x000000,
			alpha: 0.18,
		});
		// Stem with a darker shaded right side.
		g.roundRect(-s * 0.13, -s * 0.72, s * 0.26, s * 0.72, s * 0.12).fill(
			col("#d7cfba"),
		);
		g.roundRect(s * 0.0, -s * 0.72, s * 0.13, s * 0.72, s * 0.1).fill(
			col("#bcb39c"),
		);
		// Cap: a rounded dome with a lighter highlight band and a rim.
		g.ellipse(lean, -s * 0.7, s * 0.46, s * 0.34).fill(col("#6f5183"));
		g.ellipse(lean, -s * 0.78, s * 0.42, s * 0.24).fill(col("#8a66a0"));
		g.ellipse(lean - s * 0.12, -s * 0.84, s * 0.18, s * 0.1).fill(
			col("#a07cb8"),
		);
		// Cap rim/underside shadow line.
		g.ellipse(lean, -s * 0.62, s * 0.44, s * 0.1).fill(col("#5a4070"));
		// Glowing spots (2-3, count from size).
		const spots = 2 + (Math.floor(s) % 2);
		const spotXs = [-s * 0.16, s * 0.16, s * 0.02];
		for (let i = 0; i < spots; i++) {
			g.circle(lean + spotXs[i], -s * 0.76 + i * s * 0.04, s * 0.055).fill({
				color: 0xd2f3ff,
				alpha: 0.92,
			});
		}
	} else if (d.kind === "moss") {
		// Soft low clump: layered tufts in two greens with an irregular top edge.
		const darkG = col("#2c4429");
		const midG = col("#3e6638");
		const litG = col("#54834a");
		// Base pad hugging the floor.
		g.ellipse(0, -s * 0.05, s * 0.72, s * 0.13).fill(darkG);
		// Back row of taller tufts (darker).
		for (const tx of [-s * 0.42, -s * 0.05, s * 0.38]) {
			const h = s * 0.3 + wobble(s, tx, s * 0.06);
			g.poly([tx - s * 0.12, -s * 0.04, tx + s * 0.12, -s * 0.04, tx, -h]).fill(
				midG,
			);
		}
		// Front row of shorter, lighter tufts for a soft layered top edge.
		for (const tx of [-s * 0.55, -s * 0.22, s * 0.14, s * 0.5]) {
			const h = s * 0.2 + wobble(s, tx + 1, s * 0.05);
			g.poly([tx - s * 0.1, 0, tx + s * 0.1, 0, tx, -h]).fill(midG);
		}
		// A couple of lit fuzzy highlights.
		g.ellipse(-s * 0.12, -s * 0.13, s * 0.22, s * 0.1).fill(litG);
		g.ellipse(s * 0.26, -s * 0.1, s * 0.16, s * 0.08).fill(litG);
	} else {
		// Fine hairline wall fracture: a faint main crack with thin branches.
		const w = Math.max(0.8, s * 0.04);
		const jx = wobble(s, 6, s * 0.1); // lateral wander seed.
		g.moveTo(0, 0)
			.lineTo(s * 0.12 + jx, s * 0.42)
			.lineTo(-s * 0.06 + jx, s * 0.84)
			.lineTo(s * 0.1 + jx, s * 1.28)
			.lineTo(-s * 0.02 + jx, s * 1.7)
			.stroke({ color: 0x141220, width: w, alpha: 0.32 });
		// Two thin offshoot branches.
		g.moveTo(-s * 0.06 + jx, s * 0.84)
			.lineTo(-s * 0.34 + jx, s * 1.04)
			.stroke({ color: 0x141220, width: w * 0.7, alpha: 0.26 });
		g.moveTo(s * 0.1 + jx, s * 1.28)
			.lineTo(s * 0.32 + jx, s * 1.42)
			.stroke({ color: 0x141220, width: w * 0.6, alpha: 0.24 });
	}

	c.addChild(g);
	return c;
}

/**
 * Build a row of small grass blades/tufts sitting along the top edge of a
 * platform of the given `width`. Origin is the platform's top-left corner; the
 * row runs right along `x: 0..width` with `y=0` at the platform surface and
 * blades poking upward (negative y). Each blade's height, lean, and colour vary
 * deterministically by index via {@link wobble} (no `Math.random`). Muted,
 * natural greens.
 *
 * @param width - Platform width in pixels the grass row spans.
 * @returns A Container with the grass row at local origin (top-left).
 */
export function drawGrassBlades(width: number): Container {
	const c = new Container();
	const g = new Graphics();

	const greens = ["#3e6638", "#4f7d44", "#5e9450", "#54834a"];
	const spacing = 7;
	// Blades stepped across the width; a small inset keeps them off the corners.
	for (let x = 3; x <= width - 3; x += spacing) {
		// Deterministic per-blade variation keyed off the x position.
		const h = 5 + Math.abs(wobble(x, 1, 4)); // 5..9px tall.
		const lean = wobble(x, 2, 3); // sideways tip offset.
		const col = greens[Math.abs(Math.round(wobble(x, 3, 100))) % greens.length];
		// A small two-blade tuft: a taller main blade and a shorter neighbour.
		const halfW = 1.6;
		// Main blade as a thin tapered triangle curving to a leaning tip.
		g.moveTo(x - halfW, 0)
			.quadraticCurveTo(x - halfW * 0.4, -h * 0.6, x + lean, -h)
			.quadraticCurveTo(x + halfW * 0.4, -h * 0.6, x + halfW, 0)
			.closePath()
			.fill(col);
		// Shorter side blade leaning the other way.
		const h2 = h * 0.6;
		const lean2 = -lean * 0.7;
		g.moveTo(x - 0.6, 0)
			.quadraticCurveTo(x - 2 + lean2 * 0.5, -h2 * 0.6, x - 2.5 + lean2, -h2)
			.quadraticCurveTo(x - 1.2, -h2 * 0.5, x + 1, 0)
			.closePath()
			.fill(greens[(Math.abs(Math.round(x)) + 1) % greens.length]);
	}

	c.addChild(g);
	return c;
}

/**
 * Build a full-width, layered cave background for one level. Emulates a vertical
 * gradient between `bg[0]` (top) and `bg[1]` (bottom) by stacking horizontal
 * bands across {@link GAME_HEIGHT}, then layers (back to front): faint vertical
 * strata, deep glowing crystal/pool clusters, three depth layers of rock
 * silhouettes at different tones, distant stalactite + stalagmite silhouettes,
 * rock columns/arches, and a soft vignette. Tones are 3-4 lerp steps between
 * `bg[0]`/`bg[1]` with channels clamped to 0-255 (no underflow on dark themes).
 * Deterministic: a small local seeded PRNG drives variation (no `Math.random`).
 * Stays subtle so it never competes with gameplay. Cheap: no per-pixel work.
 *
 * @param worldWidth - Total world width in pixels; the background spans it.
 * @param bg - Two-stop `[top, bottom]` gradient as `#rrggbb` strings.
 * @returns A Container sized `worldWidth` x {@link GAME_HEIGHT} at top-left 0,0.
 */
export function drawBackground(
	worldWidth: number,
	bg: [string, string],
): Container {
	const c = new Container();
	const g = new Graphics();

	const [tr, tg, tb] = hexToRgb(bg[0]);
	const [br, bgc, bb] = hexToRgb(bg[1]);

	const bands = 24;
	const bandH = GAME_HEIGHT / bands;
	for (let i = 0; i < bands; i++) {
		const t = i / (bands - 1);
		const col = packRgb(lerp(tr, br, t), lerp(tg, bgc, t), lerp(tb, bb, t));
		// +1px overlap avoids hairline seams between bands.
		g.rect(0, i * bandH, worldWidth, bandH + 1).fill(col);
	}

	// Small local seeded PRNG (mulberry32-style) for deterministic variation.
	// Seeded from a fixed constant so the same world always looks the same.
	let seed = 0x9e3779b1;
	const rand = (): number => {
		seed = (seed + 0x6d2b79f5) | 0;
		let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
	// Random in [a, b).
	const rng = (a: number, b: number): number => a + rand() * (b - a);

	// 3-4 tonal rock steps between the two stops, biased toward the bottom tone,
	// with channels clamped so dark backgrounds never underflow to garbage.
	const tone = (t: number, shift: number): number =>
		packRgb(
			clampByte(lerp(tr, br, t) + shift),
			clampByte(lerp(tg, bgc, t) + shift),
			clampByte(lerp(tb, bb, t) + shift),
		);
	const wallFar = tone(0.55, -8); // far silhouette layer.
	const wallMid = tone(0.6, -18); // mid silhouette layer.
	const wallNear = tone(0.68, -30); // near (darkest) silhouette layer.
	const wallLight = tone(0.45, 16); // faint highlighted rock.

	// Faint vertical strata to suggest rock layers (cheap full-height stripes).
	for (let x = 0; x < worldWidth; x += 46) {
		const a = ((x / 46) % 2) * 0.04 + 0.03;
		g.rect(x, 0, 24, GAME_HEIGHT).fill({ color: wallFar, alpha: a });
	}

	// Deep glowing crystal/pool clusters far in the back: a soft coloured halo
	// with a brighter core, a few scattered along the floor and walls.
	const glowCols = [0x6fe3ff, 0x8f7bff, 0x6cff9e];
	const glowCount = Math.max(2, Math.floor(worldWidth / 520));
	for (let i = 0; i < glowCount; i++) {
		const gx = rng(40, worldWidth - 40);
		const gy = rng(GAME_HEIGHT * 0.45, GAME_HEIGHT - 56);
		const gr = rng(22, 40);
		const gc = glowCols[Math.floor(rand() * glowCols.length)];
		g.ellipse(gx, gy, gr * 1.4, gr).fill({ color: gc, alpha: 0.07 });
		g.ellipse(gx, gy, gr * 0.8, gr * 0.6).fill({ color: gc, alpha: 0.1 });
		// A couple of tiny bright crystal facets in the cluster.
		for (let k = 0; k < 3; k++) {
			const cx2 = gx + rng(-gr * 0.6, gr * 0.6);
			const cy2 = gy + rng(-gr * 0.3, gr * 0.3);
			g.poly([cx2, cy2 - 5, cx2 + 2.5, cy2, cx2, cy2 + 5, cx2 - 2.5, cy2]).fill(
				{ color: gc, alpha: 0.18 },
			);
		}
	}

	// Three depth layers of rolling rock silhouettes along the floor: far/light
	// first, then mid, then near/dark, each a row of overlapping ellipses at
	// deterministic positions. Lighter + smaller = further back.
	const layers: { col: number; alpha: number; base: number; amp: number }[] = [
		{ col: wallFar, alpha: 0.18, base: GAME_HEIGHT - 70, amp: 36 },
		{ col: wallMid, alpha: 0.24, base: GAME_HEIGHT - 50, amp: 46 },
		{ col: wallNear, alpha: 0.3, base: GAME_HEIGHT - 30, amp: 58 },
	];
	for (const layer of layers) {
		const step = 110 + layer.amp;
		for (let x = -step / 2; x < worldWidth + step; x += step) {
			const w2 = rng(step * 0.7, step * 1.1);
			const h2 = rng(layer.amp * 0.7, layer.amp * 1.2);
			const cy = layer.base - h2 * 0.3;
			g.ellipse(x + rng(-step * 0.2, step * 0.2), cy, w2, h2).fill({
				color: layer.col,
				alpha: layer.alpha,
			});
		}
	}

	// Distant stalactite silhouettes hanging from the ceiling (thin triangles).
	for (let x = rng(60, 140); x < worldWidth; x += rng(120, 220)) {
		const w2 = rng(10, 22);
		const len = rng(28, 70);
		g.poly([x - w2 / 2, 0, x + w2 / 2, 0, x + rng(-6, 6), len]).fill({
			color: wallMid,
			alpha: 0.22,
		});
	}
	// Distant stalagmite silhouettes rising from the floor.
	for (let x = rng(80, 180); x < worldWidth; x += rng(140, 260)) {
		const w2 = rng(14, 28);
		const len = rng(30, 64);
		const base = GAME_HEIGHT - 26;
		g.poly([
			x - w2 / 2,
			base,
			x + w2 / 2,
			base,
			x + rng(-6, 6),
			base - len,
		]).fill({ color: wallNear, alpha: 0.24 });
	}

	// A couple of tall rock columns / arches spanning floor to ceiling for scale.
	const colCount = Math.max(1, Math.floor(worldWidth / 700));
	for (let i = 0; i < colCount; i++) {
		const cx = rng(120, worldWidth - 120);
		const cw = rng(26, 44);
		// Column body, slightly waisted in the middle.
		g.poly([
			cx - cw / 2,
			0,
			cx + cw / 2,
			0,
			cx + cw * 0.32,
			GAME_HEIGHT * 0.5,
			cx + cw / 2,
			GAME_HEIGHT,
			cx - cw / 2,
			GAME_HEIGHT,
			cx - cw * 0.32,
			GAME_HEIGHT * 0.5,
		]).fill({ color: wallFar, alpha: 0.16 });
		// Faint lit edge down the left of the column.
		g.rect(cx - cw / 2, 0, 3, GAME_HEIGHT).fill({
			color: wallLight,
			alpha: 0.06,
		});
	}

	// Soft top + bottom vignette for cave depth.
	g.rect(0, 0, worldWidth, 40).fill({ color: 0x000000, alpha: 0.22 });
	g.rect(0, GAME_HEIGHT - 50, worldWidth, 50).fill({
		color: 0x000000,
		alpha: 0.28,
	});

	c.addChild(g);
	return c;
}

// Reference the player dimensions so they stay in sync with the renderer scale.
void PLAYER_W;
void PLAYER_H;
