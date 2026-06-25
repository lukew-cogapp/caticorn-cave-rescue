import { describe, expect, it } from "vitest";
import { type Rect, rectsOverlap } from "./types";

const r = (x: number, y: number, w: number, h: number): Rect => ({
	x,
	y,
	w,
	h,
});

describe("rectsOverlap", () => {
	it("detects overlapping rectangles", () => {
		expect(rectsOverlap(r(0, 0, 10, 10), r(5, 5, 10, 10))).toBe(true);
	});

	it("returns false for clearly separated rectangles", () => {
		expect(rectsOverlap(r(0, 0, 10, 10), r(20, 20, 5, 5))).toBe(false);
	});

	it("treats edge-touching rectangles as not overlapping", () => {
		// Shared edge only (right edge of A == left edge of B): no overlap.
		expect(rectsOverlap(r(0, 0, 10, 10), r(10, 0, 10, 10))).toBe(false);
	});

	it("is symmetric", () => {
		const a = r(0, 0, 30, 30);
		const b = r(10, 10, 5, 5);
		expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
	});

	it("detects full containment", () => {
		expect(rectsOverlap(r(0, 0, 100, 100), r(40, 40, 10, 10))).toBe(true);
	});
});
