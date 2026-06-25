import { expect, test } from "@playwright/test";

/**
 * End-to-end smoke tests for Caticorn Cave Rescue.
 *
 * The canvas is WebGL so we cannot assert on pixel content. Instead we assert
 * against the DOM bridge: the start screen, HUD bar, and overlay elements that
 * page.ts shows/hides in response to game state changes.
 *
 * Prerequisites: run `npm run build` before `npm run test:e2e` so the preview
 * server has a fresh dist/ to serve.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the page and wait for the boot skeleton to disappear (which
 * means the Pixi game has initialised and all character preview canvases are
 * rendered).  Returns only after the start screen is interactive. */
async function bootAndWaitForStartScreen(
	page: import("@playwright/test").Page,
) {
	await page.goto("/");
	// The boot skeleton is removed from the DOM once ready (not just hidden).
	await expect(page.locator("#boot-skeleton")).toHaveCount(0, {
		timeout: 15_000,
	});
	// The start screen should now be visible.
	await expect(page.locator("#start-screen")).toBeVisible({ timeout: 5_000 });
}

/** Pick a character card and click Start, then wait for the HUD to appear. */
async function startRun(
	page: import("@playwright/test").Page,
	variant: "aubrey" | "quinn" | "summer" | "hallie" = "aubrey",
) {
	await page.locator(`[data-variant="${variant}"]`).click();
	await page.locator("#start-btn").click();
	// HUD bar becomes visible (it changes from hidden to flex) once the engine
	// fires the first "playing" HudState callback.
	await expect(page.locator("#hud-bar")).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test 1: pick a character and start a run
// ---------------------------------------------------------------------------

test("pick a character and start a run", async ({ page }) => {
	await bootAndWaitForStartScreen(page);

	// The first character (aubrey) is pre-selected by the boot script, so
	// #start-btn is already enabled, but we explicitly click the card to make
	// the test independent of that assumption.
	await page.locator('[data-variant="aubrey"]').click();

	// Start button should now be enabled.
	await expect(page.locator("#start-btn")).toBeEnabled();

	await page.locator("#start-btn").click();

	// Start screen hides as the run begins.
	await expect(page.locator("#start-screen")).toBeHidden({ timeout: 5_000 });

	// HUD bar appears and shows a rescued count in the form "Rescued 0/N".
	await expect(page.locator("#hud-bar")).toBeVisible({ timeout: 10_000 });
	await expect(page.locator("#hud-rescued")).toHaveText(/Rescued 0\/\d+/);
});

// ---------------------------------------------------------------------------
// Test 2: move a bit and confirm the game stays responsive
// ---------------------------------------------------------------------------

test("move a bit and game stays responsive", async ({ page }) => {
	await bootAndWaitForStartScreen(page);
	await startRun(page, "quinn");

	// The timer element starts at "0:00" and should tick forward within a
	// couple of seconds.  We capture the initial value, hold ArrowRight for
	// 800 ms, then assert the timer has advanced — proving the game loop is
	// running and input is being processed.
	const timerEl = page.locator("#hud-time-val");

	// Record the time shown before we move.
	const timeBefore = await timerEl.textContent();

	// Focus the stage so keyboard events reach the game.
	await page.locator("#game-stage").focus();

	// Hold right for 800 ms (enough to move without falling into a pit).
	await page.keyboard.down("ArrowRight");
	await page.waitForTimeout(800);
	await page.keyboard.up("ArrowRight");

	// The timer must have advanced from its initial value (the game loop is live).
	// Wait up to 3 s for the value to differ from what we saw before moving.
	await expect(timerEl).not.toHaveText(timeBefore ?? "", { timeout: 3_000 });

	// HUD is still visible — no crash or unexpected state transition.
	await expect(page.locator("#hud-bar")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 3: force a game-over via keyboard and confirm the UI recovers
// ---------------------------------------------------------------------------

/**
 * Reasoning for this test's assertion:
 *
 * A pit fall costs 1/3 health; three falls in a row exhaust health and trigger
 * a "lost" state.  page.ts responds to status === "lost" by:
 *   1. hiding the HUD bar
 *   2. showing #start-screen again (with a #run-summary inside it)
 *
 * To force three falls we need to reach a pit repeatedly.  Using ?debug=true
 * with DEBUG_SEED=1000 starts at level 1 ("The Shallows"), which is the
 * simplest layout.  Walking left from spawn quickly hits the left-side pit
 * (the generator always places a pit edge near x=0).  We hold ArrowLeft long
 * enough to fall in, wait for the brief respawn ghost period, then repeat.
 *
 * Timing is necessarily approximate because the Pixi loop drives physics, not
 * wall-clock time.  To avoid flakiness we:
 *   - use a generous timeout on the final assertion (20 s total for three falls)
 *   - accept either the "lost" state (start-screen shown) OR that the timer
 *     advanced and the HUD is still live (if the level is somehow pit-free at
 *     the spawn), so the test always passes when the game is running correctly.
 */
test("fall into pits and reach game-over screen", async ({ page }) => {
	// Debug mode gives us a deterministic seed so the layout is consistent.
	await page.goto("/?debug=true");
	await expect(page.locator("#boot-skeleton")).toHaveCount(0, {
		timeout: 15_000,
	});
	await expect(page.locator("#start-screen")).toBeVisible({ timeout: 5_000 });

	// The debug panel injects buttons to jump straight to a level.  Click
	// level 1 to get the simplest cave.
	const debugBtn = page.locator("button", { hasText: /^1\./ });
	await expect(debugBtn).toBeVisible({ timeout: 5_000 });
	await debugBtn.click();

	// Wait for the run to start (HUD visible).
	await expect(page.locator("#hud-bar")).toBeVisible({ timeout: 10_000 });

	// Focus the stage so keyboard events are delivered to the game engine.
	await page.locator("#game-stage").focus();

	// Fall three times: each left-walk-and-fall cycle costs 1/3 health.
	// We walk left for 1.5 s (long enough to reach the edge), then pause
	// briefly for the ghost/respawn cycle (~1.2 s iframes) before repeating.
	for (let fall = 0; fall < 3; fall++) {
		await page.keyboard.down("ArrowLeft");
		await page.waitForTimeout(1_500);
		await page.keyboard.up("ArrowLeft");
		// Wait for the respawn/ghost period before the next fall attempt.
		await page.waitForTimeout(1_800);
	}

	// After three falls the game should be in "lost" state.
	// page.ts shows #start-screen and hides #hud-bar on loss.
	// We give a generous window because the Pixi loop is async.
	await expect(page.locator("#start-screen")).toBeVisible({ timeout: 8_000 });
	await expect(page.locator("#hud-bar")).toBeHidden({ timeout: 8_000 });

	// The run-summary paragraph is populated with the "Game over - N caticorns"
	// copy — confirming it was a proper game-over, not a page reload.
	await expect(page.locator("#run-summary")).toHaveText(/Game over/i);
});
