import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Exclude Playwright e2e tests — those are run separately via `npm run test:e2e`.
		exclude: ["e2e/**", "**/node_modules/**"],
	},
});
