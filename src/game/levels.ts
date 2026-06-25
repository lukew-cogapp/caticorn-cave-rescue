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

interface LevelConfig {
	name: string;
	/** Number of rescue platforms (caticorns) to place. */
	count: number;
	/** Player horizontal move speed, px/sec. */
	speed: number;
	monsterCount: number;
	bg: [string, string];
	/** Layout style: how rescue platforms are arranged. */
	style: "steps" | "zigzag" | "towers" | "gauntlet";
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
 */
export function buildLevels(): Level[] {
	const configs: LevelConfig[] = [
		{
			name: "The Shallows",
			count: 2,
			speed: 220,
			monsterCount: 1,
			bg: ["#2a1a3e", "#1a1124"],
			style: "steps",
		},
		{
			name: "Crystal Hollow",
			count: 3,
			speed: 250,
			monsterCount: 2,
			bg: ["#13314a", "#0c1a2e"],
			style: "zigzag",
		},
		{
			name: "Bat Roost",
			count: 4,
			speed: 285,
			monsterCount: 3,
			bg: ["#3a1430", "#1d0a1a"],
			style: "towers",
		},
		{
			name: "Dragon's Maw",
			count: 5,
			speed: 320,
			monsterCount: 4,
			bg: ["#451a12", "#220a08"],
			style: "gauntlet",
		},
	];

	return configs.map((c, i) => makeLevel(c, i));
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
function makeLevel(c: LevelConfig, index: number): Level {
	const rng = makeRng(1000 + index * 97);

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
		const plat: Platform = { x: px, y: py, w: RESCUE_W, h: RESCUE_H };
		platforms.push(plat);
		caticorns.push({ x: px + RESCUE_W / 2, y: py });
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
		platforms.push({ x: s.x, y: GROUND_Y, w: s.w, h: GROUND_H });
	}

	const trampolines: TrampolineSpec[] = [];

	// Place a trampoline on reachable ground before each platform that needs one.
	for (const r of rescues) {
		if (!r.needsTrampoline) continue;
		const tx = trampolineGroundX(r.plat, groundSegs);
		if (tx !== null) trampolines.push({ x: tx, y: GROUND_Y });
	}

	const monsters = placeMonsters(c, worldWidth, groundSegs, rng);
	const poops = placePoops(c, worldWidth, groundSegs, trampolines, rng);
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
 * Scatter poops on solid ground only: never on the spawn tile or within ~120px
 * of spawn, never over a pit, and never stacked on a trampoline.
 */
function placePoops(
	c: LevelConfig,
	worldWidth: number,
	segs: GroundSeg[],
	trampolines: TrampolineSpec[],
	rng: () => number,
): PoopSpec[] {
	const poops: PoopSpec[] = [];
	const poopCount = 2 + c.count;
	const spawnClear = 120;
	const trampClear = 40;

	for (let i = 0; i < poopCount; i++) {
		const jitter = (rng() - 0.5) * 40;
		const x = 180 + (i + 1) * (worldWidth / (poopCount + 1)) + jitter;
		if (x < spawnClear) continue;
		if (!onSolidGround(x, segs)) continue;
		if (trampolines.some((t) => Math.abs(t.x - x) < trampClear)) continue;
		poops.push({ x, y: GROUND_Y });
	}
	return poops;
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

	// --- Ceiling pass: stalactites (lethal) + rare crystal accents. ---
	for (let x = 60; x < worldWidth - 40; x += 120) {
		const dx = x + rng() * 40;
		// Crystals are now a small subtle gem: emit one only occasionally.
		if (rng() < 0.12) {
			decor.push({ x: dx, y: 0, kind: "crystal", size: 10 + rng() * 8 });
			continue;
		}
		if (inCeilingNoGo(dx)) continue; // never hang a spike over a forced jump arc
		decor.push({ x: dx, y: 0, kind: "stalactite", size: 14 + rng() * 22 });
	}

	// --- Floor pass: pebble / mushroom / moss on solid ground only, sparse. ---
	const floorKinds: Decor["kind"][] = ["pebble", "mushroom", "moss"];
	for (let x = 80; x < worldWidth - 40; x += 110 + rng() * 30) {
		// Sparse: skip ~45% of candidate spots so ground stays uncluttered.
		if (rng() > 0.55) continue;
		const dx = x + rng() * 24;
		if (!onSolidGround(dx, segs)) continue; // never float over a pit
		const kind = floorKinds[Math.floor(rng() * floorKinds.length)];
		decor.push({ x: dx, y: GROUND_Y, kind, size: 8 + rng() * 12 });
	}

	// --- Wall pass: faint background cracks at varying heights. ---
	for (let x = 140; x < worldWidth - 60; x += 190 + rng() * 60) {
		const dx = x + rng() * 40;
		const y = 40 + rng() * (GROUND_Y - 80 - 40); // ~40 .. GROUND_Y-80
		decor.push({ x: dx, y, kind: "crack", size: 16 + rng() * 20 });
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
