import type { Container } from "pixi.js";
import {
	type BackgroundLayers,
	drawBackgroundLayers,
	drawDecor,
	drawFloorStrip,
	drawFlute,
	drawGlowCluster,
	drawGrassBlades,
	drawPlatform,
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

/**
 * A pulsing ambient glow cluster in the far background: its Container plus the
 * phase offset that staggers its breathing relative to the others. The cluster
 * geometry is static; the tick drives `view.scale`/`view.alpha` from a shared
 * elapsed accumulator + this `phase`.
 */
export interface GlowEntry {
	view: Container;
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
	/** Parallax background depth layers; the tick scrolls each at its own rate. */
	bgLayers: BackgroundLayers;
	/** Pulsing ambient glow clusters parented to the far background layer. */
	glows: GlowEntry[];
}

/**
 * Build a level's scene into the (already-cleared) world container, back to
 * front: parallax background layers (far/mid/near) with ambient glow clusters
 * on the far layer, the drawn floor strip, fireflies, decor (registering
 * stalactite spikes), platforms + grass, trampolines, flutes, exit, caticorns,
 * monsters, then the player + floating health bar on top. Entity iteration order
 * is preserved so deterministic spawning is unchanged.
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
	const glows: GlowEntry[] = [];

	// Parallax cave background: three depth layers added back-to-front (far, mid,
	// near) so everything else renders on top. The tick offsets each layer's x
	// each frame to scroll them slower than the gameplay world (see Game.tick).
	const bgLayers = drawBackgroundLayers(
		level.worldWidth,
		level.bg,
		level.themeAccent,
	);
	world.addChild(bgLayers.far);
	world.addChild(bgLayers.mid);
	world.addChild(bgLayers.near);

	// Ambient pulsing glow clusters, parented to the FAR layer so they sit
	// deepest and inherit its slow parallax. Placed deterministically: positions,
	// radius and colour are derived from worldWidth + a fixed colour palette (no
	// Math.random). Phase is staggered per index so they breathe out of sync.
	const glowColors = [0x6fe3ff, 0x8f7bff, 0x6cff9e, 0xffd27b];
	const glowCount = Math.min(
		4,
		Math.max(2, Math.floor(level.worldWidth / 900)),
	);
	for (let i = 0; i < glowCount; i++) {
		// Spread clusters across the world width with a margin on each side.
		const frac = (i + 1) / (glowCount + 1);
		const gx = level.worldWidth * frac;
		const gy = GAME_HEIGHT * 0.4 + (i % 2) * GAME_HEIGHT * 0.18;
		const radius = 46 + (i % 3) * 14;
		const view = drawGlowCluster(radius, glowColors[i % glowColors.length], 0);
		view.x = gx;
		view.y = gy;
		bgLayers.far.addChild(view);
		// Stagger the breathing phase so clusters pulse independently.
		glows.push({ view, phase: i * 1.9 });
	}

	// Drawn ground strip along the bottom (surface sits at GAME_HEIGHT - 30,
	// handled internally), above the background but below decor + gameplay.
	world.addChild(drawFloorStrip(level.worldWidth, level.themeAccent));

	// Ambient fireflies in front of the backdrop but behind gameplay.
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
	// grassy top for variety. drawPlatform draws at local 0,0 = top-left, exactly
	// w x h (no overhang), so the collision rect is unchanged.
	for (const p of level.platforms) {
		const plat = drawPlatform(p.w, p.h, level.themeAccent);
		plat.x = p.x;
		plat.y = p.y;
		world.addChild(plat);
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

	return {
		caticorns,
		monsters,
		trampolines,
		spikes,
		flutes,
		exit,
		player,
		bgLayers,
		glows,
	};
}
