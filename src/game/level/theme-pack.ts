import type { Container, Graphics } from "pixi.js";
import type { DecorKind } from "../types";
import type { AmbientKind, ThemeStyle } from "./themes";

/**
 * Bounded random helper passed into theme draw hooks: returns a number in
 * `[a, b)`. The scenery builders create this from a fixed-seed PRNG so all
 * theme silhouette variation stays deterministic (no `Math.random`).
 */
export type Rng = (a: number, b: number) => number;

/**
 * Ambient night-overlay tint + intensity for a theme.
 *
 * `color` is the full-screen night overlay fill (a PixiJS `0xRRGGBB` integer);
 * `intensity` is the peak alpha multiplier applied on top of the (1-cos)/2 day/
 * night wave. Higher = darker / eerier at full night. Kept subtle so gameplay
 * stays readable and the caticorns pop.
 */
export interface ThemeLighting {
	/** `0xRRGGBB` fill colour for the night overlay rectangle. */
	color: number;
	/** Peak alpha multiplier on the day/night wave. */
	intensity: number;
}

/**
 * Optional gameplay mechanic tweaks a theme applies. Any field left undefined
 * means "default behaviour" for that aspect — the consuming code treats an
 * absent field as the neutral value (friction scale 1, no ground bounce, no
 * extra spike pass), so themes that want the standard physics omit the field.
 */
export interface ThemeMechanic {
	/**
	 * Friction multiplier applied to player deceleration in this cave. `< 1`
	 * makes the player slide further (ice). Absent = no scaling (1).
	 */
	frictionScale?: number;
	/**
	 * Upward velocity (px/sec, negative = up) given to the player when they land
	 * on the ground floor in this cave (grove springiness). Absent = no bounce.
	 */
	groundBounceVelocity?: number;
	/**
	 * Minimum downward speed (px/sec) required for {@link groundBounceVelocity}
	 * to trigger. Only meaningful when a bounce velocity is set.
	 */
	groundBounceMinSpeed?: number;
	/**
	 * Probability (0..1) of placing an extra ceiling spike at each candidate in
	 * an additional density pass (molten hazard density). Absent = no extra pass.
	 */
	spikeDensity?: number;
}

/**
 * Everything that defines one bespoke cave theme in a single place: its
 * metadata (name, palette, signature decor, ambient particle), its ambient
 * lighting, its optional gameplay mechanic tweaks, and the theme-specific draw
 * hooks for the background silhouettes, floor surface detail, platform body
 * detail and monster flourish.
 *
 * Each draw hook is a pure function taking a Pixi `Graphics`/`Container` plus
 * the parameters the corresponding render pass supplies. The generic scenery
 * scaffolding (gradient bands, rock tones, silhouette rows, floor body, platform
 * body) lives in `art/scenery.ts`; the hooks only paint the per-theme flourish
 * exactly as the old per-style `switch` arms did, so behaviour is identical.
 *
 * Adding or reskinning a theme means writing one file: a `ThemePack` with the
 * desired values + draw code, then registering it.
 */
export interface ThemePack {
	/** Visual identity discriminant (matches {@link Level.themeStyle}). */
	style: ThemeStyle;
	/** Cave name, used as the level name. */
	name: string;
	/** Background gradient `[top, bottom]` as `#rrggbb`. */
	bg: [string, string];
	/** Scenery accent `#rrggbb` for tinting monsters + decor toward the mood. */
	accent: string;
	/** Signature ceiling decor kinds (non-lethal). Repeat to weight a kind. */
	ceilingKinds: DecorKind[];
	/** Signature floor decor kinds. Repeat a kind to weight it. */
	floorKinds: DecorKind[];
	/** Ambient particle drifting through this cave. */
	ambient: AmbientKind;
	/** Night-overlay tint + intensity for this cave. */
	lighting: ThemeLighting;
	/** Optional gameplay mechanic tweaks (friction / bounce / spike density). */
	mechanic?: ThemeMechanic;

	/**
	 * Draw the theme's far-layer backdrop silhouettes (lowest alpha). Called
	 * after the generic far rock row. `wallFar`/`wallMid` are the derived rock
	 * tones; `rng` is the shared deterministic bounded random.
	 */
	farSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		rng: Rng,
	): void;

	/**
	 * Draw the theme's mid-layer details (ceiling shapes etc.), replacing the
	 * generic stalactite row. Return `true` if the shared distant-stalagmite row
	 * should still be drawn afterwards (grove returns `false` to suppress it).
	 */
	midDetails(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallMid: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): boolean;

	/**
	 * Draw the theme's near-layer silhouettes (darkest, largest), called after
	 * the generic near rock row and before the shared columns + vignette.
	 */
	nearSilhouettes(
		g: Graphics,
		worldWidth: number,
		wallFar: number,
		wallNear: number,
		wallLight: number,
		rng: Rng,
	): void;

	/**
	 * Body/rim/shadow/side/mottle/crack tones for a platform of this theme,
	 * blended toward `accent`. Mirrors the old per-style tone selection so the
	 * platform body fills are identical.
	 */
	platformTones(accent: string | undefined): PlatformTones;

	/**
	 * Draw the theme's per-platform surface flourish (ice gloss, ember seam,
	 * crystal vein, flagstone joint, rock crack) on top of the generic body.
	 * `crackCol` is the theme crack tone from {@link platformTones}.
	 */
	platformSkin(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void;

	/** Body, rim and mottle base tones for the floor strip, blended toward accent. */
	floorTones(accent: string | undefined): FloorTones;

	/**
	 * Draw the theme's per-span floor surface detail just below the rim (grass +
	 * petals, crystal glints, ice cracks, flagstones, moss + shrooms, lava seams).
	 */
	floorSurface(
		g: Graphics,
		sx: number,
		ex: number,
		surfaceY: number,
		accent: string | undefined,
	): void;

	/**
	 * Layer the theme's subtle monster flourish on top of an already-built
	 * monster container. `headY` and `hw` are the precomputed head anchor +
	 * half-width for the given creature kind; `isLurker` flags ceiling
	 * orientation. The flourish must never obscure eyes/fangs/silhouette.
	 */
	monsterFlourish(
		c: Container,
		f: Graphics,
		kind: "crawler" | "bat" | "lurker",
		isLurker: boolean,
		headY: number,
		hw: number,
	): void;
}

/** Platform body tones for a theme (all already blended toward the accent). */
export interface PlatformTones {
	bodyCol: number;
	rimCol: number;
	shadowCol: number;
	sideShade: number;
	mottleCol: number;
	crackCol: number;
}

/** Floor-strip body/rim/mottle tones for a theme (blended toward the accent). */
export interface FloorTones {
	bodyTop: number;
	bodyBot: number;
	rimCol: number;
	mottle1: number;
	mottle2: number;
	edgeDark: number;
}
