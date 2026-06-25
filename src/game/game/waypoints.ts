import type { Container } from "pixi.js";
import { Graphics } from "pixi.js";
import type { Caticorn } from "../entities/Caticorn";
import { GAME_HEIGHT, GAME_WIDTH } from "../types";

/**
 * While the waypoint timer is active (set by touching a locked exit), draw an
 * arrow toward each unrescued caticorn — clamped to the screen edge when the
 * caticorn is off-screen, like a waypoint marker.
 *
 * @param timer Seconds remaining (before this frame).
 * @param worldX Current world container scroll offset (for screen-space).
 * @returns The new timer value (caller stores it back).
 */
export function updateWaypoints(
	waypoints: Container,
	caticorns: Caticorn[],
	timer: number,
	worldX: number,
	dt: number,
): number {
	if (timer <= 0) {
		if (waypoints.visible) waypoints.visible = false;
		return timer;
	}
	const next = timer - dt;
	waypoints.visible = true;
	for (const c of waypoints.removeChildren()) c.destroy();
	const pad = 26;
	for (const cat of caticorns) {
		if (cat.rescued) continue;
		// Caticorn position in screen space (world is scrolled by world.x).
		const sx = cat.pos.x + worldX;
		const sy = cat.pos.y - cat.aabb().h / 2;
		const cx = GAME_WIDTH / 2;
		const cy = GAME_HEIGHT / 2;
		const onScreen = sx > 0 && sx < GAME_WIDTH && sy > 40 && sy < GAME_HEIGHT;
		let ax = sx;
		let ay = sy - 30; // float above the caticorn when on-screen
		if (!onScreen) {
			// Clamp to the screen edge along the direction to the caticorn.
			const dx = sx - cx;
			const dy = sy - cy;
			const scale = Math.min(
				(GAME_WIDTH / 2 - pad) / Math.max(1, Math.abs(dx)),
				(GAME_HEIGHT / 2 - pad) / Math.max(1, Math.abs(dy)),
			);
			ax = cx + dx * scale;
			ay = cy + dy * scale;
		}
		const angle = Math.atan2(sy - ay, sx - ax);
		const arrow = new Graphics()
			.poly([12, 0, -8, -7, -8, 7])
			.fill({ color: 0xffe14d, alpha: 0.95 });
		arrow.x = ax;
		arrow.y = ay;
		arrow.rotation = angle;
		waypoints.addChild(arrow);
	}
	return next;
}
