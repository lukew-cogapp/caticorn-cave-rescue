import { type Application, Container, Graphics } from "pixi.js";
import {
	drawBackground,
	drawDecor,
	drawFlute,
	drawGhost,
	drawPoop,
	drawTrampoline,
	type PlayerVariant,
} from "./art";
import { Chiptune } from "./audio";
import { Caticorn } from "./entities/Caticorn";
import { Exit } from "./entities/Exit";
import { createMonster, type Monster } from "./entities/Monster";
import { Player } from "./entities/Player";
import { buildLevels } from "./levels";
import {
	GAME_HEIGHT,
	GAME_WIDTH,
	type GameStatus,
	type HudCallback,
	type Level,
	type Rect,
	rectsOverlap,
	START_LIVES,
	TRAMPOLINE_VELOCITY,
	type WorldContext,
} from "./types";

/** Seconds the death ghost animation plays before respawn / game-over. */
const DEATH_ANIM_TIME = 1.1;
/** Horizontal velocity multiplier while standing on a poop. */
const POOP_SLOW = 0.35;
/** Collision box (centred on poop's bottom-centre) used for the slow zone. */
const POOP_BOX = { halfWidth: 14, height: 22 };

/**
 * Orchestrates the whole game: owns the Pixi app, builds each level's scene,
 * runs the fixed-logic simulation loop, resolves collisions, tracks lives and
 * level flow, plays chiptunes, and animates the death ghost. Entity behaviour
 * lives in the entity classes; this class wires them into a playable world.
 */
export class Game {
	private readonly app: Application;
	private readonly onHud: HudCallback;
	private readonly levels: Level[];
	private readonly audio = new Chiptune();

	/** Scrolling world container (camera moves this). */
	private readonly world = new Container();
	/** Fixed full-screen overlay tinting the scene for the day/night cycle. */
	private readonly nightOverlay = new Graphics();
	/** Day/night phase accumulator in seconds. */
	private dayPhase = 0;
	/** Sub-layer for entities so we can clear them between levels. */

	private readonly keys = new Set<string>();
	private variant: PlayerVariant = "aubrey";

	private levelIndex = 0;
	private lives = START_LIVES;
	private status: GameStatus = "playing";
	/** False until start() loads the first level; gates the simulation loop. */
	private started = false;

	private level!: Level;
	private player!: Player;
	private caticorns: Caticorn[] = [];
	private monsters: Monster[] = [];
	private exit!: Exit;
	/** Poop slow-zones: collision box per poop sprite. */
	private poops: Rect[] = [];
	/** Trampoline launch-zones: collision box per trampoline sprite. */
	private trampolines: Rect[] = [];
	/** Lethal spike collision boxes (stalactites + stalagmites). */
	private spikes: Rect[] = [];
	/** Flute pickups (extra life): sprite + box + collected flag + bob phase. */
	private flutes: { view: Container; box: Rect; taken: boolean }[] = [];

	/** Active death animation: ghost sprite + remaining time, or null. */
	private death: { ghost: Container; t: number } | null = null;

	private readonly onKeyDown: (e: KeyboardEvent) => void;
	private readonly onKeyUp: (e: KeyboardEvent) => void;

	constructor(app: Application, onHud: HudCallback) {
		this.app = app;
		this.onHud = onHud;
		this.levels = buildLevels();
		this.app.stage.addChild(this.world);

		// Day/night tint sits above the world (fixed, doesn't scroll). A deep
		// blue rectangle whose alpha rises at night; eventModes off so it never
		// blocks anything. Colour set once; only alpha animates per frame.
		this.nightOverlay
			.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
			.fill({ color: 0x0a1230, alpha: 1 });
		this.nightOverlay.eventMode = "none";
		this.nightOverlay.alpha = 0;
		this.app.stage.addChild(this.nightOverlay);

		this.onKeyDown = (e) => {
			if (
				["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
			) {
				e.preventDefault();
			}
			this.keys.add(e.key);
		};
		this.onKeyUp = (e) => this.keys.delete(e.key);
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);

		this.app.ticker.add(this.tick);
	}

	/** Begin a fresh run with the chosen character. */
	start(variant: PlayerVariant): void {
		this.variant = variant;
		this.audio.resume();
		this.levelIndex = 0;
		this.lives = START_LIVES;
		this.loadLevel(0);
		this.started = true;
	}

	/** Restart from level 1 keeping the current character. */
	restart(): void {
		this.start(this.variant);
	}

	/** Resize the renderer (CSS px). Stage is scaled to keep the world to fit. */
	resize(width: number, height: number): void {
		this.app.renderer.resize(width, height);
		const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
		this.app.stage.scale.set(scale);
		// Centre the scaled stage (letterbox).
		this.app.stage.x = (width - GAME_WIDTH * scale) / 2;
		this.app.stage.y = (height - GAME_HEIGHT * scale) / 2;
	}

