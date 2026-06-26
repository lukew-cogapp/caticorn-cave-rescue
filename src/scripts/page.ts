/**
 * Page boot + DOM <-> engine bridge for the Caticorn Cave Rescue start page.
 *
 * This is the entire client-side controller for `index.astro`: it boots the
 * Pixi game, renders the title/hero/character-select Pixi previews, wires the
 * nipplejs touch controls + fullscreen, drives the DOM HUD bar and win/lose
 * overlay, and starts a run. The markup it drives lives in `index.astro` and
 * its components; this module only looks elements up by id.
 */
import nipplejs from "nipplejs";
import { Application } from "pixi.js";
import { drawPlayer, type PlayerVariant } from "../game/art";
import { bootGame, CHARACTERS, type HudState } from "../game/caticorn";
import { buildShowcaseLevels } from "../game/levels";
import { EN } from "../game/strings/en";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const stage = document.getElementById("game-stage") as HTMLDivElement;
const fsBtn = document.getElementById("fullscreen-btn") as HTMLButtonElement;
const overlay = document.getElementById("overlay") as HTMLDivElement;
const overlayTitle = document.getElementById("overlay-title") as HTMLElement;
const overlaySub = document.getElementById("overlay-sub") as HTMLElement;
const flawlessBadge = document.getElementById(
	"flawless-badge",
) as HTMLDivElement;
const achievementsBox = document.getElementById(
	"achievements",
) as HTMLDivElement;
const restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;
const startScreen = document.getElementById("start-screen") as HTMLDivElement;
const cardsWrap = document.getElementById("char-cards") as HTMLDivElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;

// The level / rescued / score readouts live in a DOM bar ABOVE the canvas
// (so they never overlap gameplay). This callback drives that bar plus the
// win/lose overlay.
const runSummary = document.getElementById(
	"run-summary",
) as HTMLParagraphElement;
const hudBar = document.getElementById("hud-bar");
const hudLevel = document.getElementById("hud-level");
const hudRescued = document.getElementById("hud-rescued");
const hudScore = document.getElementById("hud-score");
const hudTimeVal = document.getElementById("hud-time-val");

