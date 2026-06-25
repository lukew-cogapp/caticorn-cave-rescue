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
import { Hud } from "./systems/Hud";
import { Particles } from "./systems/Particles";
import { ScreenShake } from "./systems/ScreenShake";
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
/** Seconds the poop slow + brown feet linger after leaving the poop. */
const POOP_LINGER = 1;
/** Collision box (centred on poop's bottom-centre) used for the slow zone. */
const POOP_BOX = { halfWidth: 14, height: 22 };

/** Camera follow smoothing factor (per second); higher = snappier. */
const CAMERA_LERP = 8;
/** Min downward landing speed (px/sec) that triggers a hard-landing shake. */
const HARD_LAND_SPEED = 520;
/** Upward hop given to the player after a successful stomp. */
const STOMP_BOUNCE = -380;
/**
 * How far the player's feet may sit below a monster's top and still count as a
 * stomp rather than a side hit, in pixels.
 */
const STOMP_TOLERANCE = 14;

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

	/** Fixed in-canvas HUD (level / rescued / lives), above the world. */
	private readonly hud = new Hud();
	/** Juice systems: particle pool (parented to the world) + screen shake. */
	private readonly particles = new Particles(this.world);
	/** Screen shake; initialised in the constructor once `app` is set. */
	private readonly shake: ScreenShake;

	private readonly keys = new Set<string>();
	private variant: PlayerVariant = "aubrey";

	private levelIndex = 0;
	private lives = START_LIVES;
	/** Caticorns rescued across the whole run (persists across levels). */
	private totalRescued = 0;
	/** Elapsed run time in seconds, accumulated while playing. */
	private elapsed = 0;
	/** Remaining seconds of poop slow/stuck effect (lingers after leaving). */
	private poopTimer = 0;
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
	/** Flute pickups (extra life): sprite + collision box + drift state. */
	private flutes: {
		view: Container;
		box: Rect;
		taken: boolean;
		homeX: number;
		homeY: number;
		phase: number;
	}[] = [];

	/** Active death animation: ghost sprite + remaining time, or null. */
	private death: { ghost: Container; t: number } | null = null;

	private readonly onKeyDown: (e: KeyboardEvent) => void;
	private readonly onKeyUp: (e: KeyboardEvent) => void;

	constructor(app: Application, onHud: HudCallback) {
		this.app = app;
		this.onHud = onHud;
		this.levels = buildLevels();
		this.shake = new ScreenShake(this.app.stage);
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

		// In-canvas HUD, drawn above the world + tint so it stays legible. Fixed
		// screen position (added to stage, not the scrolling world).
		this.app.stage.addChild(this.hud.view);

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
		this.totalRescued = 0;
		this.elapsed = 0;
		// Clear any keys held from the start screen (e.g. the Space/Enter that
		// began the run) so the player doesn't jump on the first frame.
		this.keys.clear();
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
		// Particle views lived in `world`; removeChildren() above detached them, so
		// just drop the pool references and reset the shake.
		this.particles.clear();
		this.shake.reset();
		this.poopTimer = 0;

		// Background gradient + cave mood.
		this.world.addChild(drawBackground(this.level.worldWidth, this.level.bg));

		// Decor placement by kind: stalactites hang from the ceiling, wall cracks
		// use their own y up the cave wall, everything else sits on the floor.
		// Only ceiling stalactites are lethal (avoidable); the rest is decorative
		// so the ground path stays walkable and levels remain fair.
		const floorY = GAME_HEIGHT - 30;
		for (const d of this.level.decor) {
			const g = drawDecor(d);
			g.x = d.x;
			if (d.kind === "stalactite") g.y = 0;
			else if (d.kind === "crack") g.y = d.y;
			else g.y = floorY;
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
			this.dropPoopAt(spec.x, spec.y);
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

		// Flutes: floating extra-life pickups. They drift in a lazy loop around
		// their home point (see the tick) so they're a little harder to grab.
		this.level.flutes.forEach((spec, i) => {
			const g = drawFlute();
			g.x = spec.x;
			g.y = spec.y;
			this.world.addChild(g);
			this.flutes.push({
				view: g,
				box: { x: spec.x - 14, y: spec.y - 36, w: 28, h: 38 },
				taken: false,
				homeX: spec.x,
				homeY: spec.y,
				// Stagger starting phase per flute so they don't move in lockstep.
				phase: i * 1.7,
			});
		});

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

	/**
	 * Spawn a poop sprite + slow-zone collision box at a world point. Used for
	 * both level-authored poops and poop dropped by ceiling lurkers. Defaults to
	 * the ground line when no y is given.
	 */
	private dropPoopAt(x: number, y: number = GAME_HEIGHT - 30): void {
		const g = drawPoop();
		g.x = x;
		g.y = y;
		this.world.addChild(g);
		this.poops.push({
			x: x - POOP_BOX.halfWidth,
			y: y - POOP_BOX.height,
			w: POOP_BOX.halfWidth * 2,
			h: POOP_BOX.height,
		});
	}

	// --- Simulation loop ---

	private readonly tick = (): void => {
		// Idle until the player picks a character and start() loads a level.
		if (!this.started) return;
		const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.05);

		// Day/night cycle: a slow wave drives the night overlay alpha. Uses
		// (1 - cos)/2 so it STARTS at full day (alpha 0) and eases into night,
		// rather than starting half-dark. Capped low so day stays bright.
		this.dayPhase += dt;
		const night = (1 - Math.cos(this.dayPhase * 0.16)) / 2; // 0 at start → 1
		this.nightOverlay.alpha = night * 0.4;

		// Particles + shake run every frame regardless of status so bursts finish
		// even on the win/lose/death frame.
		this.particles.update(dt);
		this.shake.update(dt);

		// Death animation overrides normal play until it finishes.
		if (this.death) {
			this.updateDeath(dt);
			this.updateCamera(dt);
			return;
		}
		if (this.status !== "playing") return;

		// Accumulate run time while actively playing.
		this.elapsed += dt;

		const ctx: WorldContext = {
			level: this.level,
			keys: this.keys,
			dt,
			player: { aabb: () => this.player.aabb(), pos: this.player.pos },
		};

		this.player.update(ctx);
		for (const cat of this.caticorns) cat.update(ctx);
		for (const m of this.monsters) {
			m.update(ctx);
			// Ceiling lurkers periodically drop poop onto the ground below.
			const dropX = m.consumeDrop();
			if (dropX !== null) this.dropPoopAt(dropX);
		}

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
					this.particles.burst(this.player.pos.x, this.player.pos.y, "puff", 8);
					this.shake.add(3);
					break;
				}
			}
		}

		// Hard landing: a fast touchdown kicks up dust. The camera "ground pound"
		// shake is reserved for double-jump landings, so an ordinary jump never
		// rattles the screen.
		if (
			this.player.justLanded &&
			this.player.landImpactSpeed > HARD_LAND_SPEED
		) {
			this.particles.burst(this.player.pos.x, this.player.pos.y, "dust", 6);
			if (this.player.landedFromDoubleJump) {
				const t = Math.min(1, this.player.landImpactSpeed / 1400);
				this.shake.add(2 + t * 3);
			}
		}

		// Poop: stepping on one (re)starts a lingering effect that keeps the
		// player slowed, brown-footed and unable to jump for POOP_LINGER seconds
		// after they leave it.
		for (const poop of this.poops) {
			if (rectsOverlap(pBox, poop)) {
				this.poopTimer = POOP_LINGER;
				break;
			}
		}
		if (this.poopTimer > 0) {
			this.poopTimer -= dt;
			this.player.setPoopAffected(true);
			// Drag the player's speed down while the effect lasts.
			this.player.pos.x -= this.player.vel.x * dt * (1 - POOP_SLOW);
			this.player.vel.x *= POOP_SLOW;
			this.player.view.x = this.player.pos.x;
		} else {
			this.player.setPoopAffected(false);
		}

		// Hit a monster. Dead monsters are inert (skipped); so are non-lethal ones
		// (e.g. the overhead lurker). A live lethal monster is a stomp if the
		// player is falling onto its head, else it kills the player.
		for (const m of this.monsters) {
			if (m.isDead() || !m.isLethal()) continue;
			const mBox = m.aabb();
			if (!rectsOverlap(pBox, mBox)) continue;
			const playerBottom = pBox.y + pBox.h;
			const stomp =
				this.player.velY > 0 && playerBottom <= mBox.y + STOMP_TOLERANCE;
			if (stomp) {
				m.kill();
				this.player.bounce(STOMP_BOUNCE);
				this.particles.burst(m.pos.x, m.pos.y - mBox.h / 2, "puff", 8);
				this.shake.add(3);
				this.audio.rescue();
			} else {
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

		// Flutes drift in a lazy Lissajous loop around their home point so they
		// dodge a lazy grab; the collision box tracks the sprite.
		for (const flute of this.flutes) {
			if (flute.taken) continue;
			flute.phase += dt;
			const dx = Math.sin(flute.phase * 1.3) * 26;
			const dy = Math.cos(flute.phase * 0.9) * 18;
			const fx = flute.homeX + dx;
			const fy = flute.homeY + dy;
			flute.view.x = fx;
			flute.view.y = fy;
			flute.box.x = fx - 14;
			flute.box.y = fy - 36;
			if (rectsOverlap(pBox, flute.box)) {
				flute.taken = true;
				flute.view.visible = false;
				this.lives += 1;
				this.particles.burst(
					flute.box.x + flute.box.w / 2,
					flute.box.y + 8,
					"note",
					6,
				);
				this.audio.rescue();
				this.emitHud();
			}
		}

		// Rescue caticorns on contact.
		for (const cat of this.caticorns) {
			if (!cat.rescued && rectsOverlap(pBox, cat.aabb())) {
				cat.rescue();
				this.totalRescued += 1;
				const cBox = cat.aabb();
				this.particles.burst(cat.pos.x, cBox.y + cBox.h / 2, "spark", 12);
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

		this.updateCamera(dt);
	};

	/**
	 * Smoothly follow the player by lerping the world container toward the target
	 * scroll each frame, then clamping to the level bounds. Frame-rate independent
	 * via dt so the follow feels the same at any refresh rate.
	 */
	private updateCamera(dt: number): void {
		const targetX = -this.player.pos.x + GAME_WIDTH / 2;
		const minX = -(this.level.worldWidth - GAME_WIDTH);
		const clamped = Math.max(minX, Math.min(0, targetX));
		this.world.x += (clamped - this.world.x) * Math.min(1, dt * CAMERA_LERP);
	}

	// --- Death / lives ---

	private beginDeath(): void {
		this.audio.hurt();
		this.shake.add(7);
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
		const rescued = this.caticorns.filter((c) => c.rescued).length;
		const toRescue = this.caticorns.length;

		// Update the in-canvas HUD readouts.
		if (this.level) {
			this.hud.update({
				levelName: this.level.name,
				levelIndex: this.levelIndex,
				totalLevels: this.levels.length,
				rescued,
				toRescue,
				lives: this.lives,
			});
		}

		// Still notify the host page for the win/lose overlay (DOM).
		this.onHud({
			level: this.levelIndex + 1,
			levelName: this.level.name,
			totalLevels: this.levels.length,
			rescued,
			toRescue,
			lives: this.lives,
			status: this.status,
			totalRescued: this.totalRescued,
			elapsed: this.elapsed,
		});
	}
}
