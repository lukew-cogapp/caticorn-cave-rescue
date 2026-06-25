import { describe, expect, it } from "vitest";
import { makeRng } from "./prng";
import {
	type AmbientKind,
	pickThemes,
	THEMES,
	type ThemeStyle,
} from "./themes";

/** Every ThemeStyle / AmbientKind that should be representable. */
const STYLES: ThemeStyle[] = [
	"blossom",
	"crystal",
	"ice",
	"crypt",
	"grove",
	"molten",
];
const AMBIENTS: AmbientKind[] = [
	"petal",
	"gemsparkle",
	"snow",
	"fog",
	"spore",
	"ember",
];

const hex = /^#[0-9a-f]{6}$/i;
const SEEDS = [1, 7, 42, 100, 256, 777, 1000, 2024, 9999, 123456];

describe("THEMES pool", () => {
	it("has at least 6 themes", () => {
		expect(THEMES.length).toBeGreaterThanOrEqual(6);
	});

	it("gives every theme a name, hex palette, decor kinds, ambient and style", () => {
		for (const t of THEMES) {
			expect(t.name).toBeTruthy();
			expect(t.accent).toMatch(hex);
			expect(t.bg).toHaveLength(2);
			expect(t.bg[0]).toMatch(hex);
			expect(t.bg[1]).toMatch(hex);
			expect(t.ceilingKinds.length).toBeGreaterThan(0);
			expect(t.floorKinds.length).toBeGreaterThan(0);
			expect(AMBIENTS).toContain(t.ambient);
			expect(STYLES).toContain(t.style);
		}
	});

	it("uses a unique name per theme", () => {
		const names = THEMES.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
	});
});

describe("pickThemes", () => {
	it("returns the requested count", () => {
		for (const seed of SEEDS) {
			const picked = pickThemes(makeRng(seed), 6);
			expect(picked).toHaveLength(6);
		}
	});

	it("is deterministic for a given seed", () => {
		for (const seed of SEEDS) {
			const a = pickThemes(makeRng(seed), 6).map((t) => t.name);
			const b = pickThemes(makeRng(seed), 6).map((t) => t.name);
			expect(a).toEqual(b);
		}
	});

	it("never repeats a theme back-to-back", () => {
		for (const seed of SEEDS) {
			const picked = pickThemes(makeRng(seed), 6);
			for (let i = 1; i < picked.length; i++) {
				expect(picked[i].name).not.toBe(picked[i - 1].name);
			}
		}
	});

	it("picks distinct themes when count <= pool size (a shuffle, not all every run)", () => {
		const n = Math.min(6, THEMES.length);
		for (const seed of SEEDS) {
			const names = pickThemes(makeRng(seed), n).map((t) => t.name);
			expect(new Set(names).size).toBe(n);
		}
	});

	it("varies theme order across seeds", () => {
		const orders = SEEDS.map((s) =>
			pickThemes(makeRng(s), 6)
				.map((t) => t.name)
				.join("|"),
		);
		// At least two distinct orderings across the seed spread.
		expect(new Set(orders).size).toBeGreaterThan(1);
	});
});
