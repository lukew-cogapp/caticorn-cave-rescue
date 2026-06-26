# Caticorn Cave Rescue

A browser platformer built with Astro + Tailwind + PixiJS. Rescue trapped
caticorns across procedurally-generated caves and reach the exit. All visuals
are drawn at runtime with Pixi `Graphics` (no image assets); all audio is
WebAudio chiptune (no audio files).

Live: https://caticorn.lukehmu.com (GitHub Pages, repo `lukew-cogapp/caticorn-cave-rescue`)

## Commands

```sh
npm run dev        # dev server (or: astro dev --background; stop/status/logs)
npm run build      # static build to ./dist
npm run check      # Biome lint + format check
npm run format     # Biome write
npm run typecheck  # astro check (TypeScript)
npm test           # vitest (pure-logic unit tests)
npm run test:e2e   # Playwright e2e (needs a build first; uses `astro preview`)
```

After any change run `npx astro check`, `npm run build`, `npm test`, and
`npx @biomejs/biome check . --write`. A lefthook pre-commit hook runs Biome +
`astro check` + tests. Two GitHub Actions run on push to `main`: **Code Quality**
(Biome + typecheck + vitest, plus a Playwright e2e job) and **Deploy to GitHub
Pages** — and Deploy is **gated**: a `check` job (Biome + typecheck + vitest)
must pass before the site builds/ships, so a red commit never deploys.

Tests:
- **Unit** (vitest, pure + deterministic, no Pixi/DOM): `levels.test.ts` (seed
  determinism, reachability invariant, difficulty ramp, hazard/grass rules,
  per-level theme/ambient, jump-band distribution, decor fairness),
  `level/themes.test.ts` (theme pool integrity + `pickThemes` shuffle), and
  `types.test.ts` (`rectsOverlap`). Keep these importing only Pixi-free modules
  (`levels.ts` / `level/*` / `types.ts`).
- **e2e** (Playwright, `e2e/game.spec.ts`): drives the real game via the DOM
  bridge (start screen, HUD bar, overlay) — pick a hero + start, move + stay
  responsive, walk into pits + survive. `vitest.config.ts` excludes `e2e/`.

> Dev-only annoyance: a stale Vite dep cache can 504 ("Outdated Optimize Dep")
> after installing deps. Fix with `rm -rf node_modules/.vite && npm run dev`.
> Never affects the production build.

## Architecture

The game is plain TypeScript producing data + PixiJS rendering it. Astro/Tailwind
are only the page shell.

```
src/
  pages/index.astro   # page shell only: composes the components below inside the
                      # #game-stage, loads the controller via `import page.ts`.
  components/         # presentational Astro components (markup; the script finds
                      # them by id): BootSkeleton, StartScreen, HudBar (score bar
                      # + fullscreen toggle), WinLoseOverlay (flawless badge +
                      # achievements + Play again / Return to start), RotateHint,
                      # TouchControls (nipplejs move zone + jump zone).
  scripts/page.ts     # the whole client controller: boots the Pixi game, renders
                      # char-select previews, drives the DOM HUD + win/lose +
                      # achievements, nipplejs touch controls, fullscreen, PWA
                      # install prompt + service-worker register, debug
                      # level-select (?debug=true), and starts a run.
  layouts/Layout.astro# <head>: manifest, icons, theme-color, PWA metas.
  game/
    types.ts          # shared interfaces + tuning constants (GRAVITY,
                      # JUMP_VELOCITY, TRAMPOLINE_VELOCITY, GAME_WIDTH/HEIGHT,
                      # GROUND_Y, PLAYER_W/H), Rect/Vec2, Platform (grass), Level
                      # (bg + themeAccent + themeStyle + ambient), MonsterSpec.kind
                      # (crawler/bat/lurker/luke), DecorKind, rectsOverlap,
                      # HudState (+ score + FlawlessFlags), GameHandle.
    const.ts          # ALL gameplay/physics/timing tuning numbers (movement,
                      # jump, combat, hit-stop, poop, FIXED_DT/MAX_FRAME_TIME,
                      # camera, theme mechanics, ambient profiles, Luke, etc.).
    levels.ts         # buildLevels(seed?): procedural generator. A run is 6 caves
                      # at a fixed difficulty ramp; pickThemes shuffles the theme
                      # pool so each run visits a RANDOM 6 of the ~14 bespoke
                      # themes in random order. Physics-based reachability checks
                      # so every gap + platform is provably clearable. Places
                      # platforms (some grassy), caticorns (shackle/cage),
                      # monsters (Luke guards the final exit), trampolines, flutes,
                      # decor (sampled from the theme). Poops are NOT authored —
                      # only lurkers drop them. buildShowcaseLevels() = one level
                      # per theme for the ?debug=true level-select.
    level/            # themes.ts (ThemeStyle + AmbientKind unions, THEME_PACKS
                      # registry, THEMES view, getThemePack, pickThemes shuffle),
                      # theme-pack.ts (ThemePack interface: metadata + lighting +
                      # optional mechanic + OPTIONAL draw hooks — bg silhouettes,
                      # floor/platform skin, monsterFlourish, monsterSkin reskin —
                      # absent hooks fall back to generic defaults), themes/<style>.ts
                      # (one bespoke ThemePack per theme), prng.ts, reachability.ts.
    Game.ts           # orchestrator: Pixi app, world container, FIXED-TIMESTEP
                      # sim loop (accumulator → step), camera lerp, per-theme
                      # night-tint lighting, collisions, health/damage + death,
                      # poop, pause, exit waypoints, flawless tracking, level flow.
    caticorn.ts       # bootGame() entry + GameHandle (start(variant,seed?,
                      # startLevel?,showcase?)/restart/resize/resetView/destroy).
    art/              # Pixi Graphics only (barrel art/index.ts). util.ts
                      # (colour/tint/PRNG/wobble), characters.ts (caticorns, hats,
                      # horn, drawPlayer/Caticorn/Ghost, drawLuke), props.ts
                      # (drawMonster + flourish/reskin dispatch, exit, cage,
                      # shackle, poop, trampoline, flute), scenery.ts (parallax bg
                      # layers, floor strip, platform, decor, grass — themed via
                      # ThemePack hooks), particles.ts (drawParticle kinds + ambient
                      # + rescue ring), themes/<style>/ (per-theme asset modules,
                      # e.g. monster reskins).
    audio.ts          # Chiptune: levelWin/gameWin/rescue(step)/hurt + jump/stomp/
                      # trampoline/flute/squish SFX + themeSting(style) per-theme
                      # one-shot motif on level load. WebAudio only, no files.
    strings/en.ts     # ALL user-facing copy (EN). Reference keys, don't hardcode.
    entities/
      Entity.ts       # abstract base: view, pos (bottom-centre), vel, aabb()...
      Player.ts       # input, skid movement (+ ice friction), coyote/buffer/
                      # variable + double jump, mid-air first jump, apex gravity,
                      # squash, idle breathing, trampoline + grove bounce, poop feet.
      Monster.ts      # Monster base + Crawler / Bat / Lurker + Luke (boss: taller
                      # crawler, telegraphed sword swing widens aabb); createMonster.
      Caticorn.ts     # rescuable; per-captive palette, accent-tinted shackle/cage.
      Exit.ts         # static gate + inner glow; locked until all freed.
    game/             # extracted per-frame systems: collisions.ts, camera.ts,
                      # daynight.ts, poop.ts, waypoints.ts, input.ts, scene.ts
                      # (loadScene), pauseOverlay.ts.
    systems/
      HealthBar.ts    # floating green>yellow>orange>red bar over the player.
      Particles.ts    # deterministic burst pool + expanding rescue rings.
      Fireflies.ts    # ambient drifting background fireflies.
      Motes.ts        # themed ambient drifters (per-AmbientKind motion profile).
      ScreenShake.ts  # deterministic pivot-based screen shake.
```

