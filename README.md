# Caticorn Cave Rescue

A small browser platformer built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) and [PixiJS](https://pixijs.com). Free the trapped caticorns from each cave and reach the glowing exit.

**Play it:** https://lukew-cogapp.github.io/caticorn-cave-rescue/

## Play

- **Move:** Arrow keys / WASD (or the on-screen pad on touch devices)
- **Jump:** Up / Space / W (press again in mid-air for a double jump)
- **Bounce:** land on a trampoline while falling for a big launch
- **Collect:** floating flutes grant an extra life
- **Avoid:** pits, baddies (crawlers + bats), ceiling spikes, and the slow-you-down poop
- **Goal:** rescue every caticorn, then reach the exit gate. Clear all four caves to win.

Pick your hero on the start screen: Aubrey, Quinn, Summer or Hallie. Mobile players get on-screen move + jump buttons.

## Develop

```sh
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # static build to ./dist
npm run preview    # preview the build
npm run check      # Biome lint + format check
npm run format     # Biome write
npm run typecheck  # astro check (TypeScript)
```

A [lefthook](https://lefthook.dev) pre-commit hook runs Biome + `astro check` on every commit. Run `npx lefthook install` once after cloning. Two GitHub Actions run on push to `main`: **Code Quality** (Biome + typecheck) and **Deploy to GitHub Pages**.

## Structure

```text
src/
  pages/index.astro      # the game page (canvas, HUD, character select)
  layouts/Layout.astro
  game/
    types.ts             # shared interfaces + physics constants
    levels.ts            # procedural level generator with reachability checks
    Game.ts              # orchestrator: loop, camera, collisions, day/night
    caticorn.ts          # boot entry + public handle
    art.ts               # all sprites drawn with Pixi Graphics (no image assets)
    audio.ts             # WebAudio chiptunes
    entities/            # Entity base + Player, Monster, Caticorn, Exit
```

All characters, enemies, hazards and scenery are drawn at runtime with Pixi `Graphics` — there are no image or audio asset files.
