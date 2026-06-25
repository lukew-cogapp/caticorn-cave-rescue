import type { DecorKind } from "../types";

/** Theme-specific ambient particle that drifts through the cave for atmosphere. */
export type AmbientKind =
	| "petal"
	| "gemsparkle"
	| "snow"
	| "fog"
	| "spore"
	| "ember";

/**
 * A bespoke cave theme: a strong visual identity, not just a recoloured rock
 * mood. `bg` is the background gradient (top, bottom); `accent` recolours
 * monsters + decor toward the mood; `ceilingKinds` / `floorKinds` are the
 * signature decor this cave scatters (weighted by repetition in the array);
 * `ambient` is the drifting particle that fills the air. All backgrounds are
 * kept dark enough that the bright caticorns pop.
 */
export interface CaveTheme {
	/** Cave name, used as the level name. */
	name: string;
	/** Background gradient `[top, bottom]` as `#rrggbb`. */
	bg: [string, string];
	/** Scenery accent `#rrggbb` for tinting monsters + decor. */
	accent: string;
	/** Signature ceiling decor kinds (excluding the lethal stalactite, which is
	 * always placed). Repeat a kind to weight it more heavily. */
	ceilingKinds: DecorKind[];
	/** Signature floor decor kinds. Repeat a kind to weight it. */
	floorKinds: DecorKind[];
	/** Ambient particle drifting through this cave. */
	ambient: AmbientKind;
}

/**
 * The bespoke cave theme pool. Each cave has a distinct identity (palette +
 * signature decor + ambient particle). A run seed picks (without immediate
 * repeats) from these, so different seeds yield different cave sets and order.
 */
export const THEMES: CaveTheme[] = [
	{
		name: "Cherry Blossom Hollow",
		bg: ["#3a2030", "#1e1018"],
		accent: "#ff9ec9",
		ceilingKinds: ["blossom", "blossom", "crystal"],
		floorKinds: ["blossom", "moss", "pebble"],
		ambient: "petal",
	},
	{
		name: "Crystal Cavern",
		bg: ["#221a3e", "#100a22"],
		accent: "#9b8bff",
		ceilingKinds: ["gemcluster", "gemcluster", "crystal"],
		floorKinds: ["gemcluster", "crystal", "pebble"],
		ambient: "gemsparkle",
	},
	{
		name: "Glacier Vault",
		bg: ["#16314a", "#0c1b2c"],
		accent: "#9fe0ff",
		ceilingKinds: ["icicle", "icicle", "crystal"],
		floorKinds: ["icicle", "pebble", "pebble"],
		ambient: "snow",
	},
	{
		name: "Spectre Crypt",
		bg: ["#202430", "#0e1016"],
		accent: "#7faf8c",
		ceilingKinds: ["web", "web", "crack"],
		floorKinds: ["gravestone", "gravestone", "pebble"],
		ambient: "fog",
	},
	{
		name: "Mushroom Grove",
		bg: ["#16321f", "#0a1a11"],
		accent: "#5fd07a",
		ceilingKinds: ["crystal", "crack"],
		floorKinds: ["mushroom", "mushroom", "moss"],
		ambient: "spore",
	},
	{
		name: "Molten Hollow",
		bg: ["#3a1410", "#1c0806"],
		accent: "#ff7a3b",
		ceilingKinds: ["emberrock", "crack"],
		floorKinds: ["emberrock", "emberrock", "pebble"],
		ambient: "ember",
	},
];

/** How rescue platforms are arranged across a level. */
export type LayoutStyle = "steps" | "zigzag" | "towers" | "gauntlet";

/** The pool of layout styles a seed can pick from, in difficulty-ish order. */
export const LAYOUT_STYLES: LayoutStyle[] = [
	"steps",
	"zigzag",
	"towers",
	"gauntlet",
];

/**
 * Pick `n` cave themes from {@link THEMES} using the run PRNG. When `n` does not
 * exceed the pool size (the normal case — a run has one cave per theme), this is
 * a seeded shuffle of all themes, so every run visits each theme exactly once in
 * a seed-dependent order with no repeats. If `n` is larger than the pool, the
 * shuffled set is repeated (still avoiding an immediate repeat at the seam).
 * Deterministic for a given seed.
 */
export function pickThemes(rng: () => number, n: number): CaveTheme[] {
	// Fisher-Yates shuffle of a copy (deterministic via the run PRNG).
	const shuffled = THEMES.slice();
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	const out: CaveTheme[] = [];
	for (let i = 0; i < n; i++) {
		const cand = shuffled[i % shuffled.length];
		// Guard the wrap seam (n > pool) against an immediate repeat.
		if (out.length > 0 && out[out.length - 1] === cand && shuffled.length > 1) {
			out.push(shuffled[(i + 1) % shuffled.length]);
		} else {
			out.push(cand);
		}
	}
	return out;
}

/**
 * Pick `n` layout styles from {@link LAYOUT_STYLES} using the run PRNG, avoiding
 * an immediate repeat for layout variety. Deterministic for a given seed.
 */
export function pickStyles(rng: () => number, n: number): LayoutStyle[] {
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
