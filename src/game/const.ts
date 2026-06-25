/**
 * Centralised gameplay / physics / timing tuning constants.
 *
 * Art colours live in art/; types.ts constants (GRAVITY, JUMP_VELOCITY,
 * TRAMPOLINE_VELOCITY, GAME_WIDTH/HEIGHT, GROUND_Y, PLAYER_W/H) stay in
 * types.ts. Everything else that was scattered as named top-level `const` or
 * `private static readonly` across the game files lives here.
 */

import type { AmbientKind, ThemeStyle } from "./level/themes";

// --- Player movement ---

/** Horizontal acceleration when a direction is held (px/sec^2). */
export const ACCEL = 2600;
/** Horizontal deceleration applied as friction when no input (px/sec^2). */
export const FRICTION = 2200;

/**
 * Friction multiplier applied in ice caves. Scales down the base {@link FRICTION}
 * so the player decelerates much more slowly, giving a slippery sliding feel.
 * Only deceleration is affected — ACCEL, max speed, jump and gravity are unchanged,
 * so the reachability solver's jump-height and gap-clearance assumptions remain valid.
 */
export const ICE_FRICTION_SCALE = 0.35;

/**
 * Upward velocity (px/sec, negative = up) given to the player when they land
 * on the ground in a grove cave. Kept small so it is a pleasant springiness,
 * never strong enough to fling the player into a ceiling spike. Reach-neutral:
 * the solver checks jump height off the ground using JUMP_VELOCITY, not
 * incidental bounce contacts.
 */
export const GROVE_BOUNCE_VELOCITY = -110;

/**
 * Minimum downward speed (px/sec) required for the grove ground bounce to
 * trigger. Prevents a tiny float-in from spawning an unwanted hop.
 */
export const GROVE_BOUNCE_MIN_SPEED = 80;

/**
 * Probability (0..1) of placing a stalactite spike at each ceiling candidate
 * position in molten caves, in addition to the base spike pass. Higher than the
 * normal pass probability so molten feels hazard-dense. The existing
 * {@link ceilingNoGo} exclusion zones still apply, keeping forced jump arcs clear.
 * Reach-neutral: spikes are lethal obstacles, not physics constraints, so the
 * solver's gap/height checks are unaffected.
 */
export const MOLTEN_SPIKE_DENSITY = 0.65;

/** Grace window after leaving a ledge where a ground jump still fires (s). */
export const COYOTE_TIME = 0.1;
/** Window before landing within which a jump press is remembered + fired (s). */
export const JUMP_BUFFER = 0.1;
/** Upward-velocity multiplier when the jump key is released early (jump-cut). */
export const JUMP_CUT = 0.45;

/** Ground jump + one air jump. */
export const MAX_JUMPS = 2;

/** Below this |vy|, gravity is softened for a floaty apex hang. */
export const APEX_THRESHOLD = 90;
/** Gravity multiplier near the jump apex (hang) and while falling (snappier). */
export const APEX_GRAVITY = 0.6;
export const FALL_GRAVITY = 1.45;

/** |vel.x| under which the player counts as standing still (for idle breathing). */
export const IDLE_SPEED_THRESHOLD = 6;
/** Idle breathing angular speed (radians/sec) — slow, calm bob. */
export const IDLE_BREATH_SPEED = 3.2;
/** Idle breathing amplitude as a fraction of scale.y (very subtle). */
export const IDLE_BREATH_AMPLITUDE = 0.03;

// --- Combat / damage ---

/** Health is 0..1. Starting health and damage/heal fractions. */
export const START_HEALTH = 1;
export const FALL_DAMAGE = 1 / 3;
export const HIT_DAMAGE = 1 / 5;
export const FLUTE_HEAL = 1 / 5;
/** Damage from a falling poop landing on the player's head. */
export const POOP_DAMAGE = 1 / 10;

/**
 * How far the player's feet may sit below a monster's top and still count as a
 * stomp rather than a side hit, in pixels.
 */
export const STOMP_TOLERANCE = 14;
/** Vertical tolerance for landing a stomp on a cage roof, in px. */
export const CAGE_STOMP_TOLERANCE = 18;

/** Upward hop given to the player after a successful stomp. */
export const STOMP_BOUNCE = -380;

/** Invulnerability window after a monster hit, in seconds. */
export const INVULN_TIME = 1;

// --- Hit-stop / freeze ---

/** Hit-stop freeze on a stomp (s) — a short punchy pause. */
export const FREEZE_STOMP = 0.06;
/** Hit-stop freeze on death (s) — longer for weight. */
export const FREEZE_DEATH = 0.12;

