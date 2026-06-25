import {
	type CaticornSpec,
	type Decor,
	type FluteSpec,
	GAME_WIDTH,
	GRAVITY,
	GROUND_Y,
	JUMP_VELOCITY,
	type Level,
	type MonsterSpec,
	type Platform,
	type PoopSpec,
	TRAMPOLINE_VELOCITY,
	type TrampolineSpec,
} from "./types";

// ---------------------------------------------------------------------------
// Physics budget (derived from the constants in types.ts and Player.ts).
//
// These drive every reachability decision below. They are computed once from
// the shared constants so the generator stays correct if the constants change.
// ---------------------------------------------------------------------------

/** Airtime of a single jump, seconds: 2 * |v| / g. */
const SINGLE_JUMP_AIRTIME = (2 * Math.abs(JUMP_VELOCITY)) / GRAVITY; // 0.8s
/** Peak height of a single jump, px: v^2 / (2g). */
const SINGLE_JUMP_PEAK = JUMP_VELOCITY ** 2 / (2 * GRAVITY); // 112px
/** Peak height of a trampoline bounce, px: v^2 / (2g). */
const TRAMPOLINE_PEAK = TRAMPOLINE_VELOCITY ** 2 / (2 * GRAVITY); // ~329px

/**
 * Conservative cap on how high above its take-off surface a platform may sit
 * and still be cleared by a double jump. The theoretical double-jump ceiling is
 * ~224px (two jumps, second near apex), but landing the second jump precisely
 * is hard, so we cap well under that.
 */
const DOUBLE_JUMP_CAP = 180;

/**
 * Conservative cap on how high above its take-off surface a platform may sit and
 * still be reached from a trampoline. The trampoline apex (~329px) less headroom
 * for imperfect timing and horizontal travel.
 */
const TRAMPOLINE_CAP = Math.floor(TRAMPOLINE_PEAK - 49); // ~280px

/** Fraction of a single jump's horizontal reach used as the max pit width. */
const GAP_SAFETY = 0.75;

/** Platform/decor geometry shared across the layout. */
const RESCUE_W = 150;
const RESCUE_H = 18;
const STEP_W = 90;
const STEP_H = 16;
const GROUND_H = 30;
/** Half-margin used when deciding whether an x sits safely on a ground span. */
const GROUND_EDGE = 16;
/** Player half-width used by the landing logic in Player.ts (PLAYER_W / 2). */
const PLAYER_HALF = 17;

/** How rescue platforms are arranged across a level. */
type LayoutStyle = "steps" | "zigzag" | "towers" | "gauntlet";

/** The pool of layout styles a seed can pick from, in difficulty-ish order. */
const LAYOUT_STYLES: LayoutStyle[] = ["steps", "zigzag", "towers", "gauntlet"];

/**
 * A cave theme: a readable mood palette. `bg` is the background gradient (top,
 * bottom); `accent` recolours monsters + decor toward the mood. All backgrounds
 * are kept dark enough that the bright caticorns pop.
 */
interface CaveTheme {
	/** Mood name, used as the level name. */
	name: string;
	/** Background gradient `[top, bottom]` as `#rrggbb`. */
	bg: [string, string];
	/** Scenery accent `#rrggbb` for tinting monsters + decor. */
	accent: string;
}

/**
 * The cave theme pool. A run seed picks (without immediate repeats) from these,
 * so different seeds yield visibly different cave sets. Backgrounds are dark; the
 * accent is a more saturated mood colour decor/monsters blend toward.
 */
const THEMES: CaveTheme[] = [
	{ name: "Amethyst Cavern", bg: ["#2a1a3e", "#160d22"], accent: "#9b6bff" },
	{ name: "Deep Ocean Grotto", bg: ["#0f2c46", "#081726"], accent: "#2f8fd6" },
	{ name: "Molten Hollow", bg: ["#3a1410", "#1c0806"], accent: "#ff6a2b" },
	{ name: "Mossy Overgrowth", bg: ["#16321f", "#0a1a11"], accent: "#4caf50" },
	{ name: "Glacier Vault", bg: ["#16314a", "#0c1b2c"], accent: "#7fd6ff" },
	{ name: "Sulphur Pits", bg: ["#33300f", "#1a1808"], accent: "#d8c23a" },
	{ name: "Bone Ash Catacomb", bg: ["#2c2630", "#16131a"], accent: "#c9bfae" },
	{
		name: "Bioluminescent Reef",
		bg: ["#0c2e30", "#061818"],
		accent: "#3ad6c8",
	},
	{ name: "Crimson Marrow", bg: ["#3a1224", "#1c0913"], accent: "#e23b6a" },
	{ name: "Verdigris Mine", bg: ["#10302e", "#081a18"], accent: "#3fb6a0" },
];