/** Format seconds as m:ss. */
function formatTime(seconds: number): string {
	const s = Math.floor(seconds);
	const m = Math.floor(s / 60);
	return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function renderHud(s: HudState) {
	// HUD updates must never throw: this is the engine's onHud callback, so an
	// exception here would kill the sim loop and freeze the game. Guard each DOM
	// write with optional chaining so a missing element degrades gracefully.
	// Live score bar, shown only while playing.
	if (s.status === "playing") {
		const name = EN.levels[s.levelName] ?? s.levelName;
		if (hudLevel)
			hudLevel.textContent = EN.hudLevel(name, s.level, s.totalLevels);
		if (hudRescued)
			hudRescued.textContent = EN.hudRescued(s.rescued, s.toRescue);
		if (hudScore) hudScore.textContent = EN.hudScore(s.score);
		if (hudTimeVal) hudTimeVal.textContent = formatTime(s.elapsed);
		hudBar?.classList.remove("hidden");
		hudBar?.classList.add("flex");
	} else {
		hudBar?.classList.add("hidden");
		hudBar?.classList.remove("flex");
	}
	if (s.status === "playing") {
		overlay.classList.add("hidden");
		overlay.classList.remove("flex");
		setTouchControls(true);
		return;
	}
	setTouchControls(false);
	if (s.status === "lost") {
		// Out of lives: go back to the character-select screen with a summary
		// of how the run went, so the player can pick a hero and try again.
		runSummary.textContent = EN.runSummary(
			s.totalRescued,
			formatTime(s.elapsed),
		);
		runSummary.classList.remove("hidden");
		startScreen.classList.remove("hidden");
		startScreen.classList.add("flex");
		overlay.classList.add("hidden");
		overlay.classList.remove("flex");
		return;
	}
	// Won: celebrate on the in-canvas overlay.
	overlay.classList.remove("hidden");
	overlay.classList.add("flex");
	overlayTitle.textContent = EN.wonTitle;
	overlaySub.textContent = EN.wonSub;
	// Achievements: show each feat the player actually held this run, and the
	// FLAWLESS badge only when all four held.
	const f = s.flawless;
	let earned = 0;
	for (const li of achievementsBox.querySelectorAll<HTMLElement>(
		"[data-feat]",
	)) {
		const held = f[li.dataset.feat as keyof typeof f] === true;
		if (held) {
			li.dataset.earned = "";
			earned++;
		} else {
			delete li.dataset.earned;
		}
	}
	achievementsBox.classList.toggle("hidden", earned === 0);
	const flawless = f.noDamage && f.noKills && f.noFalls && f.noPoop;
	flawlessBadge.classList.toggle("hidden", !flawless);
}

const game = await bootGame(canvas, renderHud);

// Render a drawn caticorn (not an emoji) into a small canvas.
async function renderSpriteInto(
	c: HTMLCanvasElement,
	variant: PlayerVariant,
	bottomY: number,
) {
	const a = new Application();
	await a.init({
		canvas: c,
		width: c.width,
		height: c.height,
		backgroundAlpha: 0,
		antialias: true,
	});
	const s = drawPlayer(variant);
	s.x = c.width / 2;
	s.y = bottomY;
	a.stage.addChild(s);
}
const heroCanvas = document.getElementById("hero-sprite") as HTMLCanvasElement;
await renderSpriteInto(heroCanvas, "quinn", 90);

// Render the game at the stage's actual pixel size so it always fills the
// box crisply (rather than CSS-upscaling a fixed 800x450 canvas).
function fitToStage() {
	if (document.fullscreenElement === stage) return; // fullscreen handles itself
	const rect = stage.getBoundingClientRect();
	if (rect.width > 0 && rect.height > 0) {
		game.resize(rect.width, rect.height);
	}
}
new ResizeObserver(fitToStage).observe(stage);
fitToStage();

// --- Character select ---
let chosen: PlayerVariant | null = null;
const cardEls = new Map<PlayerVariant, HTMLButtonElement>();

// Build all cards + render every Pixi preview in parallel. The boot skeleton
// (covering the whole stage) stays up until they're all ready, so the start
// interface appears complete in one go rather than popping in piecemeal.
const previewReady: Promise<void>[] = [];

for (const c of CHARACTERS) {
	const card = document.createElement("button");
	card.type = "button";
	card.dataset.variant = c.id;
	// Responsive card sizing across four tiers, expressed as Tailwind
	// arbitrary-variant utilities. The original <style> block layered tier 3 on
	// top of tier 2 at wide+short viewports and relied on CSS source order to
	// resolve them. Tailwind sorts generated @media blocks by breakpoint, not by
	// authoring order, so instead the tiers are made mutually exclusive (tier 2
	// is bounded to <1024px wide). Each tier therefore lists every property it
	// needs, including tier 3's gap (which the old tier 3 inherited from tier 2).
	// The computed size at every viewport is identical to the original.
	//   base                       small / mobile
	//   [≥640w & 640–1023w & ≤800h] medium screens, short viewport
	//   [≥1024w & ≤800h]            wide laptops, short viewport
	//   [≥640w & ≥801h]             medium+ screens, tall viewport (full size)
	card.className =
		"char-card group flex flex-col items-center rounded-2xl border-2 border-white/15 bg-white/5 transition hover:border-white/40 hover:bg-white/10 " +
		"w-20 gap-1 p-1.5 " +
		"[@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:w-30 [@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:gap-1.5 [@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:p-2 " +
		"[@media(min-width:1024px)_and_(max-height:800px)]:w-34 [@media(min-width:1024px)_and_(max-height:800px)]:gap-1.5 [@media(min-width:1024px)_and_(max-height:800px)]:p-2.5 " +
		"[@media(min-width:640px)_and_(min-height:801px)]:w-36 [@media(min-width:640px)_and_(min-height:801px)]:gap-2 [@media(min-width:640px)_and_(min-height:801px)]:p-3";

	const preview = document.createElement("canvas");
	preview.width = 180;
	preview.height = 180;
	preview.className =
		"char-preview " +
		"w-16 h-16 " +
		"[@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:w-26 [@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:h-26 " +
		"[@media(min-width:1024px)_and_(max-height:800px)]:w-29 [@media(min-width:1024px)_and_(max-height:800px)]:h-29 " +
		"[@media(min-width:640px)_and_(min-height:801px)]:w-32 [@media(min-width:640px)_and_(min-height:801px)]:h-32";
	card.appendChild(preview);

	const name = document.createElement("span");
	name.textContent = c.name;
	name.className =
		"char-name font-bold " +
		"text-xs " +
		"[@media(min-width:640px)_and_(max-width:1023px)_and_(max-height:800px)]:text-sm " +
		"[@media(min-width:1024px)_and_(max-height:800px)]:text-base " +
		"[@media(min-width:640px)_and_(min-height:801px)]:text-lg";
	name.style.color = c.color;
	card.appendChild(name);

	card.addEventListener("click", () => select(c.id));
	cardsWrap.appendChild(card);
	cardEls.set(c.id, card);

	previewReady.push(
		(async () => {
			const app = new Application();
			await app.init({
				canvas: preview,
				width: 180,
				height: 180,
				backgroundAlpha: 0,
				antialias: true,
				resolution: 2,
				autoDensity: true,
			});
			const sprite = drawPlayer(c.id);
			sprite.scale.set(2);
			sprite.x = 90;
			sprite.y = 168; // bottom-centre origin sits near the bottom
			app.stage.addChild(sprite);
		})(),
	);
}

// Reveal the whole start interface at once: drop the boot skeleton once the
// game has booted and every character preview has rendered.
const bootSkeleton = document.getElementById("boot-skeleton");
Promise.all(previewReady).then(() => {
	bootSkeleton?.remove();
});

function select(variant: PlayerVariant) {
	chosen = variant;
	startBtn.disabled = false;
	for (const [id, card] of cardEls) {
		const active = id === variant;
		card.classList.toggle("border-amber-400", active);
		card.classList.toggle("bg-white/15", active);
		card.classList.toggle("ring-2", active);
		card.classList.toggle("ring-amber-400", active);
	}
}

// Start on the first character with the highlight ring already shown.
select(CHARACTERS[0].id);

/** When set (debug level-select), the run uses this fixed seed + start level so
 * the chosen level index maps to a stable, known theme. */
let debugStartLevel: number | null = null;

function beginRun() {
	if (!chosen) return;
	runSummary.classList.add("hidden");
	startScreen.classList.add("hidden");
	startScreen.classList.remove("flex");
	// On touch devices, use this Start tap (a user gesture) to go fullscreen
	// and lock landscape for a proper mobile play experience.
	if (
		isTouch &&
		!document.fullscreenElement &&
		typeof stage.requestFullscreen === "function"
	) {
		stage.requestFullscreen().catch(() => {
			/* unsupported (iOS Safari) — fall back to the 80vh canvas */
		});
	}
	if (debugStartLevel !== null) {
		// Debug: showcase mode = one level per theme (all of them), jump straight
		// to the picked theme's level.
		game.start(chosen, DEBUG_SEED, debugStartLevel, true);
	} else {
		// Fresh seed per run so cave layouts differ each playthrough. Chosen in
		// the DOM (random allowed here) and handed to the deterministic generator.
		game.start(chosen, Math.floor(Math.random() * 1e9) + 1);
	}
	stage.focus();
}

startBtn.addEventListener("click", beginRun);

// --- Debug level select (only with ?debug=true) ---
// Fixed seed so the level index maps to a known, stable theme set; buttons jump
// straight to a level for quick testing. Defaults the hero to the first one so a
// pick can run without choosing a card.
const DEBUG_SEED = 1000;
if (new URLSearchParams(location.search).get("debug") === "true") {
	const panel = document.createElement("div");
	panel.className =
		"mt-3 flex w-full max-w-md flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-rose-950/40 px-3 py-2 text-xs ring-1 ring-rose-400/30";
	const label = document.createElement("span");
	label.className = "w-full text-center font-bold text-rose-200";
	label.textContent = "🐛 debug — jump to level";
	panel.appendChild(label);
	const levels = buildShowcaseLevels(DEBUG_SEED);
	levels.forEach((lvl, i) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className =
			"rounded-lg bg-rose-400/20 px-2.5 py-1 font-semibold text-rose-100 hover:bg-rose-400/40";
		b.textContent = `${i + 1}. ${EN.levels[lvl.name] ?? lvl.name}`;
		b.addEventListener("click", () => {
			if (!chosen) chosen = CHARACTERS[0].id;
			debugStartLevel = i;
			beginRun();
		});
		panel.appendChild(b);
	});
	startScreen.appendChild(panel);
}

