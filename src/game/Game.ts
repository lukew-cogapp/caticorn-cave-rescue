import { type Application, Container, Graphics } from "pixi.js";
import { type BackgroundLayers, drawGhost, type PlayerVariant } from "./art";
import { Chiptune } from "./audio";
import {
	DEATH_ANIM_TIME,
	FALL_DAMAGE,
	FIXED_DT,
	FREEZE_DEATH,
	FREEZE_STOMP,
	INVULN_TIME,
	MAX_FRAME_TIME,
	NIGHT_LIGHTING,
	POOP_DAMAGE,
	POOP_LINGER,
	START_HEALTH,
} from "./const";
import type { Caticorn } from "./entities/Caticorn";
import type { Exit } from "./entities/Exit";
import type { Monster } from "./entities/Monster";
import type { Player } from "./entities/Player";
import { updateCamera } from "./game/camera";
import { type CollisionState, resolveCollisions } from "./game/collisions";
import { updateDayNight } from "./game/daynight";
import { createInput } from "./game/input";
import { buildPauseOverlay } from "./game/pauseOverlay";
import {
	type FallingPoop,
	type GroundPoop,
	spawnFallingPoop,
	updateFallingPoops,
	updatePoops,
} from "./game/poop";
import { type FluteEntry, type GlowEntry, loadScene } from "./game/scene";
import { updateWaypoints } from "./game/waypoints";
import { buildLevels } from "./levels";
import { Fireflies } from "./systems/Fireflies";
import { HealthBar } from "./systems/HealthBar";
import { Motes } from "./systems/Motes";
import { Particles } from "./systems/Particles";
import { ScreenShake } from "./systems/ScreenShake";
import {
	GAME_HEIGHT,
	GAME_WIDTH,
	type GameStatus,
	type HudCallback,
	type Level,
	PLAYER_H,
	type Rect,
	type WorldContext,
} from "./types";

/**
 * Orchestrates the whole game: owns the Pixi app, builds each level's scene,
 * runs the fixed-logic simulation loop, resolves collisions, tracks lives and
 * level flow, plays chiptunes, and animates the death ghost. Entity behaviour
 * lives in the entity classes; per-frame systems (camera, day/night, poop,
 * collisions, waypoints) live in ./game/*; this class wires them together.
 */
export class Game {
	private readonly app: Application;
	private readonly onHud: HudCallback;
	/** Rebuilt per run with a fresh seed so layouts vary each playthrough. */
	private levels: Level[];
	private readonly audio = new Chiptune();

	/** Scrolling world container (camera moves this). */
	private readonly world = new Container();
	/** Fixed full-screen overlay tinting the scene for the day/night cycle. */
	private readonly nightOverlay = new Graphics();
	/** Day/night phase accumulator in seconds. */
	private dayPhase = 0;
	/** Ambient-glow pulse phase accumulator in seconds (drives glow breathing). */
	private glowPhase = 0;
	/**
	 * Peak alpha intensity for the current level's night overlay. Set from
	 * {@link NIGHT_LIGHTING} when a level loads; passed to {@link updateDayNight}
	 * each step so each theme controls how dark full-night feels.
	 */
	private nightIntensity = 0.4;

	/** Ambient background fireflies (added behind gameplay in the world). */
	private readonly fireflies = new Fireflies();
	/** Ambient drifting cave motes (foreground atmosphere, parented to the world). */
	private readonly motes = new Motes();
	/** Floating health bar above the player's head. */
	private readonly healthBar = new HealthBar();
	/** Juice systems: particle pool (parented to the world) + screen shake. */
	private readonly particles = new Particles(this.world);
	/** Screen shake; initialised in the constructor once `app` is set. */
	private readonly shake: ScreenShake;

	private readonly keys: Set<string>;
	private variant: PlayerVariant = "aubrey";

