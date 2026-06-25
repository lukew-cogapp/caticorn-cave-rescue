import type { Container } from "pixi.js";

/** Fixed internal render resolution; world logic uses these coords. */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;
export const GROUND_Y = GAME_HEIGHT - 30;

/** Tuning constants shared across entities. */
export const GRAVITY = 1400; // px/sec^2
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
export interface Platform extends Rect {}

/** Per-entity spawn data from a level (bottom-centre positions). */
export interface CaticornSpec extends Vec2 {}

export interface MonsterSpec extends Vec2 {
	/** Half-width of the patrol path in pixels. */
	range: number;
	/** Patrol speed, pixels/sec. */
	speed: number;
	/** "crawler" walks a platform; "bat" floats and bobs vertically. */
	kind: "crawler" | "bat";
}

/** Decorative cave element, purely visual. */
export interface Decor extends Vec2 {
	kind: "stalactite" | "stalagmite" | "crystal";
	size: number;
}

/** A poop hazard sitting on a platform; walking over it slows the player. */
export interface PoopSpec extends Vec2 {}

/** A trampoline; landing on it while falling launches the player high. */
export interface TrampolineSpec extends Vec2 {}

/** One playable level definition. */
export interface Level {
	name: string;
	worldWidth: number;
	platforms: Platform[];
	caticorns: CaticornSpec[];
	monsters: MonsterSpec[];
	poops: PoopSpec[];
	trampolines: TrampolineSpec[];
	decor: Decor[];
	/** Two-stop background gradient (top, bottom) for cave mood. */
	bg: [string, string];
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
	lives: number;
	status: GameStatus;
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
