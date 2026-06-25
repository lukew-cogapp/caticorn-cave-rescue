# Caticorn Cave Rescue

A browser platformer built with Astro + Tailwind + PixiJS. Rescue trapped
caticorns across procedurally-generated caves and reach the exit. All visuals
are drawn at runtime with Pixi `Graphics` (no image assets); all audio is
WebAudio chiptune (no audio files).

Live: https://caticorn.lukehmu.com (GitHub Pages, repo `lukew-cogapp/caticorn-cave-rescue`)

> `CLAUDE.md` is a symlink to this file; edit `AGENTS.md`.

## Commands

```sh
npm run dev        # dev server (or: astro dev --background; stop/status/logs)
npm run build      # static build to ./dist
npm run check      # Biome lint + format check
npm run format     # Biome write
npm run typecheck  # astro check (TypeScript)
npm test           # vitest (pure-logic unit tests)
```

After any change run `npx astro check`, `npm run build`, `npm test`, and
`npx @biomejs/biome check . --write`. A lefthook pre-commit hook runs Biome +
`astro check` + tests; two GitHub Actions (Code Quality, Deploy to GitHub Pages)
run on push to `main`.

Tests are pure + deterministic (no Pixi/DOM): `levels.test.ts` (seed
determinism, reachability invariant, difficulty ramp, hazard/grass rules) and
`types.test.ts` (`rectsOverlap`). Keep test files importing only `levels.ts` /
`types.ts` (Pixi-free).

> Dev-only annoyance: a stale Vite dep cache can 504 ("Outdated Optimize Dep")
> after installing deps. Fix with `rm -rf node_modules/.vite && npm run dev`.
> Never affects the production build.

## Architecture

The game is plain TypeScript producing data + PixiJS rendering it. Astro/Tailwind
are only the page shell.

```
src/
  pages/index.astro   # page shell: canvas, start/char-select screen, win-lose
                      # overlay, touch controls, fullscreen, run-summary. Boots
                      # the game and bridges DOM <-> engine.
  layouts/Layout.astro
  game/
    types.ts          # shared interfaces + tuning constants (GRAVITY,
                      # JUMP_VELOCITY, TRAMPOLINE_VELOCITY, GAME_WIDTH/HEIGHT,
                      # GROUND_Y, PLAYER_W/H), Rect/Vec2, Platform (grass flag),
                      # Level (bg + themeAccent), rectsOverlap, HudState, GameHandle.
    levels.ts         # buildLevels(seed?): procedural generator. Seeded PRNG
                      # (deterministic) — the seed drives theme/colour/layout per
                      # level; physics-based reachability checks so every gap +
                      # platform is provably clearable. Places platforms (some
                      # grassy), caticorns (shackle/cage), monsters, trampolines,
                      # flutes, decor. Poops are NOT authored — only lurkers drop
                      # them. Tests pass a fixed seed; the game passes a random one.
    Game.ts           # orchestrator: Pixi app, world container, camera lerp,
                      # day/night tint, all collisions, health/damage + death,
                      # falling + ground poop, pause, exit waypoints, level flow.
    caticorn.ts       # bootGame() entry + public GameHandle (start(variant,seed?)
                      # /restart/resize/resetView/destroy). Re-exports CHARACTERS.
    art/              # all sprites, Pixi Graphics only (barrel: art/index.ts so
                      # `from "../art"` keeps working). util.ts (colour/tint/PRNG
                      # helpers), characters.ts (buildCaticorn, hats, drawPlayer/
                      # Caticorn/Ghost, PLAYER_PALETTES, CATICORN_PALETTES,
                      # CHARACTERS), props.ts (monster, exit+glow, cage, shackle,
                      # poop, trampoline, flute), scenery.ts (background, decor,
                      # grass), particles.ts (particle, firefly).
    audio.ts          # Chiptune class: levelWin/gameWin/rescue(step)/hurt.
    strings/en.ts     # ALL user-facing copy (EN). Reference keys, don't hardcode.
    entities/
      Entity.ts       # abstract base: view, pos (bottom-centre), vel, aabb(),
                      # update(ctx), syncView(), destroy().
      Player.ts       # input, skid-eased movement, coyote/buffer/variable jump +
                      # double jump, apex-hang gravity, squash/stretch, idle
                      # breathing, trampoline bounce, slamDown, poop-feet effect.
      Monster.ts      # Monster base + Crawler / Bat / Lurker (ceiling poop
                      # dropper); kill()/isDead()/isLethal(); createMonster(spec,
                      # accent?).
      Caticorn.ts     # rescuable; varied palette per captive, shackle/cage
                      # binding that breaks on free, sad->happy + float-up.
      Exit.ts         # static gate + inner glow that brightens by proximity;
                      # locked until all caticorns freed.
    systems/
      Hud.ts          # in-canvas HUD bar (level / rescued / score + timer).
      HealthBar.ts    # floating green>yellow>orange>red bar over the player.
      Particles.ts    # deterministic burst pool parented to the world.
      Fireflies.ts    # ambient drifting background fireflies.
      ScreenShake.ts  # deterministic pivot-based screen shake.
```