interface LevelConfig {
	name: string;
	/** Number of rescue platforms (caticorns) to place. */
	count: number;
	/** Player horizontal move speed, px/sec. */
	speed: number;
	monsterCount: number;
	bg: [string, string];
	/** Theme accent `#rrggbb` for tinting monsters + decor. */
	accent: string;
	/** Layout style: how rescue platforms are arranged. */
	style: LayoutStyle;
}

/** A solid floor span on the ground line, used to gate hazards/decor. */
interface GroundSeg {
	x: number;
	w: number;
}

/**
 * Tiny deterministic PRNG (LCG). Seeded per level so layouts are stable across
 * runs (no Math.random / Date.now anywhere in this module).
 */
function makeRng(seed: number): () => number {
	let s = seed & 0x7fffffff;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x7fffffff;
	};
}

/**
 * Builds the level list. Difficulty ramps by "more + faster": each level adds
 * caticorns, monsters and speed, and uses a distinct layout style + colour mood.
 *
 * Every level is run through {@link ensureSolvable} during generation, which
 * asserts (and, where needed, nudges) the layout so it is provably reachable
 * under the documented physics budget before being returned.
 *
 * The difficulty ramp is fixed (caticorn/monster counts + speed rise by level),
 * but the THEME (name, background, accent) and layout STYLE of each level are
 * picked from the seed, so each seed produces a visibly different, but equally
 * fair, set of four caves.
 *
 * @param baseSeed Seed for the deterministic theme + layout PRNG. Pass a fresh
 *   value per run for varied caves; omit (default) for a stable set (used by
 *   tests).
 */
export function buildLevels(baseSeed = 1000): Level[] {
	// Fixed per-level difficulty ramp; theme/style come from the seed below.
	const ramp = [
		{ count: 2, speed: 220, monsterCount: 1 },
		{ count: 3, speed: 250, monsterCount: 2 },
		{ count: 4, speed: 285, monsterCount: 3 },
		{ count: 5, speed: 320, monsterCount: 4 },
	];

	// One PRNG off the base seed drives theme + style selection for the whole run
	// (kept separate from each level's layout PRNG so layouts stay stable).
	const pick = makeRng(baseSeed * 2654435761);
	const themes = pickThemes(pick, ramp.length);
	const styles = pickStyles(pick, ramp.length);

	const configs: LevelConfig[] = ramp.map((r, i) => ({
		name: themes[i].name,
		count: r.count,
		speed: r.speed,
		monsterCount: r.monsterCount,
		bg: themes[i].bg,
		accent: themes[i].accent,
		style: styles[i],
	}));

	return configs.map((c, i) => makeLevel(c, i, baseSeed));
}

/**
 * Pick `n` cave themes from {@link THEMES} using the run PRNG, avoiding an
 * immediate repeat so consecutive caves always look distinct. Deterministic for
 * a given seed; different seeds give different themes and order.
 */
function pickThemes(rng: () => number, n: number): CaveTheme[] {
	const out: CaveTheme[] = [];
	let prev = -1;
	for (let i = 0; i < n; i++) {
		let idx = Math.floor(rng() * THEMES.length) % THEMES.length;
		if (idx === prev && THEMES.length > 1) idx = (idx + 1) % THEMES.length;
		out.push(THEMES[idx]);
		prev = idx;
	}
	return out;
}

/**
 * Pick `n` layout styles from {@link LAYOUT_STYLES} using the run PRNG, avoiding
 * an immediate repeat for layout variety. Deterministic for a given seed.
 */
function pickStyles(rng: () => number, n: number): LayoutStyle[] {
	const out: LayoutStyle[] = [];
	let prev = -1;
	for (let i = 0; i < n; i++) {
		let idx = Math.floor(rng() * LAYOUT_STYLES.length) % LAYOUT_STYLES.length;
		if (idx === prev && LAYOUT_STYLES.length > 1)
			idx = (idx + 1) % LAYOUT_STYLES.length;
		out.push(LAYOUT_STYLES[idx]);
		prev = idx;
	}
	return out;
}