	private levelIndex = 0;
	/**
	 * Mutable per-run scalars shared by reference with the collision pass so its
	 * extracted logic and the death/damage callbacks see one source of truth.
	 * health (0..1), totalRescued (run-long), score (+1 rescue/+1 stomp), the
	 * rising-tune songStep, hit-stop freezeTimer, monster-hit invulnTimer, poop
	 * slow poopTimer, and the locked-exit waypointTimer.
	 */
	private readonly state: CollisionState = {
		poopTimer: 0,
		invulnTimer: 0,
		freezeTimer: 0,
		score: 0,
		songStep: 0,
		totalRescued: 0,
		health: START_HEALTH,
		waypointTimer: 0,
		beckonTimer: 0,
		flawless: { noDamage: true, noKills: true, noFalls: true, noPoop: true },
	};
	/** Elapsed run time in seconds, accumulated while playing. */
	private elapsed = 0;
	/**
	 * Fixed-timestep accumulator (seconds). Real elapsed time is added each
	 * rendered frame and drained in {@link FIXED_DT} chunks by {@link step}, so
	 * the sim advances in constant increments independent of the frame rate.
	 */
	private accumulator = 0;
	/** Poop falling from a lurker: sprite + vertical velocity, lands into a poop. */
	private fallingPoops: FallingPoop[] = [];
	private status: GameStatus = "playing";
	/** False until start() loads the first level; gates the simulation loop. */
	private started = false;
	/** True while paused (P key). Freezes the sim; shows a paused overlay. */
	private paused = false;
	/** Dimming overlay + "Paused" label shown while paused. */
	private readonly pauseOverlay = buildPauseOverlay();
	/** Fixed overlay holding "missed caticorn" waypoint arrows. */
	private readonly waypoints = new Container();

	private level!: Level;
	private player!: Player;
	private caticorns: Caticorn[] = [];
	private monsters: Monster[] = [];
	private exit!: Exit;
	/** Poop slow-zones: sprite + collision box + remaining lifetime (fades out). */
	private poops: GroundPoop[] = [];
	/** Trampoline launch-zones: collision box per trampoline sprite. */
	private trampolines: Rect[] = [];
	/** Lethal spike collision boxes (stalactites + stalagmites). */
	private spikes: Rect[] = [];
	/** Flute pickups (extra life): sprite + collision box + drift state. */
	private flutes: FluteEntry[] = [];
	/** Parallax background depth layers; scrolled slower than the world per frame. */
	private bgLayers!: BackgroundLayers;
	/** Ambient pulsing glow clusters on the far background layer. */
	private glows: GlowEntry[] = [];

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

		this.waypoints.eventMode = "none";
		this.waypoints.visible = false;
		this.app.stage.addChild(this.waypoints);

		this.app.stage.addChild(this.pauseOverlay);

