// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://caticorn.lukehmu.com",
	// The dev toolbar triggers a known dev-only 504 / 404 for its entrypoint
	// (withastro/astro#15857). We don't use it, so disable it to keep the dev
	// console clean. No effect on the production build.
	devToolbar: { enabled: false },
	vite: {
		plugins: [tailwindcss()],
	},
});