/** Max horizontal distance a single jump covers at the given speed. */
function singleJumpReach(speed: number): number {
	return SINGLE_JUMP_AIRTIME * speed;
}

/** Max safe pit width for the given speed (clearly clearable in one jump). */
function maxGapWidth(speed: number): number {
	return singleJumpReach(speed) * GAP_SAFETY;
}

/**
 * Target height (top y) for rescue platform `i` in a given style. Heights are
 * expressed as a drop below GROUND_Y; the value is the platform-top distance
 * the player must jump up from the ground. {@link ensureSolvable} clamps any
 * value that exceeds the double-jump cap (or adds a trampoline).
 */
function platformDrop(style: LevelConfig["style"], i: number): number {
	switch (style) {
		case "steps":
			// Gentle ascending staircase, all single-jump height.
			return 70 + i * 30;
		case "zigzag":
			// Alternating low / mid, low platforms force only single jumps.
			return i % 2 === 0 ? 80 : 150;
		case "towers":
			// Higher pillars that demand a double jump.
			return 90 + (i % 3) * 45;
		case "gauntlet":
			// Tallest, varied; some need a double jump, the highest a trampoline.
			return 100 + ((i * 53) % 170);
	}
}

/**
 * Build one level: lay out rescue platforms and ground, then place hazards and
 * decor under fairness rules, then assert/repair reachability.
 */
function makeLevel(c: LevelConfig, index: number, baseSeed: number): Level {
	const rng = makeRng(baseSeed + index * 97);

	// Horizontal spacing between rescue platforms is capped so the run between
	// them is comfortable and the pit beneath each fits the jump budget.
	const span = 280;
	const worldWidth = Math.max(GAME_WIDTH, 220 + c.count * span + 220);

	const platforms: Platform[] = [];
	const caticorns: CaticornSpec[] = [];
	/** Per-rescue metadata used by the solver. */
	const rescues: { plat: Platform; needsTrampoline: boolean }[] = [];

	for (let i = 0; i < c.count; i++) {
		const px = 220 + i * span;
		let drop = platformDrop(c.style, i);

		// Decide how this platform is reached. Single/double jump are free; a
		// platform taller than the double-jump cap must get a trampoline, and is
		// itself clamped to the trampoline cap so it is never unreachable.
		let needsTrampoline = false;
		if (drop > DOUBLE_JUMP_CAP) {
			needsTrampoline = true;
			drop = Math.min(drop, TRAMPOLINE_CAP);
		}

		const py = GROUND_Y - drop;
		const plat: Platform = {
			x: px,
			y: py,
			w: RESCUE_W,
			h: RESCUE_H,
			grass: rng() < 0.5,
		};
		platforms.push(plat);
		// Early levels use shackles (free on contact); later levels introduce
		// cages (must be stomped). The last level mixes both for variety.
		const lastLevel = index === 3;
		const caged = index >= 2 && (!lastLevel || i % 2 === 1);
		caticorns.push({
			x: px + RESCUE_W / 2,
			y: py,
			containment: caged ? "cage" : "shackle",
		});
		rescues.push({ plat, needsTrampoline });

		// For tall single-/double-jump platforms, drop a stepping stone partway
		// up so a double jump is never strictly required to be frame-perfect.
		if (!needsTrampoline && drop > SINGLE_JUMP_PEAK) {
			platforms.push({
				x: px - STEP_W - 8,
				y: GROUND_Y - Math.min(SINGLE_JUMP_PEAK - 20, drop - 50),
				w: STEP_W,
				h: STEP_H,
			});
		}
	}

	// Ground floor with a pit gap centred under each rescue platform. Gaps are
	// sized to the per-level budget so each is clearly single-jump clearable.
	const gapHalf = Math.min(maxGapWidth(c.speed), span / 2 - 40) / 2;
	const groundSegs: GroundSeg[] = [];
	let cursor = 0;
	for (const cat of caticorns) {
		const segEnd = cat.x - gapHalf;
		if (segEnd > cursor) groundSegs.push({ x: cursor, w: segEnd - cursor });
		cursor = cat.x + gapHalf;
	}
	if (worldWidth > cursor)
		groundSegs.push({ x: cursor, w: worldWidth - cursor });
	for (const s of groundSegs) {
		// Most ground segments get a grassy top for variety (deterministic).
		platforms.push({
			x: s.x,
			y: GROUND_Y,
			w: s.w,
			h: GROUND_H,
			grass: rng() < 0.7,
		});
	}

	const trampolines: TrampolineSpec[] = [];

	// Place a trampoline on reachable ground before each platform that needs one.
	for (const r of rescues) {
		if (!r.needsTrampoline) continue;
		const tx = trampolineGroundX(r.plat, groundSegs);
		if (tx !== null) trampolines.push({ x: tx, y: GROUND_Y });
	}

	const monsters = placeMonsters(c, worldWidth, groundSegs, rng);
	// Poops are no longer authored into levels: they only come from ceiling
	// lurkers (so early levels without a lurker have none).
	const poops: PoopSpec[] = [];
	const flutes = placeFlutes(worldWidth, groundSegs, rng);
	const decor = makeDecor(worldWidth, groundSegs, rescues, trampolines, rng);

	const level: Level = {
		name: c.name,
		worldWidth,
		platforms,
		caticorns,
		monsters,
		poops,
		trampolines,
		flutes,
		decor,
		bg: c.bg,
		themeAccent: c.accent,
		moveSpeed: c.speed,
		spawn: { x: 60, y: GROUND_Y },
		exit: { x: worldWidth - 60, y: GROUND_Y },
	};

	return ensureSolvable(level);
}