The HUD/score bar, win-lose overlay and achievements are now **DOM** (above /
over the canvas), driven by `Game`'s `onHud(HudState)` callback in `page.ts` —
not in-canvas. Keep `page.ts` HUD writes null-tolerant (it's the engine
callback; a throw there would freeze the sim loop).

### Coordinate + rendering conventions

- Entity position is **bottom-centre**; sprites are drawn upward with negative y.
  Exception: ceiling things (stalactite decor, the Lurker monster, ceiling
  reskins) draw downward from y=0 and are placed at the ceiling.
- Internal render resolution is fixed at 800x450 (16:9). The canvas is
  CSS/`renderer.resize`d to fit; the play frame targets 80vh on large screens.
- Day/night tint lives on `app.stage` (fixed); gameplay lives in the scrolling
  `world` container. Screen shake offsets `app.stage.pivot` so it doesn't fight
  the letterbox offset on `stage.x/y`.
- Static per-level art (bg layers, floor, platforms, decor) is `cacheAsTexture`d;
  animated things (glow clusters, fireflies, motes, entities) are NOT cached.

### Adding / theming a cave

A theme is one file: `level/themes/<style>.ts` exporting a `ThemePack`
(metadata + lighting + optional mechanic + only the draw hooks it needs). Add its
`ThemeStyle` literal to the union in `themes.ts` and the pack to `THEME_PACKS`.
Reuse existing `DecorKind`s for scatter; express identity through the hooks.
Per-theme assets (e.g. monster reskins via `monsterSkin`) live in
`art/themes/<style>/`. Omitted hooks use generic defaults, so a minimal pack is
just palette + lighting + a hook or two.

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

Pick a hero (Aubrey/strawberry, Quinn/acorn, Summer/big-hair, Hallie/crystal,
Ruth/glasses), free every caticorn in a cave, then reach the glowing exit. Clear
six caves to win. Each run picks a random 6 of ~14 bespoke themes (cherry
blossom, crystal, ice, crypt, grove, molten, disco, tropical, Brighton beach,
halloween, cat, minecraft, mario, candy) in random order — each with its own
background silhouettes, floor/platform skin, decor, accent-tinted cages/shackles,
ambient particle, lighting and a one-shot music sting; some have a signature
mechanic (ice = slippery, molten = hazard-dense, grove = bouncy ground) and ALL
reskin their monsters via `monsterSkin` (crypt skeletons/ghosts, minecraft
creeper, mario goomba/koopa/piranha, cat cats, seaside crab/seagull, etc.). A
couple of themes also reskin the rescuable CAPTIVES via the `style` arg on
`drawCaticorn` (tropical = blue koala-alien with the horn kept; mario =
Peach-style princess). The final cave is guarded by the "Luke" boss (a
sword-swinging crawler stationed in front of the exit).

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
- **Extras**: trampolines, floating flutes, ambient fireflies + themed motes,
  day/night tint, hit-stop + screen shake + particle juice. At a locked exit,
  waypoint arrows point to whoever you missed. The win screen lists achievements
  earned (no damage / no kills / no falls / no poo) + a FLAWLESS badge if all
  four held; buttons offer Play again or Return to start.
- **Mobile**: a nipplejs floating joystick (left half) + jump zone (right half);
  installable as a PWA (manifest + service worker + add-to-home-screen prompt).
- **Debug**: `?debug=true` adds a level-select listing every theme (jumps
  straight in via a showcase build).

## Astro reference

Full docs: https://docs.astro.build — routing, components, framework components,
content collections, styling/Tailwind, i18n.
