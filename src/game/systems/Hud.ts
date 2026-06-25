import { Container, Graphics, Text } from "pixi.js";
import { EN } from "../strings/en";
import { GAME_WIDTH } from "../types";

/** Format seconds as m:ss. */
function formatTime(seconds: number): string {
	const s = Math.floor(seconds);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Data the HUD renders each update. */
export interface HudData {
	levelName: string;
	levelIndex: number; // zero-based
	totalLevels: number;
	rescued: number;
	toRescue: number;
	score: number;
	elapsed: number; // seconds
}

/**
 * The fixed in-canvas HUD: a translucent top bar showing level (left), rescued
 * count (centre), and score / timer / lives (right). Owns its own Container; add
 * `view` to a fixed (non-scrolling) layer above the world.
 */
export class Hud {
	readonly view = new Container();
	private readonly level: Text;
	private readonly rescued: Text;
	private readonly stats: Text; // score · time · lives, right-aligned

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
		// Render text at high resolution so it stays crisp when the stage is
		// scaled up in fullscreen (otherwise the glyph bitmap upscales = blurry).
		const mk = () => new Text({ text: "", style, resolution: 4 });

		this.level = mk();
		this.level.x = 14;
		this.level.y = 13;

		this.rescued = mk();
		this.rescued.anchor.set(0.5, 0);
		this.rescued.x = GAME_WIDTH / 2;
		this.rescued.y = 13;

		this.stats = mk();
		this.stats.y = 13;

		this.view.addChild(this.level, this.rescued, this.stats);
		this.view.eventMode = "none";
	}

	/** Refresh the readouts from the current game state. */
	update(d: HudData): void {
		const name = EN.levels[d.levelName] ?? d.levelName;
		this.level.text = EN.hudLevel(name, d.levelIndex + 1, d.totalLevels);
		this.rescued.text = EN.hudRescued(d.rescued, d.toRescue);
		// Right group: score + timer (health is shown by the floating bar).
		this.stats.text = `${EN.hudScore(d.score)}   ${formatTime(d.elapsed)}`;
		this.stats.x = GAME_WIDTH - 12 - this.stats.width;
	}
}