/**
 * Pick a solid-ground x in front of (or below) a platform on which to stand a
 * trampoline so its bounce reaches the platform top. Prefers the ground segment
 * directly under the platform; falls back to the nearest segment before it.
 */
function trampolineGroundX(plat: Platform, segs: GroundSeg[]): number | null {
	const target = plat.x + plat.w / 2;
	let best: number | null = null;
	let bestDist = Infinity;
	for (const s of segs) {
		// A standable x within this segment, clamped to the platform's vicinity.
		const lo = s.x + GROUND_EDGE;
		const hi = s.x + s.w - GROUND_EDGE;
		if (hi <= lo) continue;
		const x = Math.max(lo, Math.min(hi, target));
		const dist = Math.abs(x - target);
		if (dist < bestDist) {
			bestDist = dist;
			best = x;
		}
	}
	return best;
}

/** Whether an x sits safely (with margin) on some ground segment. */
function onSolidGround(x: number, segs: GroundSeg[]): boolean {
	return segs.some(
		(s) => x >= s.x + GROUND_EDGE && x <= s.x + s.w - GROUND_EDGE,
	);
}

/** Find the ground segment containing x, or null over a pit. */
function segAt(x: number, segs: GroundSeg[]): GroundSeg | null {
	for (const s of segs) {
		if (x >= s.x && x <= s.x + s.w) return s;
	}
	return null;
}

/**
 * Place monsters fairly: crawlers patrol entirely within one ground segment
 * (never straddling a pit), bats float over gaps. Nothing spawns near the
 * player's spawn tile.
 */
function placeMonsters(
	c: LevelConfig,
	worldWidth: number,
	segs: GroundSeg[],
	rng: () => number,
): MonsterSpec[] {
	const monsters: MonsterSpec[] = [];
	const spawnSafe = 160; // keep monsters away from the spawn tile

	for (let i = 0; i < c.monsterCount; i++) {
		const base = 360 + i * (worldWidth / (c.monsterCount + 1));
		const isBat = i % 2 === 1;

		if (isBat) {
			monsters.push({
				x: Math.max(spawnSafe, base),
				y: GROUND_Y - 150,
				range: 90,
				speed: c.speed * 0.6,
				kind: "bat",
			});
			continue;
		}

		// Crawler: snap onto a ground segment wide enough for its patrol, and
		// shrink the patrol range so it never reaches a ledge into a pit.
		const seg = segAt(base, segs) ?? widestSeg(segs);
		if (!seg) continue;
		const segCentre = seg.x + seg.w / 2;
		if (segCentre < spawnSafe) continue;
		// Range must keep both ends inside the segment (minus a margin).
		const maxRange = Math.max(0, seg.w / 2 - GROUND_EDGE - PLAYER_HALF);
		const range = Math.min(110, maxRange);
		if (range < 24) continue; // segment too small for a fair patrol
		monsters.push({
			x: segCentre + (rng() - 0.5) * Math.max(0, seg.w - 2 * range - 40),
			y: GROUND_Y,
			range,
			speed: c.speed * 0.5,
			kind: "crawler",
		});
	}

	// From level 3 on, add a ceiling lurker that drips poop. It starts well past
	// the spawn zone and drifts slowly toward the player.
	if (c.monsterCount >= 3) {
		monsters.push({
			x: Math.max(spawnSafe + 200, worldWidth * 0.5),
			y: 0, // ceiling; positioned flush to the top by the Game
			range: 0,
			speed: 26, // deliberately slow stalk
			kind: "lurker",
		});
	}
	return monsters;
}

