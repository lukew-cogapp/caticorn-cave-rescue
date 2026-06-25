import {
	GRAVITY,
	GROUND_Y,
	JUMP_VELOCITY,
	type Level,
	type Platform,
	TRAMPOLINE_VELOCITY,
} from "../types";

// ---------------------------------------------------------------------------
// Physics budget (derived from the constants in types.ts and Player.ts).
//
// These drive every reachability decision below. They are computed once from
// the shared constants so the generator stays correct if the constants change.
// ---------------------------------------------------------------------------

/** Airtime of a single jump, seconds: 2 * |v| / g. */
export const SINGLE_JUMP_AIRTIME = (2 * Math.abs(JUMP_VELOCITY)) / GRAVITY; // 0.8s
/** Peak height of a single jump, px: v^2 / (2g). */
export const SINGLE_JUMP_PEAK = JUMP_VELOCITY ** 2 / (2 * GRAVITY); // 112px
/** Peak height of a trampoline bounce, px: v^2 / (2g). */
export const TRAMPOLINE_PEAK = TRAMPOLINE_VELOCITY ** 2 / (2 * GRAVITY); // ~329px

/**
 * Conservative cap on how high above its take-off surface a platform may sit
 * and still be cleared by a double jump. The theoretical double-jump ceiling is
 * ~224px (two jumps, second near apex), but landing the second jump precisely
 * is hard, so we cap well under that.
 */
export const DOUBLE_JUMP_CAP = 180;

/**
 * Conservative cap on how high above its take-off surface a platform may sit and
 * still be reached from a trampoline. The trampoline apex (~329px) less headroom
 * for imperfect timing and horizontal travel.
 */
export const TRAMPOLINE_CAP = Math.floor(TRAMPOLINE_PEAK - 49); // ~280px

/** Fraction of a single jump's horizontal reach used as the max pit width. */
export const GAP_SAFETY = 0.75;

/** Platform/decor geometry shared across the layout. */
export const RESCUE_W = 150;
export const RESCUE_H = 18;
export const STEP_W = 90;
export const STEP_H = 16;
export const GROUND_H = 30;
/** Half-margin used when deciding whether an x sits safely on a ground span. */
export const GROUND_EDGE = 16;
/** Player half-width used by the landing logic in Player.ts (PLAYER_W / 2). */
export const PLAYER_HALF = 17;

/** A solid floor span on the ground line, used to gate hazards/decor. */
export interface GroundSeg {
	x: number;
	w: number;
}

/** Max horizontal distance a single jump covers at the given speed. */
export function singleJumpReach(speed: number): number {
	return SINGLE_JUMP_AIRTIME * speed;
}

/** Max safe pit width for the given speed (clearly clearable in one jump). */
export function maxGapWidth(speed: number): number {
	return singleJumpReach(speed) * GAP_SAFETY;
}

/** Whether an x sits safely (with margin) on some ground segment. */
export function onSolidGround(x: number, segs: GroundSeg[]): boolean {
	return segs.some(
		(s) => x >= s.x + GROUND_EDGE && x <= s.x + s.w - GROUND_EDGE,
	);
}

/** Find the ground segment containing x, or null over a pit. */
export function segAt(x: number, segs: GroundSeg[]): GroundSeg | null {
	for (const s of segs) {
		if (x >= s.x && x <= s.x + s.w) return s;
	}
	return null;
}

/** Recover ground segments (the floor spans) from a level's platforms. */
export function groundSegsOf(level: Level): GroundSeg[] {
	return level.platforms
		.filter((p) => p.y === GROUND_Y)
		.map((p) => ({ x: p.x, w: p.w }));
}

/**
 * Pick a solid-ground x in front of (or below) a platform on which to stand a
 * trampoline so its bounce reaches the platform top. Prefers the ground segment
 * directly under the platform; falls back to the nearest segment before it.
 */
export function trampolineGroundX(
	plat: Platform,
	segs: GroundSeg[],
): number | null {
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
export function ensureSolvable(level: Level): Level {
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
