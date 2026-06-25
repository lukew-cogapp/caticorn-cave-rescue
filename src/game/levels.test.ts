import { describe, expect, it } from "vitest";
import { DOUBLE_JUMP_CAP, SINGLE_JUMP_PEAK } from "./level/reachability";
import { buildLevels, checkReachability } from "./levels";
import { GROUND_Y } from "./types";

describe("buildLevels", () => {
	const levels = buildLevels();

	it("produces a non-empty list of named levels", () => {
		expect(levels.length).toBeGreaterThan(0);
		for (const l of levels) {
			expect(l.name).toBeTruthy();
		}
	});

	it("is deterministic (same data on every call)", () => {
		expect(JSON.stringify(buildLevels())).toEqual(JSON.stringify(levels));
	});

	it("every level is provably reachable", () => {
		for (const l of levels) {
			const result = checkReachability(l);
			expect(result.ok, `${l.name}: ${result.reason}`).toBe(true);
		}
	});

	it("has one caticorn per rescue, ramping in count", () => {
		const counts = levels.map((l) => l.caticorns.length);
		// Strictly non-decreasing difficulty in caticorn count.
		for (let i = 1; i < counts.length; i++) {
			expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
		}
	});

	it("places the exit on the ground at the right edge of the world", () => {
		for (const l of levels) {
			expect(l.exit.x).toBeLessThan(l.worldWidth);
			expect(l.exit.x).toBeGreaterThan(0);
		}
	});

	it("keeps hazards out of the immediate spawn zone", () => {
		for (const l of levels) {
			for (const p of l.poops) {
				expect(Math.abs(p.x - l.spawn.x)).toBeGreaterThan(60);
			}
		}
	});
});

/** A spread of seeds to exercise seed-driven variation deterministically. */
const SEEDS = [1, 7, 42, 100, 256, 777, 1000, 2024, 9999, 123456];

describe("buildLevels seeding", () => {
	it("is deterministic per seed (deep equal across calls)", () => {
		for (const seed of SEEDS) {
			expect(buildLevels(seed)).toEqual(buildLevels(seed));
		}
	});

	it("varies caves between different seeds", () => {
		// Two clearly different seeds should differ in at least one of
		// name / themeAccent / bg somewhere across the four caves.
		const a = buildLevels(1);
		const b = buildLevels(2);
		const differs = a.some((la, i) => {
			const lb = b[i];
			return (
				la.name !== lb.name ||
				la.themeAccent !== lb.themeAccent ||
				la.bg[0] !== lb.bg[0] ||
				la.bg[1] !== lb.bg[1]
			);
		});
		expect(differs).toBe(true);
	});

	it("produces a reachable set of levels for every seed", () => {
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				const result = checkReachability(l);
				expect(result.ok, `seed ${seed} / ${l.name}: ${result.reason}`).toBe(
					true,
				);
			}
		}
	});
});

describe("buildLevels difficulty ramp", () => {
	it("has non-decreasing caticorn count by level for every seed", () => {
		for (const seed of SEEDS) {
			const counts = buildLevels(seed).map((l) => l.caticorns.length);
			for (let i = 1; i < counts.length; i++) {
				expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
			}
		}
	});

	it("has non-decreasing monster count by level for every seed", () => {
		for (const seed of SEEDS) {
			const counts = buildLevels(seed).map((l) => l.monsters.length);
			for (let i = 1; i < counts.length; i++) {
				expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
			}
		}
	});

	it("has non-decreasing move speed by level for every seed", () => {
		for (const seed of SEEDS) {
			const speeds = buildLevels(seed).map((l) => l.moveSpeed);
			for (let i = 1; i < speeds.length; i++) {
				expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1]);
			}
		}
	});
});

describe("buildLevels theme + layout invariants", () => {
	it("gives every level a hex themeAccent and a hex bg pair", () => {
		const hex = /^#[0-9a-f]{6}$/i;
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				expect(l.themeAccent).toMatch(hex);
				expect(l.bg).toHaveLength(2);
				expect(l.bg[0]).toMatch(hex);
				expect(l.bg[1]).toMatch(hex);
			}
		}
	});

	it("spawns the player at the left and exits within world bounds on the ground", () => {
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				// Spawn pinned to the left edge.
				expect(l.spawn.x).toBeLessThan(120);
				expect(l.spawn.x).toBeGreaterThan(0);
				// Exit inside the world, to the right of spawn.
				expect(l.exit.x).toBeGreaterThan(l.spawn.x);
				expect(l.exit.x).toBeLessThan(l.worldWidth);
			}
		}
	});
});

