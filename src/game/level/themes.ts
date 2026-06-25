import type { DecorKind } from "../types";
import type { ThemePack } from "./theme-pack";
import { blossomPack } from "./themes/blossom";
import { cryptPack } from "./themes/crypt";
import { crystalPack } from "./themes/crystal";
import { grovePack } from "./themes/grove";
import { icePack } from "./themes/ice";
import { moltenPack } from "./themes/molten";

/** Theme-specific ambient particle that drifts through the cave for atmosphere. */
export type AmbientKind =
	| "petal"
	| "gemsparkle"
	| "snow"
	| "fog"
	| "spore"
	| "ember";

/**
 * Visual identity discriminant for a cave. Drives theme-specific background
 * silhouettes, floor/platform texture, monster flavour, and ambient lighting
 * (each draw helper looks up the matching {@link ThemePack}), so caves look like
 * distinct places, not recoloured rock. One per bespoke theme.
 */
export type ThemeStyle =
	| "blossom"
	| "crystal"
	| "ice"
	| "crypt"
	| "grove"
	| "molten";

/**
 * A bespoke cave theme's metadata: a strong visual identity, not just a
 * recoloured rock mood. `bg` is the background gradient (top, bottom); `accent`
 * recolours monsters + decor toward the mood; `ceilingKinds` / `floorKinds` are
 * the signature decor this cave scatters (weighted by repetition in the array);
 * `ambient` is the drifting particle that fills the air. All backgrounds are
 * kept dark enough that the bright caticorns pop.
 *
 * This is the metadata slice of a {@link ThemePack} (everything except the draw
 * hooks + lighting/mechanic), surfaced separately so level generation and the
 * theme tests can work with plain data. Each entry of {@link THEMES} is derived
 * from the matching pack, so the two never drift.
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
	/** Visual identity driving themed bg/floor/platform/monster/lighting. */
	style: ThemeStyle;
}

/**
 * The bespoke cave theme registry: the single source of truth for every theme.
 * Each {@link ThemePack} bundles the theme's metadata, ambient lighting, optional
 * gameplay mechanic tweaks, and all of its theme-specific draw hooks, so adding
 * or reskinning a theme is a single file under `level/themes/`.
 *
 * Order is load-bearing: {@link THEMES} and {@link pickThemes}'s shuffle iterate
 * this list, so keep the order stable to keep a given seed's cave set + order
 * stable.
 */
export const THEME_PACKS: ThemePack[] = [
	blossomPack,
	crystalPack,
	icePack,
	cryptPack,
	grovePack,
	moltenPack,
];

/** Fast `ThemeStyle` → {@link ThemePack} lookup for the draw dispatchers. */
const PACK_BY_STYLE: Record<ThemeStyle, ThemePack> = Object.fromEntries(
	THEME_PACKS.map((p) => [p.style, p]),
) as Record<ThemeStyle, ThemePack>;

/** Look up the {@link ThemePack} for a {@link ThemeStyle}. */
export function getThemePack(style: ThemeStyle): ThemePack {
	return PACK_BY_STYLE[style];
}

/**
 * The bespoke cave theme pool (metadata view, derived from {@link THEME_PACKS}).
 * Each cave has a distinct identity (palette + signature decor + ambient
 * particle). A run seed picks (without immediate repeats) from these, so
 * different seeds yield different cave sets and order.
 */
export const THEMES: CaveTheme[] = THEME_PACKS.map((p) => ({
	name: p.name,
	bg: p.bg,
	accent: p.accent,
	ceilingKinds: p.ceilingKinds,
	floorKinds: p.floorKinds,
	ambient: p.ambient,
	style: p.style,
}));

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
