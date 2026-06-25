# Caticorn Cave Rescue

A small browser platformer built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) and [PixiJS](https://pixijs.com). Free the trapped caticorns from each cave and reach the glowing exit.

**Play it:** https://caticorn.lukehmu.com

Every visual is drawn at runtime with Pixi `Graphics` and every sound is a WebAudio chiptune — there are no image or audio asset files.

## Play

- **Move:** Arrow keys / WASD (or the on-screen pad on touch devices)
- **Jump:** Up / Space / W — press again mid-air for a double jump; tap for a short hop, hold for a full one
- **Pause:** P (desktop)
- **Free caticorns:** touch shackled ones; stomp the cage on caged ones
- **Bounce:** land on a trampoline for a big launch
- **Heal:** grab floating flutes (+health)
- **Avoid:** pits, baddies (stomp them from above), lethal ceiling spikes, and the slow-you-down poop dropped by ceiling lurkers
- **Goal:** free every caticorn, then reach the exit. Clear all caves to win. Health runs green → yellow → orange → red.

Pick a hero on the start screen — Aubrey, Quinn, Summer or Hallie, each with their own hat. Every run uses a fresh seed, so the cave themes, colours and layouts change each time. Mobile players get on-screen controls and a fullscreen landscape mode.

## Develop

```sh
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # static build to ./dist
npm run preview    # preview the build
npm run check      # Biome lint + format check
npm run format     # Biome write
npm run typecheck  # astro check (TypeScript)
npm test           # vitest unit tests
```

A [lefthook](https://lefthook.dev) pre-commit hook runs Biome + `astro check` + tests on every commit (`npx lefthook install` once after cloning). Two GitHub Actions run on push to `main`: **Code Quality** (Biome, typecheck, tests) and **Deploy to GitHub Pages**.

> If the dev server returns a 504 "Outdated Optimize Dep" after installing packages, clear the stale Vite cache: `rm -rf node_modules/.vite && npm run dev`. It never affects the production build.

## Structure

```text
src/
  pages/index.astro      # page shell: canvas, character select, overlays, touch controls
  layouts/Layout.astro
  game/
    types.ts             # shared interfaces + physics constants
    levels.ts            # seeded procedural generator with reachability checks
    Game.ts              # orchestrator: loop, camera, collisions, health, flow
    caticorn.ts          # boot entry + public GameHandle
    art/                 # all Pixi-Graphics sprites (characters, props, scenery, particles)
    audio.ts             # WebAudio chiptunes
    strings/en.ts        # all user-facing copy
    entities/            # Entity base + Player, Monster, Caticorn, Exit
    systems/             # Hud, HealthBar, Particles, Fireflies, ScreenShake
```

The game logic is plain deterministic TypeScript (no `Math.random` / `Date.now` in the sim) producing data that PixiJS renders; Astro + Tailwind are just the page shell.
