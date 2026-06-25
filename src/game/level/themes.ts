/**
 * A cave theme: a readable mood palette. `bg` is the background gradient (top,
 * bottom); `accent` recolours monsters + decor toward the mood. All backgrounds
 * are kept dark enough that the bright caticorns pop.
 */
export interface CaveTheme {
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
export const THEMES: CaveTheme[] = [
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
 * Pick `n` cave themes from {@link THEMES} using the run PRNG, avoiding an
 * immediate repeat so consecutive caves always look distinct. Deterministic for
 * a given seed; different seeds give different themes and order.
 */
export function pickThemes(rng: () => number, n: number): CaveTheme[] {
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
