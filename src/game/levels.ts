import { makeRng } from "./level/prng";
import {
	DOUBLE_JUMP_CAP,
	ensureSolvable,
	GROUND_EDGE,
	GROUND_H,
	type GroundSeg,
	maxGapWidth,
	onSolidGround,
	PLAYER_HALF,
	RESCUE_H,
	RESCUE_W,
	SINGLE_JUMP_PEAK,
	STEP_H,
	STEP_W,
	segAt,
	TRAMPOLINE_CAP,
	trampolineGroundX,
} from "./level/reachability";
import { type LayoutStyle, pickStyles, pickThemes } from "./level/themes";
import {
	type CaticornSpec,
	type Decor,
	type FluteSpec,
	GAME_WIDTH,
	GROUND_Y,
	type Level,
	type MonsterSpec,
	type Platform,
	type PoopSpec,
	type TrampolineSpec,
} from "./types";

// Re-export checkReachability so existing imports from "./levels" keep working.
export { checkReachability } from "./level/reachability";

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