	/** Reset to the default internal resolution (exit fullscreen). */
	resetView(): void {
		this.app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
		this.app.stage.scale.set(1);
		this.app.stage.x = 0;
		this.app.stage.y = 0;
	}

	destroy(): void {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		this.app.ticker.remove(this.tick);
		this.app.destroy(true, { children: true });
	}

	// --- Level setup ---

	private loadLevel(index: number): void {
		this.level = this.levels[index];
		this.world.removeChildren();
		this.caticorns = [];
		this.monsters = [];
		this.poops = [];
		this.trampolines = [];
		this.spikes = [];
		this.flutes = [];
		this.death = null;

		// Background gradient + cave mood.
		this.world.addChild(drawBackground(this.level.worldWidth, this.level.bg));

		// Decor: stalactites hang from the ceiling, stalagmites/crystals on floor.
		// Only ceiling stalactites are lethal (you can avoid jumping into them);
		// floor stalagmites/crystals stay decorative so the ground path is always
		// walkable and levels remain fair.
		for (const d of this.level.decor) {
			const g = drawDecor(d);
			g.x = d.x;
			g.y = d.kind === "stalactite" ? 0 : GAME_HEIGHT - 30;
			this.world.addChild(g);

			if (d.kind === "stalactite") {
				// Spike points down from the ceiling, length ~size*2.
				this.spikes.push({
					x: d.x - d.size * 0.4,
					y: 0,
					w: d.size * 0.8,
					h: d.size * 2,
				});
			}
		}

		// Platforms (drawn here; entities don't own static geometry).
		for (const p of this.level.platforms) {
			this.world.addChild(
				new Graphics()
					.roundRect(p.x, p.y, p.w, p.h, 4)
					.fill("#4a3a63")
					.stroke({ color: "#6d5a8c", width: 2 }),
			);
		}

		// Poops: static slow-zone hazards on the ground.
		for (const spec of this.level.poops) {
			const g = drawPoop();
			g.x = spec.x;
			g.y = spec.y;
			this.world.addChild(g);
			this.poops.push({
				x: spec.x - POOP_BOX.halfWidth,
				y: spec.y - POOP_BOX.height,
				w: POOP_BOX.halfWidth * 2,
				h: POOP_BOX.height,
			});
		}

		// Trampolines: bounce-zones drawn on the ground.
		for (const spec of this.level.trampolines) {
			const g = drawTrampoline();
			g.x = spec.x;
			g.y = spec.y;
			this.world.addChild(g);
			// Box covers the springy pad (top ~22px of the sprite).
			this.trampolines.push({ x: spec.x - 30, y: spec.y - 24, w: 60, h: 24 });
		}

		// Flutes: floating extra-life pickups.
		for (const spec of this.level.flutes) {
			const g = drawFlute();
			g.x = spec.x;
			g.y = spec.y;
			this.world.addChild(g);
			this.flutes.push({
				view: g,
				box: { x: spec.x - 14, y: spec.y - 36, w: 28, h: 38 },
				taken: false,
			});
		}

		// Exit gate.
		this.exit = Exit.create(this.level.exit);
		this.world.addChild(this.exit.view);

		// Caticorns to rescue.
		for (const spec of this.level.caticorns) {
			const cat = Caticorn.create(spec);
			this.caticorns.push(cat);
			this.world.addChild(cat.view);
		}

		// Monsters.
		for (const spec of this.level.monsters) {
			const m = createMonster(spec);
			this.monsters.push(m);
			this.world.addChild(m.view);
		}

		// Player on top.
		this.player = Player.create(this.level.spawn, this.variant);
		this.world.addChild(this.player.view);

		this.status = "playing";
		this.emitHud();
	}

	// --- Simulation loop ---

	private readonly tick = (): void => {
		// Idle until the player picks a character and start() loads a level.
		if (!this.started) return;
		const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.05);

		// Day/night cycle: a slow sine drives the night overlay alpha (0 = day,
		// up to ~0.55 at deep night). Purely cosmetic mood.
		this.dayPhase += dt;
		const night = (Math.sin(this.dayPhase * 0.18) + 1) / 2; // 0..1
		this.nightOverlay.alpha = night * 0.55;

		// Death animation overrides normal play until it finishes.
		if (this.death) {
			this.updateDeath(dt);
			this.updateCamera();
			return;
		}
		if (this.status !== "playing") return;

		const ctx: WorldContext = {
			level: this.level,
			keys: this.keys,
			dt,
			player: { aabb: () => this.player.aabb(), pos: this.player.pos },
		};