// --- Death animation ---

/** Seconds the death ghost animation plays before respawn / game-over. */
export const DEATH_ANIM_TIME = 1.1;

// --- Poop hazard ---

/** Horizontal velocity multiplier while standing on a poop. */
export const POOP_SLOW = 0.55;
/** Seconds the poop slow + brown feet linger after leaving the poop. */
export const POOP_LINGER = 1;
/** Seconds a ground poop lasts before fading out and disappearing. */
export const POOP_LIFE = 5;
/** Collision box (centred on poop's bottom-centre) used for the slow zone. */
export const POOP_BOX = { halfWidth: 14, height: 22 };

// --- Simulation loop (fixed timestep) ---

/**
 * Fixed simulation step, in seconds. The whole sim (player, monsters,
 * collisions, particles, timers, camera, parallax) advances in constant
 * increments of this size, decoupled from the render frame rate, so behaviour
 * and determinism are identical regardless of the monitor's refresh rate.
 *
 * 1/120 s (≈8.33 ms) is chosen over 1/60: it is a clean divisor of common
 * refresh rates (60/120/144 Hz all consume a whole number of steps most
 * frames), keeps the per-step dt small enough that the previous variable-dt
 * feel is preserved (it sits well under the old 0.05 s clamp, and was always
 * ~1/60 at 60 Hz so two steps reproduce one old frame closely), and gives
 * higher temporal resolution to the integrator for a touch more stability on
 * fast jumps without changing any tuning constants.
 */
export const FIXED_DT = 1 / 120;
/**
 * Maximum real time (seconds) consumed by the accumulator in a single rendered
 * frame. Caps how many fixed steps one frame may run so a long stall (tab
 * refocus, GC pause, breakpoint) can never trigger a "spiral of death" where
 * the sim tries to catch up forever. Leftover time beyond this is dropped.
 * 0.25 s ≈ up to 30 fixed steps per frame.
 */
export const MAX_FRAME_TIME = 0.25;

// --- Camera ---

/** Camera follow smoothing factor (per second); higher = snappier. */
export const CAMERA_LERP = 8;
/** Min downward landing speed (px/sec) that triggers a hard-landing shake. */
export const HARD_LAND_SPEED = 520;

// --- UI / waypoints ---

/** Seconds the "you missed someone" waypoint arrows stay visible. */
export const WAYPOINT_TIME = 3;

// --- Caticorn ---

/** Idle bob amplitude in pixels. */
export const CATICORN_BOB_AMPLITUDE = 4;
/** Bob angular speed in radians/sec. */
export const CATICORN_BOB_SPEED = 2.5;
/** Upward drift speed once rescued, in px/sec (cheerful escape). */
export const RESCUE_FLOAT_SPEED = 70;
/** Captive caticorns are drawn a bit smaller than the hero. */
export const CATICORN_SCALE = 0.8;
/** Seconds a broken binding (cage/shackle) takes to fade out. */
export const BINDING_FADE = 0.5;

// --- Monster: Bat ---

/** Vertical bob amplitude in pixels. */
export const BAT_BOB_AMPLITUDE = 22;
/** Bob angular speed in radians/sec. */
export const BAT_BOB_SPEED = 3;

// --- Monster: Lurker ---

/** Seconds between poop drops. */
export const LURKER_DROP_INTERVAL = 3.2;
/** Gentle horizontal sway amplitude in px. */
export const LURKER_SWAY = 10;

// --- Particles ---

/** Hard cap on live particles so bursts can never flood the scene. */
export const MAX_PARTICLES = 120;
/** Lifetime of a spawned particle, in seconds. */
export const PARTICLE_LIFE = 0.5;

// --- Rescue burst polish ---

/** Total celebratory particles (star + spark mix) emitted when a cat is freed. */
export const RESCUE_BURST_COUNT = 18;
/**
 * Hard cap on live rescue rings. Kept tiny and in its own pool so the expanding
 * ring never competes with gameplay bursts for the {@link MAX_PARTICLES} budget.
 */
export const MAX_RINGS = 4;
/** Seconds the expanding rescue ring takes to scale up + fade out. */
export const RING_LIFE = 0.5;
/** Final scale multiplier the rescue ring grows to before vanishing. */
export const RING_MAX_SCALE = 4;

// --- Landing dust ---

/** Base dust specks on a hard landing (before the impact-speed bonus). */
export const LAND_DUST_BASE = 4;
/** Extra dust specks added at the very hardest landing (scaled by impact). */
export const LAND_DUST_BONUS = 6;
/** Impact speed (px/sec) at/above which the full dust bonus is awarded. */
export const LAND_DUST_FULL_SPEED = 1400;

