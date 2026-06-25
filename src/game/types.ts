import type { Container } from "pixi.js";
import type { AmbientKind, ThemeStyle } from "./level/themes";

/** Fixed internal render resolution; world logic uses these coords. */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;
export const GROUND_Y = GAME_HEIGHT - 30;

/** Tuning constants shared across entities. */
export const GRAVITY = 1200; // px/sec^2 (gentle, slightly floaty fall)
export const JUMP_VELOCITY = -560; // px/sec
/** Upward launch velocity when bouncing off a trampoline (much higher jump). */
export const TRAMPOLINE_VELOCITY = -960; // px/sec
export const START_LIVES = 3;
export const PLAYER_W = 34;
export const PLAYER_H = 38;

/** Simple 2D vector. */
export interface Vec2 {
	x: number;
	y: number;
}

/** Axis-aligned bounding box in world coords. */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** A solid platform the player can stand on. */
export interface Platform extends Rect {
	/** When true, the platform's top is drawn with grassy blades for variety. */
	grass?: boolean;
}

/** Per-entity spawn data from a level (bottom-centre positions). */
export interface CaticornSpec extends Vec2 {
	/**
	 * How the caticorn is held. "shackle" frees on contact; "cage" must be
	 * stomped (landed on from above) to break open.
	 */
	containment: "shackle" | "cage";
}

export interface MonsterSpec extends Vec2 {
	/** Half-width of the patrol path in pixels. */
	range: number;
	/** Patrol speed, pixels/sec. */
	speed: number;
	/**
	 * "crawler" walks a platform; "bat" floats and bobs vertically; "lurker"
	 * clings to the ceiling, drifts slowly toward the player, and drops poop.
	 */
	kind: "crawler" | "bat" | "lurker";
}

/** A decorative cave element, purely visual. Floor/wall kinds sit on ground or
 * cling to walls; ceiling kinds hang. The later kinds are theme-signature decor
 * (e.g. blossom branches, icicles, gem clusters) used by the bespoke caves. */
export type DecorKind =
	| "stalactite"
	| "stalagmite"
	| "crystal"
	| "pebble"
	| "mushroom"
	| "moss"
	| "crack"
	| "blossom"
	| "gemcluster"
	| "icicle"
	| "gravestone"
	| "web"
	| "emberrock";

/** Decorative cave element, purely visual. */
export interface Decor extends Vec2 {
	kind: DecorKind;
	size: number;
}

/** A poop hazard sitting on a platform; walking over it slows the player. */
export interface PoopSpec extends Vec2 {}

/** A trampoline; landing on it while falling launches the player high. */
export interface TrampolineSpec extends Vec2 {}

/** A flute pickup; collecting it grants an extra life. */
export interface FluteSpec extends Vec2 {}

/** One playable level definition. */
export interface Level {
	name: string;
	worldWidth: number;
	platforms: Platform[];
	caticorns: CaticornSpec[];
	monsters: MonsterSpec[];
	poops: PoopSpec[];
	trampolines: TrampolineSpec[];
	flutes: FluteSpec[];
	decor: Decor[];
	/** Two-stop background gradient (top, bottom) for cave mood. */
	bg: [string, string];
	/**
	 * Theme accent colour (`#rrggbb`) for this cave. Monsters and decor are
	 * recoloured toward this so each level reads as one mood. Derived from the
	 * run seed by {@link buildLevels}.
	 */
	themeAccent: string;
	/**
	 * Ambient drifting particle for this cave (petal/snow/ember/etc.), spawned by
	 * the scene and animated each frame. Derived from the theme by
	 * {@link buildLevels}; gives each cave a signature atmospheric mood.
	 */
	ambient: AmbientKind;
	/**
	 * Theme visual identity (blossom/crystal/ice/crypt/grove/molten). Draw helpers
	 * branch on this for themed background silhouettes, floor/platform texture,
	 * monster flavour and ambient lighting. From the theme via {@link buildLevels}.
	 */
	themeStyle: ThemeStyle;
	/** Player horizontal move speed, pixels/sec. */
	moveSpeed: number;
	spawn: Vec2;
	exit: Vec2;
}

/** Run status surfaced to the host page HUD. */
export type GameStatus = "playing" | "won" | "lost";

export interface HudState {
	level: number;
	levelName: string;
	totalLevels: number;
	rescued: number;
	toRescue: number;
	/** Player health, 0..1. */
	health: number;
	status: GameStatus;
	/** Total caticorns rescued across the whole run (for the end summary). */
	totalRescued: number;
	/** Elapsed run time in seconds (for the end summary). */
	elapsed: number;
	/** Run score (rescues + stomps + flutes), shown live in the DOM HUD bar. */
	score: number;
}

export type HudCallback = (state: HudState) => void;

/** Public handle returned to the host page. */
export interface GameHandle {
	destroy(): void;
	restart(): void;
	/** Resize the renderer to the given CSS pixel size (used for fullscreen). */
	resize(width: number, height: number): void;
}

/**
 * AABB overlap test. Each entity exposes an aabb() in world coords; the Game
 * loop uses this for rescue/monster collisions.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
	return (
		a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
	);
}

/** Read-only view of the world an entity needs to update itself. */
export interface WorldContext {
	level: Level;
	/** Held input keys (lowercased / arrow names). */
	keys: Set<string>;
	/** Seconds since last frame, clamped. */
	dt: number;
	/** Player reference for monster targeting / proximity. */
	player: { aabb(): Rect; pos: Vec2 };
}

/** Anything that lives in the world, owns a display object, and updates per frame. */
export interface GameObject {
	/** Pixi display object added to the world container. */
	readonly view: Container;
	/** Bottom-centre world position. */
	pos: Vec2;
	/** Advance simulation by ctx.dt seconds. */
	update(ctx: WorldContext): void;
	/** Collision box in world coords. */
	aabb(): Rect;
}
