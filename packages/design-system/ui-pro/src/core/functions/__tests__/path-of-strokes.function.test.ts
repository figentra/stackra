/**
 * Stackra file contract:
 * Purpose: unit tests of `pathOfStrokes`: one move per stroke and a line per further point, rounded to a tenth, a tap as
 *          a dot, and empty strokes skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0310 (decision 3).
 */
import { pathOfStrokes } from "#core/functions/path-of-strokes.function";

describe("pathOfStrokes", () => {
  it("draws each stroke from a move and lines", () => {
    expect(
      pathOfStrokes([
        [
          [1, 2],
          [3, 4.25],
        ],
        [],
        [
          [10.04, 0],
          [11, 1],
          [12, 2],
        ],
      ]),
    ).toBe("M1 2L3 4.3M10 0L11 1L12 2");
  });

  it("draws a tap as a dot", () => {
    expect(pathOfStrokes([[[5, 5]]])).toBe("M5 5L5.1 5");
    expect(pathOfStrokes([])).toBe("");
  });
});