// --- Ambient cave motes ---

/** Number of slow-drifting ambient motes kept alive in the world per level. */
export const MOTE_COUNT = 12;
/** Vertical drift speed of a mote (px/sec, gently upward). */
export const MOTE_RISE_SPEED = 9;
/** Horizontal sway amplitude of a mote (px). */
export const MOTE_SWAY = 14;
/** Peak alpha of an ambient mote (very faint atmosphere). */
export const MOTE_ALPHA = 0.5;

// --- Per-theme ambient lighting ---

/**
 * Ambient night-overlay tint and intensity per {@link ThemeStyle}.
 *
 * `color` is the fill colour of the full-screen night overlay (a PixiJS
 * 0xRRGGBB integer). `intensity` is the peak alpha multiplier applied on top
 * of the (1-cos)/2 wave — higher means darker / eerier at full night. Keep
 * all values subtle so gameplay stays readable and caticorns pop.
 *
 * Rough targets:
 *  - blossom: soft warm-pink dusk (romantic, gentle).
 *  - crystal: cool violet shimmer (magical cave).
 *  - ice:     cold pale-blue wash (frozen stillness).
 *  - crypt:   sickly desaturated green, slightly darker (eerie, oppressive).
 *  - grove:   deep teal-green (humid jungle cave).
 *  - molten:  warm orange-red glow (heat haze rising from lava).
 */
export interface NightLighting {
	/** 0xRRGGBB fill colour for the night overlay rectangle. */
	color: number;
	/** Peak alpha multiplier (replaces the hard-coded 0.4 for all themes). */
	intensity: number;
}

export const NIGHT_LIGHTING: Record<ThemeStyle, NightLighting> = {
	blossom: { color: 0x3a1028, intensity: 0.32 }, // warm pink dusk
	crystal: { color: 0x1a0a38, intensity: 0.36 }, // cool violet shimmer
	ice: { color: 0x081828, intensity: 0.34 }, // cold pale blue wash
	crypt: { color: 0x071510, intensity: 0.46 }, // sickly green, eerier
	grove: { color: 0x051a10, intensity: 0.38 }, // deep teal-green
	molten: { color: 0x2a0a04, intensity: 0.3 }, // warm orange-red glow
};

// --- Themed ambient drifters ---

/**
 * Per-{@link AmbientKind} motion profile for the ambient drifter layer (see
 * systems/Motes.ts). `dir` is the vertical travel sense (+1 falls down, -1
 * rises, 0 stays put and only twinkles); `speed` is the vertical travel speed
 * (px/sec, magnitude); `sway` is the horizontal sine amplitude (px); `alpha` is
 * peak opacity. All deterministic — the system advances phase by the clamped dt.
 *
 * Tuned so each cave reads distinctly: petals + snow fall gently with sway,
 * embers rise, fog drifts slow with wide sideways sway, gemsparkle + spore
 * mostly twinkle in place with a touch of drift.
 */
export interface AmbientProfile {
	/** Vertical travel sense: +1 falls down, -1 rises, 0 stays put + twinkles. */
	dir: 1 | -1 | 0;
	/** Vertical travel speed (px/sec, magnitude). */
	speed: number;
	/** Horizontal sine sway amplitude (px). */
	sway: number;
	/** Peak opacity. */
	alpha: number;
}

export const AMBIENT_PROFILES: Record<AmbientKind, AmbientProfile> = {
	petal: { dir: 1, speed: 26, sway: 22, alpha: 0.85 },
	snow: { dir: 1, speed: 20, sway: 16, alpha: 0.8 },
	ember: { dir: -1, speed: 30, sway: 14, alpha: 0.85 },
	fog: { dir: 1, speed: 6, sway: 40, alpha: 0.6 },
	gemsparkle: { dir: 0, speed: 8, sway: 6, alpha: 0.7 },
	spore: { dir: -1, speed: 10, sway: 18, alpha: 0.7 },
};

/** Number of themed ambient drifters kept alive in the world per level. */
export const AMBIENT_COUNT = 14;
/** Vertical span (px) a drifter travels before wrapping back to its start. */
export const AMBIENT_TRAVEL_SPAN = 320;
/** Twinkle (alpha-pulse) angular speed for in-place ambient kinds (rad/sec). */
export const AMBIENT_TWINKLE_SPEED = 2.4;

// --- Exit beckon ---

/** Seconds between exit-beckon sparkle emissions while the exit is unlocked. */
export const BECKON_INTERVAL = 0.4;
/** Sparkles emitted per beckon pulse. */
export const BECKON_COUNT = 2;