/** The widest ground segment past the spawn area, or null. */
function widestSeg(segs: GroundSeg[]): GroundSeg | null {
	let best: GroundSeg | null = null;
	for (const s of segs) {
		if (s.x + s.w < 160) continue;
		if (!best || s.w > best.w) best = s;
	}
	return best;
}

/**
 * Place 1-2 floating flute pickups (extra lives) above solid ground, at a
 * height reachable by a single jump, away from the spawn tile.
 */
function placeFlutes(
	worldWidth: number,
	segs: GroundSeg[],
	rng: () => number,
): FluteSpec[] {
	const flutes: FluteSpec[] = [];
	const count = 2;
	const floatY = GROUND_Y - 95; // single-jump reachable
	for (let i = 0; i < count; i++) {
		const jitter = (rng() - 0.5) * 60;
		const x = worldWidth * ((i + 1) / (count + 1)) + jitter;
		if (x < 150) continue;
		if (!onSolidGround(x, segs)) continue;
		flutes.push({ x, y: floatY });
	}
	return flutes;
}

/**
 * Scatter cave decor across the world for a furnished-but-not-cluttered feel.
 *
 * Three independent passes, all deterministic (seeded rng only):
 *  - Ceiling: "stalactite" (lethal spikes) kept OFF forced jump arcs (above a
 *    rescue platform's landing zone or a trampoline's bounce corridor), plus a
 *    RARE "crystal" accent (a small subtle gem after the art change).
 *  - Floor: "pebble" / "mushroom" / "moss" placed only on solid ground (never
 *    over a pit), at low density and emitted for only ~55% of candidates so it
 *    stays sparse.
 *  - Walls/background: faint "crack" texture at varying heights up the cave,
 *    needing no ground since it is purely decorative background.
 */
function makeDecor(
	worldWidth: number,
	segs: GroundSeg[],
	rescues: { plat: Platform; needsTrampoline: boolean }[],
	trampolines: TrampolineSpec[],
	rng: () => number,
): Decor[] {
	const decor: Decor[] = [];

	/** Horizontal exclusion zones for ceiling spikes (forced jump arcs). */
	const ceilingNoGo: { x: number; w: number }[] = [];
	for (const r of rescues) {
		// The landing zone is the platform top plus the player's half-width either
		// side (that is where a forced jump must come down).
		ceilingNoGo.push({
			x: r.plat.x - PLAYER_HALF - 12,
			w: r.plat.w + 2 * (PLAYER_HALF + 12),
		});
	}
	for (const t of trampolines) {
		// Keep spikes off the trampoline's vertical bounce corridor.
		ceilingNoGo.push({ x: t.x - 40, w: 80 });
	}
	const inCeilingNoGo = (x: number) =>
		ceilingNoGo.some((z) => x >= z.x && x <= z.x + z.w);

	// --- Ceiling pass: stalactites (lethal) + crystal accents, closely spaced. ---
	for (let x = 50; x < worldWidth - 30; x += 78 + rng() * 26) {
		const dx = x + rng() * 30;
		// Crystals are a small subtle gem: a sprinkling of overhead accents.
		if (rng() < 0.22) {
			decor.push({ x: dx, y: 0, kind: "crystal", size: 9 + rng() * 9 });
			continue;
		}
		if (inCeilingNoGo(dx)) continue; // never hang a spike over a forced jump arc
		decor.push({ x: dx, y: 0, kind: "stalactite", size: 12 + rng() * 22 });
	}

	// --- Floor pass: pebble / mushroom / moss / crystal on solid ground. ---
	const floorKinds: Decor["kind"][] = [
		"pebble",
		"mushroom",
		"moss",
		"pebble",
		"crystal",
	];
	for (let x = 60; x < worldWidth - 30; x += 64 + rng() * 24) {
		// Emit most candidates for a furnished floor (still skip a few for variety).
		if (rng() > 0.78) continue;
		const dx = x + rng() * 20;
		if (!onSolidGround(dx, segs)) continue; // never float over a pit
		const kind = floorKinds[Math.floor(rng() * floorKinds.length)];
		decor.push({ x: dx, y: GROUND_Y, kind, size: 8 + rng() * 12 });
	}

	// --- Wall pass: background cracks + the occasional embedded crystal, at
	// varying heights up the cave for depth. ---
	for (let x = 90; x < worldWidth - 50; x += 110 + rng() * 50) {
		const dx = x + rng() * 36;
		const y = 40 + rng() * (GROUND_Y - 80 - 40); // ~40 .. GROUND_Y-80
		if (rng() < 0.25) {
			decor.push({ x: dx, y, kind: "crystal", size: 8 + rng() * 7 });
		} else {
			decor.push({ x: dx, y, kind: "crack", size: 16 + rng() * 20 });
		}
	}

	return decor;
}

