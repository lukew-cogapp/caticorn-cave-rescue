import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for end-to-end tests.
 *
 * Tests run against a static preview build (`npm run build` first, then
 * `npm run preview`). In CI the build step is a prerequisite; locally
 * the preview server is started automatically by the webServer config.
 *
 * Run:  npm run test:e2e
 * CI:   build first, then npm run test:e2e
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",

	use: {
		baseURL: "http://localhost:4321",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Enable WebGL in headless Chromium via the SwiftShader software
				// renderer.  Without this flag Pixi's WebGL context creation fails
				// in CI and the boot skeleton never clears.
				launchOptions: {
					args: [
						"--use-gl=swiftshader",
						"--enable-webgl",
						"--ignore-gpu-blocklist",
					],
				},
			},
		},
	],

	webServer: {
		/** Serves the pre-built `dist/` directory.
		 *  Run `npm run build` before `npm run test:e2e` if dist is stale. */
		command: "npm run preview",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
		stdout: "pipe",
		stderr: "pipe",
		// Allow up to 30 s for the server to start.
		timeout: 30_000,
	},
});