// Keyboard navigation on the start screen: arrows move the selection ring,
// space / enter begins the run. Only active while the start screen is shown.
window.addEventListener("keydown", (e) => {
	if (startScreen.classList.contains("hidden")) return;
	const ids = CHARACTERS.map((c) => c.id);
	const i = chosen ? ids.indexOf(chosen) : 0;
	const k = e.key.toLowerCase();
	if (e.key === "ArrowRight" || e.key === "ArrowDown" || k === "d") {
		e.preventDefault();
		select(ids[(i + 1) % ids.length]);
	} else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || k === "a") {
		e.preventDefault();
		select(ids[(i - 1 + ids.length) % ids.length]);
	} else if (e.key === " " || e.key === "Enter") {
		e.preventDefault();
		beginRun();
	}
});

restartBtn.addEventListener("click", () => game.restart());

// "Return to start": from the win/lose overlay back to character select. Hides
// the overlay + touch controls and re-shows the start screen; the next pick +
// Start begins a fresh run.
const toStartBtn = document.getElementById("to-start-btn");
toStartBtn?.addEventListener("click", () => {
	overlay.classList.add("hidden");
	overlay.classList.remove("flex");
	setTouchControls(false);
	runSummary.classList.add("hidden");
	startScreen.classList.remove("hidden");
	startScreen.classList.add("flex");
});