// ---------------------------------------------------------------------------
// Reachability assertion + repair.
// ---------------------------------------------------------------------------

/** Result of a reachability check: ok plus a human-readable reason if not. */
interface Reachability {
	ok: boolean;
	reason: string;
}

/**
 * Pure check that a level is solvable under the physics budget. Verifies:
 *  - every pit gap is within the single-jump width budget,
 *  - every rescue platform is reachable (within the double-jump cap, or has a
 *    trampoline placed on reachable ground that reaches it within its cap),
 *  - the exit sits on solid ground reachable by the ground run.
 *
 * Returns ok=true with reason "" when solvable; otherwise ok=false with the
 * first failure described.
 */
export function checkReachability(level: Level): Reachability {
	const segs = groundSegsOf(level);
	const maxGap = maxGapWidth(level.moveSpeed);

	// 1. Every pit gap between consecutive ground segments must be jumpable.
	const sorted = [...segs].sort((a, b) => a.x - b.x);
	for (let i = 1; i < sorted.length; i++) {
		const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].w);
		if (gap > maxGap + 0.5) {
			return {
				ok: false,
				reason: `pit gap ${gap.toFixed(0)}px exceeds single-jump budget ${maxGap.toFixed(0)}px`,
			};
		}
	}

	// 2. Every rescue platform must be reachable.
	for (const cat of level.caticorns) {
		const plat = level.platforms.find(
			(p) =>
				p.y === cat.y && cat.x >= p.x && cat.x <= p.x + p.w && p.h <= RESCUE_H,
		);
		const top = plat ? plat.y : cat.y;
		const height = GROUND_Y - top; // drop above ground take-off
		if (height <= DOUBLE_JUMP_CAP) continue; // double jump suffices

		if (height > TRAMPOLINE_CAP) {
			return {
				ok: false,
				reason: `platform at x=${cat.x.toFixed(0)} height ${height.toFixed(0)}px exceeds trampoline cap ${TRAMPOLINE_CAP}px`,
			};
		}

		// Otherwise a trampoline must exist on solid ground close enough that its
		// bounce drifts onto this platform: within the platform footprint plus a
		// single-jump horizontal reach on either side.
		const reach = singleJumpReach(level.moveSpeed);
		const left = (plat ? plat.x : cat.x) - reach;
		const right = (plat ? plat.x + plat.w : cat.x) + reach;
		const tramp = level.trampolines.find(
			(t) => onSolidGround(t.x, segs) && t.x >= left && t.x <= right,
		);
		if (!tramp) {
			return {
				ok: false,
				reason: `platform at x=${cat.x.toFixed(0)} height ${height.toFixed(0)}px needs a nearby trampoline but none is reachable`,
			};
		}
	}

	// 3. Exit must sit on solid ground.
	if (!onSolidGround(level.exit.x, segs)) {
		return { ok: false, reason: `exit at x=${level.exit.x} is over a pit` };
	}

	return { ok: true, reason: "" };
}

