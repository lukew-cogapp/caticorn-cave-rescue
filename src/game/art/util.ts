import type { Graphics } from "pixi.js";

/**
 * Parse a `#rrggbb` (or `rrggbb`) hex string into an `[r, g, b]` triple of
 * 0-255 integers. Used by the background gradient interpolation.
 */
export function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	const r = Number.parseInt(h.slice(0, 2), 16);
	const g = Number.parseInt(h.slice(2, 4), 16);
	const b = Number.parseInt(h.slice(4, 6), 16);
	return [r, g, b];
}

/** Linear-interpolate two 0-255 channel values and clamp to an integer. */
export function lerp(a: number, b: number, t: number): number {
	return Math.round(a + (b - a) * t);
}

/** Pack an `[r, g, b]` triple into a single `0xRRGGBB` colour number. */
export function packRgb(r: number, g: number, b: number): number {
	return (r << 16) | (g << 8) | b;
}

/** Clamp a colour channel to a valid 0-255 integer (guards against under/overflow). */
export function clampByte(n: number): number {
	return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * Mix two `#rrggbb` hex colours and pack the result, reusing the existing
 * {@link hexToRgb}/{@link lerp}/{@link packRgb} helpers. `t=0` returns `a`,
 * `t=1` returns `b`. Lets the decor tone ramps be derived from one base colour.
 */
export function mixHex(a: string, b: string, t: number): number {
	const [ar, ag, ab] = hexToRgb(a);
	const [br, bg, bb] = hexToRgb(b);
	return packRgb(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
}

/**
 * Recolour a base `#rrggbb` colour toward a theme `accent`, returning a packed
 * `0xRRGGBB`. Blends each channel a fraction `t` toward the accent (clamped to
 * 0-255), so a level's monsters/decor pick up its mood without losing their
 * silhouette. With no accent it returns the base colour unchanged.
 *
 * @param base - The sprite's intrinsic `#rrggbb` colour.
 * @param accent - Optional theme accent `#rrggbb` to blend toward.
 * @param t - Blend strength 0..1 (0 keeps base; 1 is full accent).
 * @returns Packed `0xRRGGBB` colour ready for a Pixi fill/stroke.
 */
export function tint(
	base: string,
	accent: string | undefined,
	t: number,
): number {
	const [br, bg, bb] = hexToRgb(base);
	if (!accent) return packRgb(clampByte(br), clampByte(bg), clampByte(bb));
	const [ar, ag, ab] = hexToRgb(accent);
	return packRgb(
		clampByte(lerp(br, ar, t)),
		clampByte(lerp(bg, ag, t)),
		clampByte(lerp(bb, ab, t)),
	);
}

/**
 * As {@link tint}, but returns a `#rrggbb` string for the few helpers (such as
 * {@link addSpire}) that take colour strings rather than packed numbers.
 *
 * @param base - The intrinsic `#rrggbb` colour.
 * @param accent - Optional theme accent `#rrggbb` to blend toward.
 * @param t - Blend strength 0..1.
 * @returns A `#rrggbb` hex string.
 */
export function tintStr(
	base: string,
	accent: string | undefined,
	t: number,
): string {
	return `#${tint(base, accent, t).toString(16).padStart(6, "0")}`;
}

/**
 * Deterministic small offset in `[-amp, amp]` keyed off `size` and an integer
 * `seed`, so repeated decor of the same kind varies without `Math.random`. Uses
 * the fractional part of a scaled sine as a cheap pseudo-random source.
 */
export function wobble(size: number, seed: number, amp: number): number {
	const f = Math.sin(size * 12.9898 + seed * 78.233) * 43758.5453;
	return ((f - Math.floor(f)) * 2 - 1) * amp;
}

/**
 * Draw a tapered, multi-segment cave spire into `g` from a base at y=0 toward a
 * tip at `(tipX, dir*len)`, where `dir` is `+1` (down, stalactite) or `-1` (up,
 * stalagmite). Renders a 3-tone ramp (shadow body, lit edge, dark core seam) and
 * faint mineral bands. `seg` segment count and the per-segment lean give variety.
 */
export function addSpire(
	g: Graphics,
	halfW: number,
	len: number,
	dir: number,
	tipX: number,
	seg: number,
	light: string,
	mid: string,
	dark: string,
): void {
	// Build a slightly wavy left and right edge that converges toward the tip.
	const left: number[] = [];
	const right: number[] = [];
	for (let i = 0; i <= seg; i++) {
		const t = i / seg;
		const y = dir * len * t;
		// Width tapers with a soft curve so the spire bulges near the base.
		const w = halfW * (1 - t) * (0.85 + 0.15 * (1 - t));
		const cx = tipX * t + wobble(len + i, i * 7 + 1, halfW * 0.06);
		left.push(cx - w, y);
		right.push(cx + w, y);
	}
	// Shadowed full silhouette.
	const poly = left.concat(right.reverse());
	g.poly(poly).fill(mid);
	// Lit edge: a slim sliver down the left side using the lighter tone.
	const lit: number[] = [];
	for (let i = 0; i <= seg; i++) {
		const lx = left[i * 2];
		const ly = left[i * 2 + 1];
		lit.push(lx, ly);
	}
	for (let i = seg; i >= 0; i--) {
		const t = i / seg;
		lit.push(left[i * 2] + halfW * 0.28 * (1 - t), left[i * 2 + 1]);
	}
	g.poly(lit).fill(light);
	// Dark core seam on the right for depth.
	const seam: number[] = [];
	for (let i = 0; i <= seg; i++) {
		seam.push(right[i * 2] - halfW * 0.22 * (1 - i / seg), right[i * 2 + 1]);
	}
	for (let i = seg; i >= 0; i--) {
		seam.push(right[i * 2], right[i * 2 + 1]);
	}
	g.poly(seam).fill(dark);
	// Faint mineral banding: a couple of thin cross strokes.
	for (let b = 1; b <= 2; b++) {
		const t = b / 3;
		const y = dir * len * t;
		const w = halfW * (1 - t) * 0.9;
		const cx = tipX * t;
		g.moveTo(cx - w, y)
			.lineTo(cx + w, y)
			.stroke({ color: dark, width: Math.max(1, halfW * 0.12), alpha: 0.35 });
	}
}