		this.player.update(ctx);
		for (const cat of this.caticorns) cat.update(ctx);
		for (const m of this.monsters) m.update(ctx);

		// Fell into a pit.
		if (this.player.fellOffWorld()) {
			this.beginDeath();
			return;
		}

		const pBox = this.player.aabb();

		// Trampoline: landing on the pad while descending launches the player
		// high. Snap feet to the pad top so the bounce starts from its surface.
		if (this.player.velY >= 0) {
			for (const tramp of this.trampolines) {
				if (rectsOverlap(pBox, tramp)) {
					this.player.pos.y = tramp.y;
					this.player.bounce(TRAMPOLINE_VELOCITY);
					this.player.view.y = this.player.pos.y;
					break;
				}
			}
		}

		// Poop slow-zone: standing on a poop drags the player's speed down.
		// Undo most of this frame's horizontal gain and damp velocity so the
		// slowdown is felt immediately and persists while overlapping.
		for (const poop of this.poops) {
			if (rectsOverlap(pBox, poop)) {
				this.player.pos.x -= this.player.vel.x * dt * (1 - POOP_SLOW);
				this.player.vel.x *= POOP_SLOW;
				this.player.view.x = this.player.pos.x;
				break;
			}
		}

		// Hit a monster.
		for (const m of this.monsters) {
			if (rectsOverlap(pBox, m.aabb())) {
				this.beginDeath();
				return;
			}
		}

		// Impaled on a spike.
		for (const spike of this.spikes) {
			if (rectsOverlap(pBox, spike)) {
				this.beginDeath();
				return;
			}
		}

		// Flutes: bob gently; collecting one grants an extra life.
		for (const flute of this.flutes) {
			if (flute.taken) continue;
			flute.view.y += Math.sin(this.dayPhase * 3 + flute.box.x) * 0.4;
			if (rectsOverlap(pBox, flute.box)) {
				flute.taken = true;
				flute.view.visible = false;
				this.lives += 1;
				this.audio.rescue();
				this.emitHud();
			}
		}

		// Rescue caticorns on contact.
		for (const cat of this.caticorns) {
			if (!cat.rescued && rectsOverlap(pBox, cat.aabb())) {
				cat.rescue();
				this.audio.rescue();
				this.emitHud();
			}
		}

		// Exit unlocks once all are freed; reaching it clears the level.
		const allFreed = this.caticorns.every((c) => c.rescued);
		this.exit.setUnlocked(allFreed);
		this.exit.update(ctx);
		if (allFreed && rectsOverlap(pBox, this.exit.aabb())) {
			this.clearLevel();
			return;
		}

		this.updateCamera();
	};

	private updateCamera(): void {
		const targetX = -this.player.pos.x + GAME_WIDTH / 2;
		const minX = -(this.level.worldWidth - GAME_WIDTH);
		this.world.x = Math.max(minX, Math.min(0, targetX));
	}

	// --- Death / lives ---

	private beginDeath(): void {
		this.audio.hurt();
		const ghost = drawGhost(this.variant);
		ghost.x = this.player.pos.x;
		ghost.y = this.player.pos.y;
		this.world.addChild(ghost);
		this.player.view.visible = false;
		this.death = { ghost, t: DEATH_ANIM_TIME };
	}

	private updateDeath(dt: number): void {
		if (!this.death) return;
		// Float the ghost up and fade it out.
		this.death.ghost.y -= 60 * dt;
		this.death.ghost.alpha = Math.max(0, this.death.t / DEATH_ANIM_TIME);
		this.death.t -= dt;
		if (this.death.t > 0) return;

		// Animation done: resolve life loss.
		this.world.removeChild(this.death.ghost);
		this.death.ghost.destroy({ children: true });
		this.death = null;
		this.lives -= 1;

		if (this.lives <= 0) {
			this.status = "lost";
			this.emitHud();
			return;
		}
		this.player.respawn(this.level.spawn);
		this.player.view.visible = true;
		this.emitHud();
	}

	private clearLevel(): void {
		if (this.levelIndex + 1 >= this.levels.length) {
			this.status = "won";
			this.audio.gameWin();
			this.emitHud();
			return;
		}
		this.audio.levelWin();
		this.levelIndex += 1;
		this.loadLevel(this.levelIndex);
	}

	private emitHud(): void {
		this.onHud({
			level: this.levelIndex + 1,
			levelName: this.level.name,
			totalLevels: this.levels.length,
			rescued: this.caticorns.filter((c) => c.rescued).length,
			toRescue: this.caticorns.length,
			lives: this.lives,
			status: this.status,
		});
	}
}
