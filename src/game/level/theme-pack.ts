import type { Container, Graphics } from "pixi.js";
import { tint, wobble } from "../art/util";
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
 * **Every draw hook is optional.** A new theme only implements the hooks that
 * give it identity; any hook left out falls back to a generic default in the
 * dispatcher (see each hook's doc for its omit-default). The six built-in themes
 * implement all hooks, so they are unaffected by the optionality. Only the
 * metadata + `lighting` (and optionally `mechanic`) are required.
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
	 *
	 * Optional. Omitted → no extra far shapes (the generic far rock row already
	 * drew); the dispatcher consumes no RNG for this pass.
	 */
	farSilhouettes?(
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
	 *
	 * Optional. Omitted → behaves as if it returned `true` (the shared distant
	 * stalagmite row still draws and no extra ceiling art is added); the
	 * dispatcher consumes no RNG for this pass.
	 */
	midDetails?(
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
	 *
	 * Optional. Omitted → no extra near shapes (the generic near rock row already
	 * drew); the dispatcher consumes no RNG for this pass.
	 */
	nearSilhouettes?(
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
	 *
	 * Optional. Omitted → {@link defaultPlatformTones} (neutral accent-blended
	 * rock palette).
	 */
	platformTones?(accent: string | undefined): PlatformTones;

	/**
	 * Draw the theme's per-platform surface flourish (ice gloss, ember seam,
	 * crystal vein, flagstone joint, rock crack) on top of the generic body.
	 * `crackCol` is the theme crack tone from {@link platformTones}.
	 *
	 * Optional. Omitted → the generic hairline rock crack (see
	 * {@link drawDefaultPlatformSkin}).
	 */
	platformSkin?(
		g: Graphics,
		width: number,
		height: number,
		crackCol: number,
	): void;

	/**
	 * Body, rim and mottle base tones for the floor strip, blended toward accent.
	 *
	 * Optional. Omitted → {@link defaultFloorTones} (neutral accent-blended rock
	 * palette).
	 */
	floorTones?(accent: string | undefined): FloorTones;

	/**
	 * Draw the theme's per-span floor surface detail just below the rim (grass +
	 * petals, crystal glints, ice cracks, flagstones, moss + shrooms, lava seams).
	 *
	 * Optional. Omitted → the generic sparse moss-tuft fringe (see
	 * {@link drawDefaultFloorSurface}).
	 */
	floorSurface?(
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
	 *
	 * Optional. Omitted → no flourish (just the base accent-tinted monster).
	 */
	monsterFlourish?(
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

/**
 * Generic accent-blended rock platform tones used when a {@link ThemePack}
 * omits {@link ThemePack.platformTones}. A neutral purple-grey rock palette
 * (body in the `#4a3a63` family) blended toward `accent` via the same {@link tint}
 * helper the packs use, so a hook-light theme still picks up its level mood.
 *
 * @param accent - Optional theme accent `#rrggbb` to blend the rock toward.
 * @returns Neutral rock {@link PlatformTones}.
 */
export function defaultPlatformTones(
	accent: string | undefined,
): PlatformTones {
	return {
		bodyCol: tint("#4a3a63", accent, 0.35),
		rimCol: tint("#6e5e88", accent, 0.35),
		shadowCol: tint("#2a2238", accent, 0.4),
		sideShade: tint("#352a4c", accent, 0.4),
		mottleCol: tint("#5a4a74", accent, 0.35),
		crackCol: tint("#2e2445", accent, 0.4),
	};
}

/**
 * Generic accent-blended floor-strip tones used when a {@link ThemePack} omits
 * {@link ThemePack.floorTones}. Neutral rock body (top/bottom), lit rim, two
 * mottle tones and a near-black pit edge, matching the baseline floor look and
 * blended toward `accent` via {@link tint}.
 *
 * @param accent - Optional theme accent `#rrggbb` to blend the floor toward.
 * @returns Neutral rock {@link FloorTones}.
 */
export function defaultFloorTones(accent: string | undefined): FloorTones {
	return {
		bodyTop: tint("#4a4060", accent, 0.4),
		bodyBot: tint("#2a1e38", accent, 0.4),
		rimCol: tint("#7a6e95", accent, 0.35),
		mottle1: tint("#3e3558", accent, 0.4),
		mottle2: tint("#56486e", accent, 0.35),
		edgeDark: tint("#0d0716", accent, 0.15),
	};
}

/**
 * Draw the generic hairline rock crack on a platform body, used when a
 * {@link ThemePack} omits {@link ThemePack.platformSkin}. A faint two-segment
 * fracture with a thin offshoot, keyed off `width`/`height` via {@link wobble}
 * so it stays deterministic. Mirrors the plain rock crack the mossy-stone packs
 * use as their own "still stone" skin.
 *
 * @param g - Graphics drawn in platform-local space (top-left origin).
 * @param width - Platform width in px.
 * @param height - Platform height in px.
 * @param crackCol - Crack tone from {@link PlatformTones.crackCol}.
 */
export function drawDefaultPlatformSkin(
	g: Graphics,
	width: number,
	height: number,
	crackCol: number,
): void {
	if (height >= 10) {
		const crackX = width * 0.55 + wobble(width + height, 43, width * 0.2);
		const jx = wobble(width, 47, 3);
		const crackLen = Math.min(height - 4, 10);
		const cw = Math.max(0.6, height * 0.06);
		g.moveTo(crackX, 3)
			.lineTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
			.lineTo(crackX + jx, 3 + crackLen)
			.stroke({ color: crackCol, width: cw, alpha: 0.3 });
		g.moveTo(crackX + jx * 0.5, 3 + crackLen * 0.45)
			.lineTo(crackX + jx * 0.5 + wobble(width, 53, 3), 3 + crackLen * 0.7)
			.stroke({ color: crackCol, width: cw * 0.6, alpha: 0.22 });
	}
}

/**
 * Draw the generic sparse moss-tuft fringe along a floor span, used when a
 * {@link ThemePack} omits {@link ThemePack.floorSurface}. A sparse row of two-tone
 * green tufts just below the rim, keyed off absolute `x` via {@link wobble} so it
 * stays deterministic. This is the baseline floor surface (the grass fringe the
 * mossy packs share, minus theme-specific extras).
 *
 * @param g - Graphics drawn in world space.
 * @param sx - Span start x in world px.
 * @param ex - Span end x in world px.
 * @param surfaceY - Walkable surface y in world px.
 * @param accent - Optional theme accent `#rrggbb` to blend the moss toward.
 */
export function drawDefaultFloorSurface(
	g: Graphics,
	sx: number,
	ex: number,
	surfaceY: number,
	accent: string | undefined,
): void {
	const mossCol = tint("#3a5c34", accent, 0.25);
	const mossLit = tint("#4e7a46", accent, 0.25);
	const mossSpacing = 64;
	for (let x = sx + 8; x < ex - 8; x += mossSpacing) {
		const mx = x + wobble(x, 23, mossSpacing * 0.35);
		const mh = 4 + Math.abs(wobble(x, 29, 2));
		g.poly([
			mx - 4,
			surfaceY + 3,
			mx + 4,
			surfaceY + 3,
			mx,
			surfaceY + 3 - mh,
		]).fill({
			color: mossCol,
			alpha: 0.7,
		});
		g.poly([
			mx + 2,
			surfaceY + 3,
			mx + 8,
			surfaceY + 3,
			mx + 5,
			surfaceY + 3 - mh * 0.7,
		]).fill({ color: mossLit, alpha: 0.55 });
	}
}
