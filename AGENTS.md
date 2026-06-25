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
```

After any change run `npx astro check`, `npm run build`, and
`npx @biomejs/biome check . --write`. A lefthook pre-commit hook runs Biome +
`astro check`; two GitHub Actions (Code Quality, Deploy to GitHub Pages) run on
push to `main`.

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
                      # GROUND_Y, START_LIVES, PLAYER_W/H), Rect/Vec2,
                      # rectsOverlap, HudState, GameHandle.
    levels.ts         # buildLevels(): procedural generator. Seeded PRNG
                      # (deterministic), physics-based reachability checks so
                      # every gap/platform is provably clearable. Places
                      # platforms, caticorns, monsters, poops, trampolines,
                      # flutes, decor.
    Game.ts           # orchestrator: Pixi app, world container, camera lerp,
                      # day/night tint, collisions, lives/flow, dynamic poop.
    caticorn.ts       # bootGame() entry + public GameHandle (start/restart/
                      # resize/resetView/destroy). Re-exports CHARACTERS, HudState.
    art.ts            # every sprite: drawPlayer(variant), drawCaticorn(happy),
                      # drawGhost, drawMonster(kind), drawExit, drawPoop,
                      # drawTrampoline, drawFlute, drawParticle(kind),
                      # drawDecor(d), drawBackground. CHARACTERS + PlayerVariant.
    audio.ts          # Chiptune class: levelWin/gameWin/rescue/hurt.
    strings/en.ts     # ALL user-facing copy (EN). Reference keys, don't hardcode.
    entities/
      Entity.ts       # abstract base: view, pos (bottom-centre), vel, aabb(),
                      # update(ctx), syncView(), destroy().
      Player.ts       # input, skid-eased movement, double jump, squash/stretch,
                      # trampoline bounce, poop-feet effect.
      Monster.ts      # Monster base + Crawler / Bat / Lurker; createMonster().
      Caticorn.ts     # rescuable; sad->happy face swap + float-up on rescue.
      Exit.ts         # gate; locked until all caticorns freed.
    systems/
      Hud.ts          # in-canvas HUD bar (level / rescued / lives).
      Particles.ts    # deterministic burst pool parented to the world.
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

Move/jump (double jump), bounce on trampolines, stomp monsters from above,
collect floating flutes for extra lives. Hazards: pits, side/below monster
contact, lethal ceiling stalactites, slow-you-down poop (lingers 1s, brown feet,
blocks jumping), and a ceiling Lurker that drips poop. Free all caticorns then
reach the exit; clear four caves to win. Four playable heroes (Aubrey, Quinn,
Summer, Hallie). Day/night tint cycles for mood.

## Astro reference

Full docs: https://docs.astro.build — routing, components, framework components,
content collections, styling/Tailwind, i18n.