/**
 * Assert reachability and deterministically repair any failure in place:
 * widen ground under wide gaps, lower over-tall platforms, or add a trampoline.
 * Throws only if the layout is still unsolvable after repair (should never
 * happen for generated levels).
 */
function ensureSolvable(level: Level): Level {
	for (let attempt = 0; attempt < 8; attempt++) {
		const r = checkReachability(level);
		if (r.ok) return level;
		repairOnce(level, r.reason);
	}
	const final = checkReachability(level);
	if (!final.ok) {
		throw new Error(`Unsolvable level "${level.name}": ${final.reason}`);
	}
	return level;
}

/** Apply one deterministic repair pass based on the reported failure reason. */
function repairOnce(level: Level, reason: string): void {
	if (reason.startsWith("pit gap")) {
		// Narrow every gap by shifting ground spans to close it to the budget.
		narrowGaps(level);
		return;
	}
	if (reason.startsWith("platform")) {
		// Lower any over-cap platform onto the double-jump cap; if it was meant to
		// be trampoline-reached, ensure a trampoline exists below it.
		repairPlatforms(level);
		return;
	}
	if (reason.startsWith("exit")) {
		extendGroundToExit(level);
		return;
	}
}

/** Close every pit to the single-jump budget by growing the preceding floor. */
function narrowGaps(level: Level): void {
	const maxGap = maxGapWidth(level.moveSpeed);
	const floors = level.platforms
		.filter((p) => p.y === GROUND_Y)
		.sort((a, b) => a.x - b.x);
	for (let i = 1; i < floors.length; i++) {
		const prev = floors[i - 1];
		const cur = floors[i];
		const gap = cur.x - (prev.x + prev.w);
		if (gap > maxGap) {
			const grow = gap - maxGap;
			prev.w += grow; // extend the previous floor to shrink the pit
		}
	}
}

/** Lower over-cap rescue platforms and guarantee a trampoline where needed. */
function repairPlatforms(level: Level): void {
	const segs = groundSegsOf(level);
	for (const cat of level.caticorns) {
		const plat = level.platforms.find(
			(p) =>
				p.y === cat.y && cat.x >= p.x && cat.x <= p.x + p.w && p.h <= RESCUE_H,
		);
		if (!plat) continue;
		const height = GROUND_Y - plat.y;
		if (height <= DOUBLE_JUMP_CAP) continue;

		// A nearby trampoline (within a single-jump reach of the footprint).
		const reach = singleJumpReach(level.moveSpeed);
		const hasTramp =
			height <= TRAMPOLINE_CAP &&
			level.trampolines.some(
				(t) =>
					onSolidGround(t.x, segs) &&
					t.x >= plat.x - reach &&
					t.x <= plat.x + plat.w + reach,
			);
		if (hasTramp) continue;

		// Prefer adding a trampoline if the platform fits the trampoline cap and
		// there is ground to stand it on; otherwise lower the platform.
		const tx = trampolineGroundX(plat, segs);
		if (height <= TRAMPOLINE_CAP && tx !== null) {
			level.trampolines.push({ x: tx, y: GROUND_Y });
		} else {
			const newTop = GROUND_Y - DOUBLE_JUMP_CAP;
			plat.y = newTop;
			cat.y = newTop;
		}
	}
}

/** Ensure the exit x sits on solid ground by extending the last floor span. */
function extendGroundToExit(level: Level): void {
	const floors = level.platforms
		.filter((p) => p.y === GROUND_Y)
		.sort((a, b) => a.x - b.x);
	const last = floors[floors.length - 1];
	if (!last) {
		level.platforms.push({
			x: level.exit.x - 80,
			y: GROUND_Y,
			w: 160,
			h: GROUND_H,
		});
		return;
	}
	const end = last.x + last.w;
	if (level.exit.x > end - GROUND_EDGE) {
		last.w = level.exit.x + GROUND_EDGE - last.x;
	}
}

/** Recover ground segments (the floor spans) from a level's platforms. */
function groundSegsOf(level: Level): GroundSeg[] {
	return level.platforms
		.filter((p) => p.y === GROUND_Y)
		.map((p) => ({ x: p.x, w: p.w }));
}
