/**
 * Stackra file contract:
 * Purpose: the dot loader's step maths: the indeterminate build's loop, steps, hold and clear, the determinate fill's
 *          rounding and clamping, and the cell sizes against the Spinner contract.
 * Boundary: unit tests only.
 * Runtime: node
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-001)
 */
// @covers sta-2017:FR-001
import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { dotLoaderLit } from "#core/functions/dot-loader-lit.function";

describe("dotLoaderLit", () => {
  it("builds nine dots in 80 ms steps, holds and clears: a 1280 ms loop", () => {
    expect(dotLoaderLit(0, 9)).toEqual({ lit: 1, nextMs: 80 });
    expect(dotLoaderLit(79, 9)).toEqual({ lit: 1, nextMs: 1 });
    expect(dotLoaderLit(80, 9)).toEqual({ lit: 2, nextMs: 80 });
    expect(dotLoaderLit(719, 9).lit).toBe(9);
    expect(dotLoaderLit(720, 9)).toEqual({ lit: 9, nextMs: 400 });
    expect(dotLoaderLit(1120, 9)).toEqual({ lit: 0, nextMs: 160 });
    expect(dotLoaderLit(1280, 9)).toEqual({ lit: 1, nextMs: 80 });
  });

  it("loops in 800 ms for the three-dot inline build", () => {
    const loop = 3 * DOT_LOADER.dotMs + DOT_LOADER.holdMs + DOT_LOADER.clearMs;
    expect(loop).toBe(800);
    expect(dotLoaderLit(240, 3)).toEqual({ lit: 3, nextMs: 400 });
    expect(dotLoaderLit(800, 3).lit).toBe(1);
  });

  it("treats a negative time as the start", () => {
    expect(dotLoaderLit(-50, 9).lit).toBe(1);
  });

  it("fills the Spinner contract's diameters with its cells", () => {
    expect(Object.values(DOT_LOADER.cell).map(({ dot, gap }) => 3 * dot + 2 * gap)).toEqual([
      16, 24, 32,
    ]);
  });
});

describe("dotLoaderFilled", () => {
  it.each([
    [0, 0],
    [1, 1],
    [50, 5],
    [99, 9],
    [100, 9],
  ])("fills %s of 100 as %s of nine dots, rounding up", (value, dots) => {
    expect(dotLoaderFilled(value, 0, 100, 9)).toBe(dots);
  });

  it("holds the value to the range", () => {
    expect(dotLoaderFilled(-5, 0, 100, 9)).toBe(0);
    expect(dotLoaderFilled(250, 0, 100, 9)).toBe(9);
    expect(dotLoaderFilled(3, 0, 12, 20)).toBe(5);
  });

  it("fills nothing for an empty range or no dots", () => {
    expect(dotLoaderFilled(5, 10, 10, 9)).toBe(0);
    expect(dotLoaderFilled(5, 0, 10, 0)).toBe(0);
  });
});
