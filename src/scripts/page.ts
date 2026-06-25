/**
 * Page boot + DOM <-> engine bridge for the Caticorn Cave Rescue start page.
 *
 * This is the entire client-side controller for `index.astro`: it boots the
 * Pixi game, renders the title/hero/character-select Pixi previews, wires the
 * nipplejs touch controls + fullscreen, drives the DOM HUD bar and win/lose
 * overlay, and starts a run. The markup it drives lives in `index.astro` and
 * its components; this module only looks elements up by id.
 */
import { Application } from "pixi.js";
import { drawPlayer, type PlayerVariant } from "../game/art";
import { bootGame, CHARACTERS, type HudState } from "../game/caticorn";
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
const hudBar = document.getElementById("hud-bar") as HTMLDivElement;
const hudLevel = document.getElementById("hud-level") as HTMLSpanElement;
const hudRescued = document.getElementById("hud-rescued") as HTMLSpanElement;
const hudStats = document.getElementById("hud-stats") as HTMLSpanElement;

/** Format seconds as m:ss. */
function formatTime(seconds: number): string {
	const s = Math.floor(seconds);
	const m = Math.floor(s / 60);
	return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function renderHud(s: HudState) {
	// Live score bar, shown only while playing.
	if (s.status === "playing") {
		const name = EN.levels[s.levelName] ?? s.levelName;
		hudLevel.textContent = EN.hudLevel(name, s.level, s.totalLevels);
		hudRescued.textContent = EN.hudRescued(s.rescued, s.toRescue);
		hudStats.textContent = `${EN.hudScore(s.score)}   ${formatTime(s.elapsed)}`;
		hudBar.classList.remove("hidden");
		hudBar.classList.add("flex");
	} else {
		hudBar.classList.add("hidden");
		hudBar.classList.remove("flex");
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
const titleCanvas = document.getElementById(
	"title-sprite",
) as HTMLCanvasElement;
const heroCanvas = document.getElementById("hero-sprite") as HTMLCanvasElement;
await renderSpriteInto(titleCanvas, "aubrey", 60);
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
	// Fresh seed per run so cave layouts differ each playthrough. Chosen in
	// the DOM (random allowed here) and handed to the deterministic generator.
	game.start(chosen, Math.floor(Math.random() * 1e9) + 1);
	stage.focus();
}

startBtn.addEventListener("click", beginRun);

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

if (isTouch) {
	const nipplejs = (await import("nipplejs")).default;
	const manager = nipplejs.create({
		zone: moveZone,
		mode: "dynamic",
		color: "#fbbf24",
		size: 110,
		threshold: 0.25, // fraction of the radius before a direction registers
		restJoystick: true,
	});
	// nipplejs's `.on` overloads are over-narrow for our event names, so bind
	// through a loosened handle.
	const on = (
		manager as unknown as {
			on(ev: string, cb: (...args: unknown[]) => void): void;
		}
	).on.bind(manager);
	// Map stick movement to a digital left/right. Using the live vector each
	// move means dragging further only sustains the direction, never stops it.
	on("move", (...args: unknown[]) => {
		const data = args[1] as { vector?: { x: number; y: number } };
		const x = data?.vector?.x ?? 0;
		if (x <= -0.4) setDir("ArrowLeft");
		else if (x >= 0.4) setDir("ArrowRight");
		else setDir(null);
	});
	on("end", () => setDir(null));
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