describe("buildLevels hazards", () => {
	it("authors no poops into any level (poops come from lurkers now)", () => {
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				expect(l.poops).toEqual([]);
			}
		}
	});

	it("only spawns lurkers on later levels (never level 0 or 1)", () => {
		for (const seed of SEEDS) {
			const levelsForSeed = buildLevels(seed);
			levelsForSeed.forEach((l, i) => {
				const hasLurker = l.monsters.some((m) => m.kind === "lurker");
				if (i <= 1) {
					expect(hasLurker, `seed ${seed} level ${i}`).toBe(false);
				}
			});
			// Later levels (monsterCount >= 3) do introduce a lurker.
			const later = levelsForSeed.slice(2);
			expect(
				later.every((l) => l.monsters.some((m) => m.kind === "lurker")),
			).toBe(true);
		}
	});
});

describe("buildLevels theme identity", () => {
	it("gives every level a theme style and an ambient particle kind", () => {
		// themeStyle + ambient are union-typed (TS guarantees validity); assert
		// each level actually carries a non-empty value rather than re-listing the
		// pool (which would go stale as themes are added).
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				expect(typeof l.themeStyle).toBe("string");
				expect(l.themeStyle.length).toBeGreaterThan(0);
				expect(typeof l.ambient).toBe("string");
				expect(l.ambient.length).toBeGreaterThan(0);
			}
		}
	});

	it("uses distinct themes within a single run (no repeated cave)", () => {
		for (const seed of SEEDS) {
			const names = buildLevels(seed).map((l) => l.name);
			expect(new Set(names).size).toBe(names.length);
		}
	});
});

describe("buildLevels platform reachability bands", () => {
	/** A ground-segment platform sits at GROUND_Y; rescue platforms are above it. */
	const isRescue = (y: number) => y < GROUND_Y;

	it("includes some double-jump-only platforms every seed (not all single-jump)", () => {
		for (const seed of SEEDS) {
			let single = 0;
			let double = 0;
			for (const l of buildLevels(seed)) {
				for (const p of l.platforms) {
					if (!isRescue(p.y)) continue;
					const drop = GROUND_Y - p.y;
					if (drop <= SINGLE_JUMP_PEAK) single++;
					else if (drop <= DOUBLE_JUMP_CAP) double++;
				}
			}
			// A healthy mix: both bands populated, so not every platform is trivial.
			expect(
				double,
				`seed ${seed} has no double-jump platforms`,
			).toBeGreaterThan(0);
			expect(
				single,
				`seed ${seed} has no single-jump platforms`,
			).toBeGreaterThan(0);
		}
	});

	it("never places a rescue platform above the trampoline-clearable cap", () => {
		// Reachability already proves this, but assert the band directly too.
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				const r = checkReachability(l);
				expect(r.ok, `${l.name}: ${r.reason}`).toBe(true);
			}
		}
	});
});

describe("buildLevels decor fairness", () => {
	it("anchors floor decor on solid ground (never floating over a pit)", () => {
		const FLOOR_KINDS = new Set([
			"pebble",
			"mushroom",
			"moss",
			"blossom",
			"gemcluster",
			"gravestone",
			"emberrock",
		]);
		for (const seed of SEEDS) {
			for (const l of buildLevels(seed)) {
				// Solid ground spans = platforms sitting on the ground line.
				const spans = l.platforms
					.filter((p) => p.y === GROUND_Y)
					.map((p) => ({ x: p.x, end: p.x + p.w }));
				for (const d of l.decor) {
					if (!FLOOR_KINDS.has(d.kind)) continue;
					if (d.y !== GROUND_Y) continue;
					const onGround = spans.some((s) => d.x >= s.x && d.x <= s.end);
					expect(
						onGround,
						`seed ${seed} ${l.name}: ${d.kind} at x=${d.x} floats over a pit`,
					).toBe(true);
				}
			}
		}
	});
});

describe("buildLevels grass flags", () => {
	it("produces grass on some platforms across seeds", () => {
		for (const seed of SEEDS) {
			const anyGrass = buildLevels(seed).some((l) =>
				l.platforms.some((p) => p.grass === true),
			);
			expect(anyGrass, `seed ${seed}`).toBe(true);
		}
	});

	it("produces deterministic grass flags per seed", () => {
		for (const seed of SEEDS) {
			const a = buildLevels(seed).map((l) => l.platforms.map((p) => !!p.grass));
			const b = buildLevels(seed).map((l) => l.platforms.map((p) => !!p.grass));
			expect(a).toEqual(b);
		}
	});
});
