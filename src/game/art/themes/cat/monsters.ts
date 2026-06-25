import { Container, Graphics } from "pixi.js";
import { tint } from "../../util";

/**
 * Draw the CAT-theme reskin of the crawler monster: a cute walking cat with
 * four stubby legs, a curled tail, rounded head with ears on top, whiskers,
 * and a slightly mischievous face. Bottom-centre origin; body drawn upward
 * (negative y). Head sits at the top so it is clearly stompable.
 *
 * Footprint: ~34 wide x ~32 tall — within the base crawler (~32x28) head room.
 * No `Math.random`; all geometry is fixed / deterministic.
 *
 * @param accent - Optional theme accent `#rrggbb` to tint the body toward.
 * @returns A Pixi {@link Container} ready for the crawler entity.
 */
export function drawCrawlerCat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	// Colour palette: warm ginger + cream belly, tinted toward accent.
	const fur = tint("#d96030", accent, 0.25); // ginger orange
	const furLit = tint("#f08050", accent, 0.22); // lighter ginger highlight
	const belly = tint("#f5ddb8", accent, 0.18); // cream belly
	const earInner = tint("#f0a070", accent, 0.2); // pink-peach ear interior
	const eyeCol = 0xffe050; // warm yellow eyes, untinted — enemy read
	const pupil = 0x1b1230;
	const nose = 0xe05858; // small pink nose
	const whiskerCol = 0xf8e8c8;

	// --- LEGS (four short rounded pegs below the body, at y=0 baseline) ---
	// Left pair.
	g.roundRect(-14, -8, 5, 8, 2.5).fill(fur);
	g.roundRect(-6, -7, 5, 7, 2.5).fill(fur);
	// Right pair.
	g.roundRect(1, -7, 5, 7, 2.5).fill(fur);
	g.roundRect(9, -8, 5, 8, 2.5).fill(fur);

	// --- BODY: squat rounded rectangle, straddles legs ---
	g.roundRect(-16, -20, 32, 14, 7).fill(fur);
	// Cream belly patch on the underside.
	g.ellipse(0, -14, 10, 5).fill(belly);
	// Subtle fur-stripe marking (tabby hint).
	g.moveTo(-6, -22)
		.lineTo(-4, -18)
		.stroke({ color: furLit, width: 1.2, alpha: 0.45 });
	g.moveTo(0, -23)
		.lineTo(0, -18)
		.stroke({ color: furLit, width: 1.2, alpha: 0.45 });
	g.moveTo(6, -22)
		.lineTo(4, -18)
		.stroke({ color: furLit, width: 1.2, alpha: 0.45 });

	// --- TAIL: curls upward and over the body on the left ---
	g.moveTo(-14, -14)
		.quadraticCurveTo(-26, -20, -20, -30)
		.stroke({ color: fur, width: 4.5, cap: "round" });
	// Tail tip: cream tuft.
	g.circle(-20, -30, 3).fill(belly);

	// --- HEAD: large round ball sitting on top of body, clearly enemy-top ---
	// Head is centred slightly rightward so the cat reads as facing right.
	const hx = 2;
	const hy = -30; // head centre
	g.circle(hx, hy, 11).fill(fur);
	// Forehead highlight.
	g.ellipse(hx - 2, hy - 4, 5, 3).fill(furLit);

	// Cat EARS: two triangles above the head.
	// Left ear.
	g.poly([hx - 9, hy - 8, hx - 5, hy - 8, hx - 7, hy - 17]).fill(fur);
	g.poly([hx - 8, hy - 9, hx - 6, hy - 9, hx - 7, hy - 15]).fill(earInner);
	// Right ear.
	g.poly([hx + 5, hy - 8, hx + 9, hy - 8, hx + 7, hy - 17]).fill(fur);
	g.poly([hx + 6, hy - 9, hx + 8, hy - 9, hx + 7, hy - 15]).fill(earInner);

	// EYES: glowing yellow with slit pupils (enemy signal).
	g.circle(hx - 4, hy, 3.4).fill(eyeCol);
	g.circle(hx + 4, hy, 3.4).fill(eyeCol);
	g.ellipse(hx - 4, hy, 1.2, 2.6).fill(pupil); // vertical slit
	g.ellipse(hx + 4, hy, 1.2, 2.6).fill(pupil);

	// NOSE + mouth.
	g.circle(hx, hy + 4, 1.5).fill(nose);
	// Mischievous smirk.
	g.moveTo(hx - 4, hy + 7)
		.quadraticCurveTo(hx, hy + 5, hx + 5, hy + 7)
		.stroke({ color: pupil, width: 1.3, cap: "round" });

	// WHISKERS: three each side from the cheek.
	const wy = hy + 4;
	g.moveTo(hx - 4, wy - 1)
		.lineTo(hx - 14, wy - 3)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx - 4, wy + 1)
		.lineTo(hx - 14, wy + 1)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx - 4, wy + 3)
		.lineTo(hx - 13, wy + 5)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.65 });
	g.moveTo(hx + 4, wy - 1)
		.lineTo(hx + 14, wy - 3)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx + 4, wy + 1)
		.lineTo(hx + 14, wy + 1)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx + 4, wy + 3)
		.lineTo(hx + 13, wy + 5)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.65 });

	c.addChild(g);
	return c;
}