// --- Touch controls ---
// The engine listens for keyboard events on window, so on-screen buttons
// just synthesize the matching key down/up. Shown only on touch devices.
const touchControls = document.getElementById(
	"touch-controls",
) as HTMLDivElement;
const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
// The touch overlay covers the whole stage, so only enable it DURING play
// (otherwise its zones would swallow start-screen / overlay taps). Toggled by
// renderHud on status changes.
function setTouchControls(on: boolean) {
	if (!isTouch) return;
	touchControls.classList.toggle("hidden", !on);
}

// iOS Safari doesn't support the Fullscreen API on non-video elements, so the
// fullscreen button can't work there. Hide it rather than show a dead button;
// the 80vh canvas + touch controls + rotate hint cover mobile play instead.
const fullscreenSupported =
	typeof stage.requestFullscreen === "function" &&
	(document.fullscreenEnabled ?? false);
if (!fullscreenSupported) {
	fsBtn.classList.add("hidden");
}

// Synthesize key up/down for the engine (which listens on window).
function keyDown(key: string) {
	window.dispatchEvent(new KeyboardEvent("keydown", { key }));
}
function keyUp(key: string) {
	window.dispatchEvent(new KeyboardEvent("keyup", { key }));
}

// --- Virtual joystick (left zone) + jump (right zone) ---
// nipplejs renders a dynamic thumbstick: touch anywhere in the left zone and a
// stick spawns under the thumb. We map its horizontal angle to held left/right
// (a digital direction, so over-dragging never cancels movement — the engine
// moves at a fixed speed). The right zone is a plain jump hold. Move + jump are
// independent fingers (multi-touch). nipplejs is imported dynamically so it
// only loads on touch devices.
const moveZone = document.getElementById("touch-move-zone") as HTMLDivElement;
const jumpZone = document.getElementById("touch-jump-zone") as HTMLDivElement;

let heldDir: "ArrowLeft" | "ArrowRight" | null = null;
function setDir(dir: "ArrowLeft" | "ArrowRight" | null) {
	if (dir === heldDir) return;
	if (heldDir) keyUp(heldDir);
	heldDir = dir;
	if (heldDir) keyDown(heldDir);
}

// Control style: "joystick" (nipplejs virtual stick) or "buttons" (plain
// left/right D-pad). Remembered across sessions in localStorage so the player
// only picks once. Default to the joystick.
const CONTROL_PREF_KEY = "caticorn:touch-control";
type ControlMode = "joystick" | "buttons";
function readControlMode(): ControlMode {
	return localStorage.getItem(CONTROL_PREF_KEY) === "buttons"
		? "buttons"
		: "joystick";
}

// nipplejs is created lazily the first time joystick mode is active (creating it
// against a hidden zone gives it a zero-size area). Once made, we just keep it.
let joystick: ReturnType<typeof nipplejs.create> | null = null;
function ensureJoystick() {
	if (joystick) return;
	joystick = nipplejs.create({
		zone: moveZone,
		mode: "dynamic",
		// Soft translucent white so the stick is subtle, not a bright yellow blob.
		color: "rgba(255, 255, 255, 0.35)",
		size: 110,
		threshold: 0.25, // fraction of the radius before a direction registers
		restJoystick: true,
	});
	// nipplejs's `.on` overloads are over-narrow for our event names, so bind
	// through a loosened handle.
	const on = (
		joystick as unknown as {
			on(ev: string, cb: (...args: unknown[]) => void): void;
		}
	).on.bind(joystick);
	// Map stick movement to a digital left/right. nipplejs calls the handler with
	// a single { type, target, data } object — the joystick output (vector etc.)
	// is on `.data`, NOT a second argument. Reading the wrong arg was why the
	// stick moved visually but never moved the player. Using the live vector each
	// move means dragging further only sustains the direction, never stops it.
	on("move", (...args: unknown[]) => {
		const evt = args[0] as {
			data?: { vector?: { x: number; y: number } };
		};
		const x = evt?.data?.vector?.x ?? 0;
		if (x <= -0.3) setDir("ArrowLeft");
		else if (x >= 0.3) setDir("ArrowRight");
		else setDir(null);
	});
	on("end", () => setDir(null));
	on("dir:left", () => setDir("ArrowLeft"));
	on("dir:right", () => setDir("ArrowRight"));
}