		const input = createInput(
			() => this.started,
			() => this.togglePause(),
		);
		this.keys = input.keys;
		this.onKeyDown = input.onKeyDown;
		this.onKeyUp = input.onKeyUp;
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);

		this.app.ticker.add(this.tick);
	}

	/** Toggle pause (P key). Freezes the sim and shows the overlay. */
	private togglePause(): void {
		if (this.status !== "playing") return;
		this.paused = !this.paused;
		this.pauseOverlay.visible = this.paused;
		// Drop held keys so movement doesn't resume mid-press after unpausing.
		this.keys.clear();
	}

	/**
	 * Begin a fresh run with the chosen character. An optional seed regenerates
	 * the level layouts so each playthrough differs; omit for the default layout.
	 */
	start(variant: PlayerVariant, seed?: number): void {
		this.variant = variant;
		this.audio.resume();
		if (seed !== undefined) this.levels = buildLevels(seed);
		this.levelIndex = 0;
		this.state.health = START_HEALTH;
		this.state.totalRescued = 0;
		this.state.score = 0;
		this.state.songStep = 0;
		this.state.flawless = {
			noDamage: true,
			noKills: true,
			noFalls: true,
			noPoop: true,
		};
		this.elapsed = 0;
		this.accumulator = 0;
		this.glowPhase = 0;
		this.dayPhase = 0;
		this.paused = false;
		this.pauseOverlay.visible = false;
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

	/**
	 * Tear down the previous level's display objects before rebuilding. Detaches
	 * the three reusable shared views (fireflies, motes, health bar) so they
	 * survive, recycles their internal sprite pools, then DESTROYS every remaining
	 * world child — the level-owned static art (background layers, floor strip,
	 * platforms, grass, decor) and entities (player, monsters, caticorns, exit,
	 * flutes) plus any leftover particle/poop sprites.
	 *
	 * `destroy({ children: true })` frees each object's GPU geometry AND releases
	 * any cacheAsTexture render texture it holds (Pixi 8 invalidates + frees the
	 * cache on destroy), so the per-level caches added in loadScene don't leak
	 * across level loads. Previously this was a bare `removeChildren()`, which
	 * detached but never freed the old level's resources.
	 */
	private teardownLevel(): void {
		// Detach the shared, reusable views first so they aren't destroyed; their
		// own clear() recycles internal sprites and keeps the outer container.
		this.world.removeChild(this.fireflies.view);
		this.world.removeChild(this.motes.view);
		this.world.removeChild(this.healthBar.view);
		this.fireflies.clear();
		this.motes.clear();
		// Destroy everything else the previous level owned (art + entities +
		// leftover juice sprites), freeing geometry and any cached textures.
		for (const child of this.world.removeChildren()) {
			child.destroy({ children: true });
		}
	}

	private loadLevel(index: number): void {
		this.level = this.levels[index];

		// Re-fill the night overlay with the per-theme ambient tint colour.
		// The Graphics rectangle size is fixed (GAME_WIDTH × GAME_HEIGHT) so we
		// clear + re-fill rather than re-creating the object; alpha stays at 0
		// and is animated each step by updateDayNight. The intensity scalar for
		// this theme is stored so the step loop can pass it through.
		const lighting = NIGHT_LIGHTING[this.level.themeStyle];
		this.nightIntensity = lighting.intensity;
		this.nightOverlay.clear();
		this.nightOverlay
			.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
			.fill({ color: lighting.color, alpha: 1 });
		this.nightOverlay.alpha = 0;

		this.teardownLevel();
		this.poops = [];
		this.death = null;
		// Particle views were destroyed by teardownLevel (it destroys every
		// world child); just drop the pool references and reset the shake.
		this.particles.clear();
		this.shake.reset();
		this.state.poopTimer = 0;
		this.state.freezeTimer = 0;
		this.state.invulnTimer = 0;
		this.state.waypointTimer = 0;
		this.state.beckonTimer = 0;
		this.fallingPoops = [];

		const scene = loadScene(
			this.world,
			this.level,
			this.variant,
			this.fireflies,
			this.motes,
			this.healthBar,
		);
		this.caticorns = scene.caticorns;
		this.monsters = scene.monsters;
		this.trampolines = scene.trampolines;
		this.spikes = scene.spikes;
		this.flutes = scene.flutes;
		this.exit = scene.exit;
		this.player = scene.player;
		this.bgLayers = scene.bgLayers;
		this.glows = scene.glows;

		this.status = "playing";
		this.emitHud();
	}

	// --- Simulation loop ---

	/**
	 * Per-rendered-frame driver. Accumulates real elapsed time and advances the
	 * simulation in fixed {@link FIXED_DT} increments, running zero or more steps
	 * this frame so the sim is frame-rate independent and deterministic.
	 *
	 * The accumulated time is clamped to {@link MAX_FRAME_TIME} so a long stall
	 * (tab refocus, GC pause) can never trigger a spiral of death; the excess is
	 * dropped. Pause and the not-yet-started state gate the whole loop (no time
	 * accumulates while paused, matching the old single-pass behaviour).
	 */
	private readonly tick = (): void => {
		// Idle until the player picks a character and start() loads a level.
		if (!this.started) return;
		// Paused: freeze everything (no sim, no juice, no time accrual) until
		// unpaused. Reset the accumulator so re-focusing while paused can't bank a
		// burst of catch-up steps the moment play resumes.
		if (this.paused) {
			this.accumulator = 0;
			return;
		}

		// Add this frame's real elapsed (clamped) and drain it in fixed chunks.
		this.accumulator += Math.min(
			this.app.ticker.deltaMS / 1000,
			MAX_FRAME_TIME,
		);
		while (this.accumulator >= FIXED_DT) {
			this.accumulator -= FIXED_DT;
			this.step(FIXED_DT);
		}
	};

	/**
	 * Advance the whole simulation by one fixed {@link FIXED_DT} step. This is the
	 * former per-frame `tick` body verbatim (same logic, same order, same early
	 * exits) now invoked N times per rendered frame on a constant `dt`. Every
	 * gameplay system, timer, juice effect and camera/parallax update runs here so
	 * the sim stays fully deterministic and frame-rate independent. Early returns
	 * (freeze / death / status / falling-poop death / collision-driven level end)
	 * simply end the current step; the next queued step (if any) picks up next.
	 *
	 * @param dt The fixed step size in seconds ({@link FIXED_DT}).
	 */
	private step(dt: number): void {
		this.dayPhase = updateDayNight(
			this.nightOverlay,
			this.dayPhase,
			dt,
			this.nightIntensity,
		);

		// Particles + shake run every frame regardless of status so bursts finish
		// even on the win/lose/death frame.
		this.particles.update(dt);
		this.shake.update(dt);

		// Hit-stop: briefly freeze the gameplay sim on impactful events (stomp /
		// death) for a punchy pause. Particles + shake above keep animating.
		if (this.state.freezeTimer > 0) {
			this.state.freezeTimer -= dt;
			return;
		}

		// Death animation overrides normal play until it finishes.
		if (this.death) {
			this.updateDeath(dt);
			updateCamera(this.world, this.player.pos, this.level.worldWidth, dt);
			this.updateParallaxAndGlow(dt);
			return;
		}
		if (this.status !== "playing") return;

		// Accumulate run time while actively playing; refresh the HUD so the
		// on-screen timer ticks live.
		this.elapsed += dt;
		this.refreshHud();

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
			// Ceiling lurkers periodically drop poop, which falls to the ground.
			const dropX = m.consumeDrop();
			if (dropX !== null)
				spawnFallingPoop(this.world, this.fallingPoops, dropX, m.pos.y + 28);
		}
		if (
			updateFallingPoops(
				this.world,
				this.fallingPoops,
				this.poops,
				this.player,
				this.particles,
				this.level,
				dt,
				{
					onPlayerHit: (x, y) => {
						this.player.slamDown();
						this.state.poopTimer = POOP_LINGER;
						this.state.health -= POOP_DAMAGE;
						this.state.flawless.noDamage = false;
						this.emitHud();
						this.particles.burst(x, y, "dust", 5);
						if (this.state.health <= 0) this.beginDeath(true);
					},
					isDead: () => this.state.health <= 0,
				},
			)
		) {
			return;
		}
		updatePoops(this.world, this.poops, dt);
		this.fireflies.update(dt);
		this.motes.update(dt);

		// Float the health bar above the player's head.
		this.healthBar.update(
			this.player.pos.x,
			// Clear the head + horn/hat (which reach well above PLAYER_H).
			this.player.pos.y - PLAYER_H - 34,
			this.state.health,
		);

		// Invulnerability after a hit: count down and blink the player.
		if (this.state.invulnTimer > 0) {
			this.state.invulnTimer -= dt;
			this.player.view.alpha =
				Math.sin(this.state.invulnTimer * 30) > 0 ? 0.35 : 1;
			if (this.state.invulnTimer <= 0) this.player.view.alpha = 1;
		}

		// Fell into a pit (always a ghost death, even while invulnerable).
		if (this.player.fellOffWorld()) {
			this.state.flawless.noFalls = false;
			this.beginDeath();
			return;
		}

		if (
			resolveCollisions(this.state, {
				player: this.player,
				monsters: this.monsters,
				caticorns: this.caticorns,
				flutes: this.flutes,
				poops: this.poops,
				trampolines: this.trampolines,
				spikes: this.spikes,
				exit: this.exit,
				particles: this.particles,
				shake: this.shake,
				audio: this.audio,
				ctx,
				emitHud: () => this.emitHud(),
				takeHit: (amount) => this.takeHit(amount),
				beginDeath: (fatal) => this.beginDeath(fatal),
				clearLevel: () => this.clearLevel(),
			})
		) {
			return;
		}

		updateCamera(this.world, this.player.pos, this.level.worldWidth, dt);
		this.updateParallaxAndGlow(dt);
		this.state.waypointTimer = updateWaypoints(
			this.waypoints,
			this.caticorns,
			this.state.waypointTimer,
			this.world.x,
			dt,
		);
	}

	/**
	 * Scroll the parallax background layers and breathe the ambient glow clusters.
	 *
	 * Parallax maths: the gameplay world container is translated to `world.x`
	 * (≈ `-cameraX`), so gameplay content at local `lx` lands on screen at
	 * `world.x + lx` — it scrolls at the FULL camera rate. The bg layers also live
	 * inside `world`, so a layer at offset `layer.x` lands at `world.x + layer.x`.
	 * To make a layer's net scroll only a fraction `f` of the camera we want its
	 * on-screen motion to be `-cameraX * f`, i.e. `world.x * f`. Since the world
	 * already contributes `world.x`, the compensating offset is:
	 *
	 *   layer.x = world.x * f - world.x = -world.x * (1 - f)
	 *
	 * At camera 0 (`world.x` = 0) all offsets are 0 and everything aligns. As the
	 * camera pans (`world.x` grows negative) far gets the LARGEST positive offset
	 * (1 - 0.15 = 0.85) so it lags most (moves least net); near gets the smallest
	 * (1 - 0.6 = 0.4) so it moves most. far < mid < near < gameplay. Deterministic
	 * (driven purely by camera position).
	 */
	private updateParallaxAndGlow(dt: number): void {
		const wx = this.world.x;
		this.bgLayers.far.x = -wx * (1 - 0.15);
		this.bgLayers.mid.x = -wx * (1 - 0.35);
		this.bgLayers.near.x = -wx * (1 - 0.6);

		// Breathe the glow clusters from a deterministic phase accumulator (no
		// wall-clock). Each cluster's own staggered phase keeps them out of sync.
		this.glowPhase += dt;
		for (const glow of this.glows) {
			const pulse = (Math.sin(this.glowPhase * 1.4 + glow.phase) + 1) / 2;
			glow.view.scale.set(0.92 + pulse * 0.16);
			glow.view.alpha = 0.75 + pulse * 0.25;
		}
	}

	// --- Damage / death ---

	/**
	 * Take a hit for `amount` health in place (no ghost, no respawn) with a brief
	 * invulnerability window. If health runs out, fall through to the ghost death
	 * + game over.
	 *
	 * @returns true if the run ended (caller should stop this frame's update).
	 */
	private takeHit(amount: number): boolean {
		this.state.health -= amount;
		this.state.flawless.noDamage = false;
		this.emitHud();
		if (this.state.health <= 0) {
			this.beginDeath(true);
			return true;
		}
		this.audio.hurt();
		this.shake.add(4);
		this.state.freezeTimer = FREEZE_STOMP;
		this.state.invulnTimer = INVULN_TIME;
		return false;
	}

	/**
	 * Ghost death: falling down a hole costs FALL_DAMAGE then respawns at the
	 * level start (if any health remains); a fatal hit ends the run. Plays the
	 * floating-ghost animation; the outcome is resolved in updateDeath().
	 *
	 * @param fatal When true, the run is already over (health spent elsewhere).
	 */
	private beginDeath(fatal = false): void {
		if (!fatal) {
			this.state.health -= FALL_DAMAGE;
			this.emitHud();
		}
		this.audio.hurt();
		this.shake.add(7);
		this.state.freezeTimer = FREEZE_DEATH;
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

		// Animation done: respawn if any health remains, else end the run.
		this.world.removeChild(this.death.ghost);
		this.death.ghost.destroy({ children: true });
		this.death = null;

		if (this.state.health <= 0) {
			this.status = "lost";
			this.emitHud();
			return;
		}
		this.player.respawn(this.level.spawn);
		this.player.view.visible = true;
		this.state.invulnTimer = INVULN_TIME;
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

	/** Push current state into the in-canvas HUD (called on events + each frame). */
	/** Push the live HUD readouts to the DOM bar (called every frame for the
	 * timer). Thin wrapper kept for the per-frame call site. */
	private refreshHud(): void {
		this.emitHud();
	}

	private emitHud(): void {
		if (!this.level) return;
		const rescued = this.caticorns.filter((c) => c.rescued).length;
		const toRescue = this.caticorns.length;

		// The HUD bar (level / rescued / score / timer) and the win-lose flow both
		// live in the DOM now, driven entirely by this state push.
		this.onHud({
			level: this.levelIndex + 1,
			levelName: this.level.name,
			totalLevels: this.levels.length,
			rescued,
			toRescue,
			health: this.state.health,
			status: this.status,
			totalRescued: this.state.totalRescued,
			elapsed: this.elapsed,
			score: this.state.score,
			flawless: { ...this.state.flawless },
		});
	}
}