/**
 * Draw the CAT-theme reskin of the bat monster: a flying cat with small feathery
 * wings, round ginger body, cat ears and a face looking forward/down. Drawn around
 * its centre — bottom-centre origin, body centred near y=-12 so it reads as a flyer
 * at the same vertical register as the base bat.
 *
 * Footprint: ~40 wide x ~26 tall — within the base bat (~36x22) envelope.
 * No `Math.random`; all geometry is fixed / deterministic.
 *
 * @param accent - Optional theme accent `#rrggbb` to tint the body toward.
 * @returns A Pixi {@link Container} ready for the bat entity.
 */
export function drawBatCat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const fur = tint("#d96030", accent, 0.25);
	const furLit = tint("#f08050", accent, 0.22);
	const belly = tint("#f5ddb8", accent, 0.18);
	const earInner = tint("#f0a070", accent, 0.2);
	const wingCol = tint("#c85828", accent, 0.28); // slightly deeper ginger wings
	const wingMem = tint("#e8784a", accent, 0.22); // wing membrane mid-tone
	const eyeCol = 0xff4d6d; // pink eyes — flyer signal (matches base bat's red)
	const eyeLit = 0xffe9a8;
	const pupil = 0x1b1230;
	const nose = 0xe05858;
	const whiskerCol = 0xf8e8c8;

	// --- WINGS: two small feathery cat-ear-shaped wings, one per side ---
	// Left wing (back, slightly behind body).
	g.poly([-4, -14, -20, -22, -18, -9, -24, -7, -10, -7]).fill(wingCol);
	// Membrane detail on left wing.
	g.moveTo(-4, -14)
		.lineTo(-20, -22)
		.stroke({ color: wingMem, width: 1, alpha: 0.5 });
	g.moveTo(-4, -12)
		.lineTo(-18, -9)
		.stroke({ color: wingMem, width: 1, alpha: 0.4 });

	// Right wing (front).
	g.poly([4, -14, 20, -22, 18, -9, 24, -7, 10, -7]).fill(
		tint("#e06838", accent, 0.25),
	);
	g.moveTo(4, -14)
		.lineTo(20, -22)
		.stroke({ color: wingMem, width: 1, alpha: 0.5 });
	g.moveTo(4, -12)
		.lineTo(18, -9)
		.stroke({ color: wingMem, width: 1, alpha: 0.4 });

	// --- BODY: round cat body at centre ---
	g.ellipse(0, -12, 11, 10).fill(fur);
	// Cream belly.
	g.ellipse(0, -11, 6, 5).fill(belly);
	// Fur highlight.
	g.ellipse(-2, -15, 4, 2.5).fill(furLit);

	// --- HEAD: merged with upper body, ears pointing up ---
	const hx = 0;
	const hy = -18;
	// Cat ears.
	g.poly([hx - 8, hy - 2, hx - 4, hy - 2, hx - 6, hy - 10]).fill(fur);
	g.poly([hx - 7, hy - 3, hx - 5, hy - 3, hx - 6, hy - 8]).fill(earInner);
	g.poly([hx + 4, hy - 2, hx + 8, hy - 2, hx + 6, hy - 10]).fill(fur);
	g.poly([hx + 5, hy - 3, hx + 7, hy - 3, hx + 6, hy - 8]).fill(earInner);

	// --- FACE ---
	// Eyes — pink glowing (flyer signal), small round with lit centre.
	g.circle(hx - 4, hy + 4, 3.2).fill(eyeCol);
	g.circle(hx + 4, hy + 4, 3.2).fill(eyeCol);
	g.circle(hx - 4, hy + 4, 1.2).fill(eyeLit);
	g.circle(hx + 4, hy + 4, 1.2).fill(eyeLit);

	// Tiny dot pupils.
	g.circle(hx - 4, hy + 4, 0.7).fill(pupil);
	g.circle(hx + 4, hy + 4, 0.7).fill(pupil);

	// Nose.
	g.circle(hx, hy + 7, 1.3).fill(nose);

	// Whiskers.
	const wy = hy + 7;
	g.moveTo(hx - 3, wy - 1)
		.lineTo(hx - 12, wy - 2)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.75 });
	g.moveTo(hx - 3, wy + 1)
		.lineTo(hx - 12, wy + 1)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.75 });
	g.moveTo(hx + 3, wy - 1)
		.lineTo(hx + 12, wy - 2)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.75 });
	g.moveTo(hx + 3, wy + 1)
		.lineTo(hx + 12, wy + 1)
		.stroke({ color: whiskerCol, width: 0.7, alpha: 0.75 });

	// Small fangs beneath.
	g.poly([hx - 3, hy + 9, hx - 1, hy + 9, hx - 2, hy + 12]).fill(0xffffff);
	g.poly([hx + 1, hy + 9, hx + 3, hy + 9, hx + 2, hy + 12]).fill(0xffffff);

	// Curled tail peeking out from behind the body on the left.
	g.moveTo(-9, -8)
		.quadraticCurveTo(-16, -4, -14, 2)
		.stroke({ color: fur, width: 3.5, cap: "round" });

	c.addChild(g);
	return c;
}