// Plain left/right buttons: press holds the direction, release/leave clears it.
const dpad = document.getElementById("touch-dpad") as HTMLDivElement;
if (isTouch) {
	for (const [id, dir] of [
		["touch-left", "ArrowLeft"],
		["touch-right", "ArrowRight"],
	] as const) {
		const btn = document.getElementById(id) as HTMLButtonElement;
		btn.addEventListener(
			"touchstart",
			(e) => {
				e.preventDefault();
				setDir(dir);
			},
			{ passive: false },
		);
		const clear = (e: TouchEvent) => {
			e.preventDefault();
			setDir(null);
		};
		btn.addEventListener("touchend", clear, { passive: false });
		btn.addEventListener("touchcancel", clear, { passive: false });
	}
}

// Switch between joystick and D-pad: show one set of controls, hide the other,
// and stop any held direction so a swap can't leave the player stuck moving.
function applyControlMode(mode: ControlMode) {
	if (!isTouch) return;
	setDir(null);
	const useButtons = mode === "buttons";
	moveZone.classList.toggle("hidden", useButtons);
	dpad.classList.toggle("hidden", !useButtons);
	dpad.classList.toggle("flex", useButtons);
	if (!useButtons) ensureJoystick();
}
applyControlMode(readControlMode());

// Wire up the start-screen control-style picker (touch only). Pills reflect the
// stored choice; tapping one persists + applies it.
if (isTouch) {
	const pref = document.getElementById("control-pref") as HTMLDivElement;
	pref.classList.remove("hidden");
	pref.classList.add("flex");
	const pills = pref.querySelectorAll<HTMLButtonElement>("[data-control]");
	function syncPills(mode: ControlMode) {
		for (const pill of pills) {
			pill.dataset.active = String(pill.dataset.control === mode);
		}
	}
	for (const pill of pills) {
		pill.addEventListener("click", () => {
			const mode = pill.dataset.control as ControlMode;
			localStorage.setItem(CONTROL_PREF_KEY, mode);
			syncPills(mode);
			applyControlMode(mode);
		});
	}
	syncPills(readControlMode());
}

// Jump zone: any touch on the right half holds jump until released.
let jumpTouches = 0;
jumpZone.addEventListener(
	"touchstart",
	(e: TouchEvent) => {
		e.preventDefault();
		jumpTouches += e.changedTouches.length;
		keyDown("ArrowUp");
	},
	{ passive: false },
);
function onJumpEnd(e: TouchEvent) {
	e.preventDefault();
	jumpTouches = Math.max(0, jumpTouches - e.changedTouches.length);
	if (jumpTouches === 0) keyUp("ArrowUp");
}
jumpZone.addEventListener("touchend", onJumpEnd, { passive: false });
jumpZone.addEventListener("touchcancel", onJumpEnd, { passive: false });

// --- Fullscreen ---
function syncFullscreenSize() {
	if (document.fullscreenElement === stage) {
		game.resize(window.innerWidth, window.innerHeight);
	} else {
		fitToStage();
	}
}

fsBtn.addEventListener("click", () => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else {
		stage.requestFullscreen().catch(() => {
			/* fullscreen denied/unsupported; ignore */
		});
	}
});

// Try to lock to landscape in fullscreen (mobile); unlock on exit. The
// Orientation lock API is non-standard and only works in fullscreen on
// supporting devices, so guard + ignore rejections.
type LockableOrientation = ScreenOrientation & {
	lock?: (o: string) => Promise<void>;
};
function lockLandscape() {
	const o = screen.orientation as LockableOrientation | undefined;
	o?.lock?.("landscape").catch(() => {
		/* unsupported (e.g. desktop / iOS Safari); ignore */
	});
}
function unlockOrientation() {
	screen.orientation?.unlock?.();
}