### Coordinate + rendering conventions

- Entity position is **bottom-centre**; sprites are drawn upward with negative y.
  Exception: ceiling things (stalactite decor, the Lurker monster) draw downward
  from y=0 and are placed at the ceiling.
- Internal render resolution is fixed at 800x450 (16:9). The canvas is
  CSS/`renderer.resize`d to fit; the play frame targets 80vh on large screens.
- The HUD + day/night tint live on `app.stage` (fixed); gameplay lives in the
  scrolling `world` container. Screen shake offsets `app.stage.pivot` so it
  doesn't fight the letterbox offset on `stage.x/y`.

## Hard rules

- **No `Math.random` and no `Date.now`/`new Date()` in game code.** The sim must
  stay deterministic (and these throw in some harness contexts). For variation,
  derive from a seeded PRNG (`levels.ts`) or from existing counters (elapsed,
  particle index, positions, phase accumulators).
- Drive all timing off the clamped per-frame `dt`, never wall-clock.
- TypeScript strict, tab indentation, double quotes, JSDoc on classes and
  non-obvious methods. Biome (v2) only — never ESLint/Prettier.
- Keep copy in `strings/en.ts`.

## Gameplay summary

Pick a hero (Aubrey/strawberry, Quinn/acorn, Summer/sunhat, Hallie/crystal),
free every caticorn in a cave, then reach the glowing exit. Clear four caves to
win. Each run gets a random seed → different theme (10 palettes), colours and
layout per cave; monsters + decor recolour to the level mood.

- **Movement**: skid-eased run, coyote time + jump buffering + variable-height
  jump, double jump, apex-hang gravity, idle breathing. **P** pauses (desktop).
- **Rescue**: shackled caticorns free on contact; caged ones must be stomped
  (land on the cage roof). Each rescue/kill/flute advances a run-long rising tune.
- **Health** (0..1 bar over the head): falling -1/3, monster/spike contact -1/5,
  head poop -1/10; flutes heal +1/5. Pit falls ghost + respawn while health
  remains; out of health = game over. Monster/spike hits are in-place with ~1s
  i-frames (ghost only on pit fall or final death).
- **Combat**: stomp monsters from above; side/below contact damages you.
- **Hazards**: pits, lethal ceiling stalactites, slow-you-down poop (lingers,
  brown feet, blocks jumping, fades ~5s) dropped by a ceiling **Lurker**;
  a falling poop on the head slams you down.
- **Extras**: trampolines, floating flutes, ambient fireflies, day/night tint,
  hit-stop + screen shake + particle juice. At a locked exit, waypoint arrows
  point to whoever you missed.

## Astro reference

Full docs: https://docs.astro.build — routing, components, framework components,
content collections, styling/Tailwind, i18n.