/**
 * Draw the CAT-theme reskin of the lurker monster: a ceiling-clinging cat
 * hanging upside-down. Origin at y=0 (ceiling attach point); all geometry
 * grows DOWNWARD (positive y), matching the base lurker convention.
 *
 * The cat grips the ceiling with its paws near y=0, body hangs below, face
 * looks downward, tail droops further down. Footprint matches the base lurker
 * (~30 wide x ~28 tall from y=0).
 *
 * No `Math.random`; all geometry is fixed / deterministic.
 *
 * @param accent - Optional theme accent `#rrggbb` to tint the body toward.
 * @returns A Pixi {@link Container} ready for the lurker entity.
 */
export function drawLurkerCat(accent: string | undefined): Container {
	const c = new Container();
	const g = new Graphics();

	const fur = tint("#b85028", accent, 0.28); // slightly deeper ginger for ceiling villain
	const furLit = tint("#e07040", accent, 0.22);
	const belly = tint("#f5ddb8", accent, 0.18);
	const earInner = tint("#f0a070", accent, 0.2);
	const eyeCol = 0xcfe34d; // same yellow-green as base lurker — ceiling signal
	const pupil = 0x1b1230;
	const nose = 0xe05858;
	const whiskerCol = 0xf8e8c8;

	// --- CEILING ATTACH BLOB: flattened oval grip pad at y~2-6 (top) ---
	g.ellipse(0, 4, 13, 5).fill(tint("#3a1a0a", accent, 0.3));
	g.ellipse(0, 4, 11, 3.5).fill(fur);

	// --- FRONT PAWS gripping the ceiling edge (small rounded rectangles near y=0) ---
	g.roundRect(-12, 2, 6, 5, 2.5).fill(fur);
	g.circle(-9, 7, 1.2).fill(belly); // toe pad left
	g.roundRect(6, 2, 6, 5, 2.5).fill(fur);
	g.circle(9, 7, 1.2).fill(belly); // toe pad right

	// --- BODY: squat rounded body hanging below attach point ---
	g.roundRect(-14, 7, 28, 20, 10).fill(fur);
	// Belly highlight.
	g.ellipse(0, 17, 9, 6).fill(belly);
	// Fur sheen.
	g.ellipse(-3, 11, 5, 3).fill(furLit);

	// --- HEAD: below body, face looking downward ---
	const hx = 0;
	const hy = 30; // positive y = below, looking down
	g.circle(hx, hy, 10).fill(fur);
	// Forehead lit patch (actually the lower face since upside-down).
	g.ellipse(hx, hy - 3, 5, 3).fill(furLit);

	// Cat EARS — pointing downward since cat is upside down (toward viewer).
	// Left ear (flips downward).
	g.poly([hx - 9, hy + 7, hx - 5, hy + 7, hx - 7, hy + 15]).fill(fur);
	g.poly([hx - 8, hy + 8, hx - 6, hy + 8, hx - 7, hy + 13]).fill(earInner);
	// Right ear.
	g.poly([hx + 5, hy + 7, hx + 9, hy + 7, hx + 7, hy + 15]).fill(fur);
	g.poly([hx + 6, hy + 8, hx + 8, hy + 8, hx + 7, hy + 13]).fill(earInner);

	// EYES looking downward — left untinted so they pop as enemy signal.
	g.circle(hx - 4, hy - 2, 4).fill(eyeCol);
	g.circle(hx + 4, hy - 2, 4).fill(eyeCol);
	g.ellipse(hx - 4, hy - 2, 1.4, 2.8).fill(pupil);
	g.ellipse(hx + 4, hy - 2, 1.4, 2.8).fill(pupil);

	// NOSE.
	g.circle(hx, hy + 3, 1.5).fill(nose);

	// Smug mouth.
	g.moveTo(hx - 4, hy + 6)
		.quadraticCurveTo(hx, hy + 4, hx + 4, hy + 6)
		.stroke({ color: pupil, width: 1.3, cap: "round" });

	// WHISKERS (pointing outward from face).
	const wy = hy + 3;
	g.moveTo(hx - 4, wy - 1)
		.lineTo(hx - 14, wy - 2)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx - 4, wy + 1)
		.lineTo(hx - 14, wy + 1)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.75 });
	g.moveTo(hx + 4, wy - 1)
		.lineTo(hx + 14, wy - 2)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.8 });
	g.moveTo(hx + 4, wy + 1)
		.lineTo(hx + 14, wy + 1)
		.stroke({ color: whiskerCol, width: 0.8, alpha: 0.75 });

	// TAIL: droops further downward from body.
	g.moveTo(12, 22)
		.quadraticCurveTo(20, 28, 18, 38)
		.stroke({ color: fur, width: 4, cap: "round" });
	// Tail tip: cream tuft.
	g.circle(18, 38, 2.8).fill(belly);

	c.addChild(g);
	return c;
}
