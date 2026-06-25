/**
 * Centralised gameplay / physics / timing tuning constants.
 *
 * Art colours live in art/; types.ts constants (GRAVITY, JUMP_VELOCITY,
 * TRAMPOLINE_VELOCITY, GAME_WIDTH/HEIGHT, GROUND_Y, PLAYER_W/H) stay in
 * types.ts. Everything else that was scattered as named top-level `const` or
 * `private static readonly` across the game files lives here.
 */

// --- Player movement ---

/** Horizontal acceleration when a direction is held (px/sec^2). */
export const ACCEL = 2600;
/** Horizontal deceleration applied as friction when no input (px/sec^2). */
export const FRICTION = 2200;

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
