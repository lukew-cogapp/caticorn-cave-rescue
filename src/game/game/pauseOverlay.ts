import { Container, Graphics, Text } from "pixi.js";
import { GAME_HEIGHT, GAME_WIDTH } from "../types";

/**
 * Build the (hidden) paused overlay: a dim screen + "Paused" label. Returned
 * as a fixed-stage container (eventMode off, initially invisible) the caller
 * toggles when pausing.
 */
export function buildPauseOverlay(): Container {
	const pauseOverlay = new Container();
	const dim = new Graphics()
		.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
		.fill({ color: 0x000000, alpha: 0.5 });
	const label = new Text({
		text: "Paused\nPress P to resume",
		resolution: 4,
		style: {
			fill: "#ffe9b8",
			fontSize: 22,
			fontWeight: "bold",
			align: "center",
			fontFamily: "system-ui, sans-serif",
		},
	});
	label.anchor.set(0.5);
	label.x = GAME_WIDTH / 2;
	label.y = GAME_HEIGHT / 2;
	pauseOverlay.addChild(dim, label);
	pauseOverlay.eventMode = "none";
	pauseOverlay.visible = false;
	return pauseOverlay;
}
