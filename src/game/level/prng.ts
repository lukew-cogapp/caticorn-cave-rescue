/**
 * Tiny deterministic PRNG (LCG). Seeded per level so layouts are stable across
 * runs (no Math.random / Date.now anywhere in this module).
 */
export function makeRng(seed: number): () => number {
	let s = seed & 0x7fffffff;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x7fffffff;
	};
}
