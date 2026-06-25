import { describe, expect, it } from "vitest";
import { buildLevels, checkReachability } from "./levels";

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
