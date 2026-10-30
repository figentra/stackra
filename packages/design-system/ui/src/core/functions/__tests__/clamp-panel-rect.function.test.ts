/**
 * Stackra file contract:
 * Purpose: proves `clampPanelRect` keeps a box that fits as it is, moves a box back inside the viewport, shrinks one
 *          larger than the viewport, and lets a minimised panel sit lower by its drawn height.
 * Boundary: pure function test.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { clampPanelRect } from "#core/functions/clamp-panel-rect.function";

const VIEWPORT = { width: 1000, height: 800 };

describe("clampPanelRect", () => {
  it("keeps a box that fits", () => {
    const rect = { x: 10, y: 20, width: 300, height: 400 };
    expect(clampPanelRect(rect, VIEWPORT)).toEqual(rect);
  });

  it("moves a box back inside", () => {
    expect(clampPanelRect({ x: -50, y: 700, width: 300, height: 400 }, VIEWPORT)).toEqual({
      x: 0,
      y: 400,
      width: 300,
      height: 400,
    });
    expect(clampPanelRect({ x: 900, y: -5, width: 300, height: 400 }, VIEWPORT).x).toBe(700);
  });

  it("shrinks a box larger than the viewport", () => {
    expect(clampPanelRect({ x: 0, y: 0, width: 2000, height: 900 }, VIEWPORT)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    });
  });

  it("lets a minimised panel sit lower", () => {
    expect(clampPanelRect({ x: 0, y: 790, width: 300, height: 400 }, VIEWPORT, 40).y).toBe(760);
  });
});
