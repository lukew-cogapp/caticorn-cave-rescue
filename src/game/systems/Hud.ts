import { Container, Graphics, Text } from "pixi.js";
import { EN } from "../strings/en";
import { GAME_WIDTH } from "../types";

/** Data the HUD renders each update. */
export interface HudData {
	levelName: string;
	levelIndex: number; // zero-based
	totalLevels: number;
	rescued: number;
	toRescue: number;
	lives: number;
}

/**
 * The fixed in-canvas HUD: a translucent top bar with three readouts (level,
 * rescued, lives). Owns its own Container; add `view` to a fixed (non-scrolling)
 * layer above the world.
 */
export class Hud {
	readonly view = new Container();
	private readonly level: Text;
	private readonly rescued: Text;
	private readonly lives: Text;

	constructor() {
		const bar = new Graphics()
			.roundRect(8, 8, GAME_WIDTH - 16, 26, 8)
			.fill({ color: 0x1a1124, alpha: 0.55 });
		this.view.addChild(bar);

		const style = {
			fill: "#ffe9b8",
			fontSize: 14,
			fontWeight: "bold" as const,
			fontFamily: "system-ui, sans-serif",
		};
		this.level = new Text({ text: "", style });
		this.level.x = 14;
		this.level.y = 13;

		this.rescued = new Text({ text: "", style });
		this.rescued.anchor.set(0.5, 0);
		this.rescued.x = GAME_WIDTH / 2;
		this.rescued.y = 13;

		this.lives = new Text({ text: "", style });
		this.lives.y = 13;

		this.view.addChild(this.level, this.rescued, this.lives);
		this.view.eventMode = "none";
	}

	/** Refresh the readouts from the current game state. */
	update(d: HudData): void {
		const name = EN.levels[d.levelName] ?? d.levelName;
		this.level.text = EN.hudLevel(name, d.levelIndex + 1, d.totalLevels);
		this.rescued.text = EN.hudRescued(d.rescued, d.toRescue);
		this.lives.text = EN.hudLives(d.lives);
		// Right-align the lives readout to the play area's right edge.
		this.lives.x = GAME_WIDTH - 12 - this.lives.width;
	}
}