document.addEventListener("fullscreenchange", () => {
	const active = document.fullscreenElement === stage;
	fsBtn.textContent = active ? EN.exitFullscreen : EN.fullscreen;
	syncFullscreenSize();
	if (active) {
		stage.focus();
		lockLandscape();
	} else {
		unlockOrientation();
	}
});
window.addEventListener("resize", syncFullscreenSize);

// --- Service worker registration ---
// Register + auto-apply updates so a returning player is never stuck on a stale
// cached build: when a new SW finishes installing while an old one still
// controls the page, tell it to skip waiting and reload once it takes over.
if ("serviceWorker" in navigator) {
	let reloading = false;
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (reloading) return;
		reloading = true;
		window.location.reload();
	});
	navigator.serviceWorker
		.register("/sw.js")
		.then((reg) => {
			reg.addEventListener("updatefound", () => {
				const sw = reg.installing;
				if (!sw) return;
				sw.addEventListener("statechange", () => {
					// A new worker installed while an old one is still in control →
					// activate it immediately (it will then controllerchange + reload).
					if (sw.state === "installed" && navigator.serviceWorker.controller) {
						sw.postMessage("skipWaiting");
					}
				});
			});
		})
		.catch(() => {
			/* SW registration failed (e.g. file not found in dev); silently ignore */
		});
}

// --- PWA install prompt ---
// localStorage key used to remember permanent dismissals / installs.
const INSTALL_DISMISSED_KEY = "caticorn-install-dismissed";

const installToast = document.getElementById("install-toast") as HTMLDivElement;
const installBtn = document.getElementById("install-btn") as HTMLButtonElement;
const installAndroid = document.getElementById(
	"install-android",
) as HTMLSpanElement;
const installIos = document.getElementById("install-ios") as HTMLSpanElement;
const installDismiss = document.getElementById(
	"install-dismiss",
) as HTMLButtonElement;

/** Show the toast (flex) only when it has not been permanently dismissed and we
 * are not already running as a standalone PWA (display-mode: standalone). */
function isStandalone(): boolean {
	return window.matchMedia("(display-mode: standalone)").matches;
}

function isDismissed(): boolean {
	return !!localStorage.getItem(INSTALL_DISMISSED_KEY);
}

function showToast() {
	if (isStandalone() || isDismissed()) return;
	installToast.classList.remove("hidden");
	installToast.classList.add("flex");
}

function hideToast(permanent: boolean) {
	installToast.classList.add("hidden");
	installToast.classList.remove("flex");
	if (permanent) {
		localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
	}
}

installDismiss.addEventListener("click", () => hideToast(true));

// Android / Chrome: capture the beforeinstallprompt event and show the toast.
// The browser fires this when the PWA criteria are met and the app is not yet
// installed.
type BeforeInstallPromptEvent = Event & {
	readonly platforms: string[];
	readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
	prompt(): Promise<void>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
	e.preventDefault();
	deferredPrompt = e as BeforeInstallPromptEvent;
	// Show Android path, hide iOS hint.
	installAndroid.classList.remove("hidden");
	installAndroid.classList.add("flex");
	installIos.classList.add("hidden");
	installIos.classList.remove("flex");
	showToast();
});

installBtn.addEventListener("click", async () => {
	if (!deferredPrompt) return;
	await deferredPrompt.prompt();
	const { outcome } = await deferredPrompt.userChoice;
	deferredPrompt = null;
	// Whether accepted or dismissed by the user: hide permanently so we don't
	// re-show on the next page load (the browser also won't re-fire the event).
	hideToast(outcome === "accepted");
	if (outcome !== "accepted") {
		// User tapped "Cancel" in the native dialog — hide but don't permanently
		// dismiss (let them decide again after a fresh page load). Revert the
		// permanent flag we set above.
		localStorage.removeItem(INSTALL_DISMISSED_KEY);
	}
});

// Once the app is installed, hide the toast for good.
window.addEventListener("appinstalled", () => hideToast(true));

// iOS Safari: no beforeinstallprompt. Detect via UA and standalone mode.
// Show a one-time instructional hint.
function isIos(): boolean {
	// navigator.userAgent is fine here (read-only detection, not spoofing concern)
	return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

if (isIos() && !isStandalone()) {
	installAndroid.classList.add("hidden");
	installAndroid.classList.remove("flex");
	installIos.classList.remove("hidden");
	installIos.classList.add("flex");
	showToast();
}
