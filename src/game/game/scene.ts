import { type Container, Graphics } from "pixi.js";
import {
	drawBackground,
	drawDecor,
	drawFlute,
	drawGrassBlades,
	drawTrampoline,
	type PlayerVariant,
} from "../art";
import { Caticorn } from "../entities/Caticorn";
import { Exit } from "../entities/Exit";
import { createMonster, type Monster } from "../entities/Monster";
import { Player } from "../entities/Player";
import type { Fireflies } from "../systems/Fireflies";
import type { HealthBar } from "../systems/HealthBar";
import { GAME_HEIGHT, type Level, type Rect } from "../types";

/** A flute pickup: sprite + collision box + drift state. */
export interface FluteEntry {
	view: Container;
	box: Rect;
	taken: boolean;
	homeX: number;
	homeY: number;
	phase: number;
}

/** The freshly-built per-level scene: entities + collision geometry. */
export interface Scene {
	caticorns: Caticorn[];
	monsters: Monster[];
	trampolines: Rect[];
	spikes: Rect[];
	flutes: FluteEntry[];
	exit: Exit;
	player: Player;
}

/**
 * Build a level's scene into the (already-cleared) world container in the exact
 * order Game previously inlined: background, fireflies, decor (registering
 * stalactite spikes), platforms + grass, trampolines, flutes, exit, caticorns,
 * monsters, then the player + floating health bar on top. Iteration order is
 * preserved so deterministic spawning is unchanged.
 */
export function loadScene(
	world: Container,
	level: Level,
	variant: PlayerVariant,
	fireflies: Fireflies,
	healthBar: HealthBar,
): Scene {
	const caticorns: Caticorn[] = [];
	const monsters: Monster[] = [];
	const trampolines: Rect[] = [];
	const spikes: Rect[] = [];
	const flutes: FluteEntry[] = [];

	// Background gradient + cave mood, then ambient fireflies in front of it
	// but behind gameplay.
	world.addChild(drawBackground(level.worldWidth, level.bg));
	fireflies.spawn(level.worldWidth, 14);
	world.addChild(fireflies.view);

	// Decor placement by kind: stalactites hang from the ceiling, wall cracks
	// use their own y up the cave wall, everything else sits on the floor.
	// Only ceiling stalactites are lethal (avoidable); the rest is decorative
	// so the ground path stays walkable and levels remain fair.
	const floorY = GAME_HEIGHT - 30;
	for (const d of level.decor) {
		const g = drawDecor(d, level.themeAccent);
		g.x = d.x;
		if (d.kind === "stalactite") g.y = 0;
		else if (d.kind === "crack") g.y = d.y;
		else g.y = floorY;
		world.addChild(g);

		if (d.kind === "stalactite") {
			// Spike points down from the ceiling, length ~size*2.
			spikes.push({
				x: d.x - d.size * 0.4,
				y: 0,
				w: d.size * 0.8,
				h: d.size * 2,
			});
		}
	}

	// Platforms (drawn here; entities don't own static geometry). Some get a
	// grassy top for variety.
	for (const p of level.platforms) {
		world.addChild(
			new Graphics()
				.roundRect(p.x, p.y, p.w, p.h, 4)
				.fill("#4a3a63")
				.stroke({ color: "#6d5a8c", width: 2 }),
		);
		if (p.grass) {
			const grass = drawGrassBlades(p.w);
			grass.x = p.x;
			grass.y = p.y;
			world.addChild(grass);
		}
	}

	// Trampolines: bounce-zones drawn on the ground.
	for (const spec of level.trampolines) {
		const g = drawTrampoline();
		g.x = spec.x;
		g.y = spec.y;
		world.addChild(g);
		// Box covers the springy pad (top ~22px of the sprite).
		trampolines.push({ x: spec.x - 30, y: spec.y - 24, w: 60, h: 24 });
	}

	// Flutes: floating extra-life pickups. They drift in a lazy loop around
	// their home point (see the tick) so they're a little harder to grab.
	level.flutes.forEach((spec, i) => {
		const g = drawFlute();
		g.x = spec.x;
		g.y = spec.y;
		world.addChild(g);
		flutes.push({
			view: g,
			box: { x: spec.x - 14, y: spec.y - 36, w: 28, h: 38 },
			taken: false,
			homeX: spec.x,
			homeY: spec.y,
			// Stagger starting phase per flute so they don't move in lockstep.
			phase: i * 1.7,
		});
	});

	// Exit gate.
	const exit = Exit.create(level.exit);
	world.addChild(exit.view);

	// Caticorns to rescue.
	for (const spec of level.caticorns) {
		const cat = Caticorn.create(spec);
		caticorns.push(cat);
		world.addChild(cat.view);
	}

	// Monsters.
	for (const spec of level.monsters) {
		const m = createMonster(spec, level.themeAccent);
		monsters.push(m);
		world.addChild(m.view);
	}

	// Player on top, with the floating health bar above it.
	const player = Player.create(level.spawn, variant);
	world.addChild(player.view);
	world.addChild(healthBar.view);

	return { caticorns, monsters, trampolines, spikes, flutes, exit, player };
}
