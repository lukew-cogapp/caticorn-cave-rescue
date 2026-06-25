import type { Container } from "pixi.js";
import { CAMERA_LERP } from "../const";
import { GAME_WIDTH, type Vec2 } from "../types";

/**
 * Smoothly follow the player by lerping the world container toward the target
 * scroll each frame, then clamping to the level bounds. Frame-rate independent
 * via dt so the follow feels the same at any refresh rate.
 */
export function updateCamera(
	world: Container,
	playerPos: Vec2,
	worldWidth: number,
	dt: number,
): void {
	const targetX = -playerPos.x + GAME_WIDTH / 2;
	const minX = -(worldWidth - GAME_WIDTH);
	const clamped = Math.max(minX, Math.min(0, targetX));
	world.x += (clamped - world.x) * Math.min(1, dt * CAMERA_LERP);
}
