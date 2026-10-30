/**
 * Stackra file contract:
 * Purpose: proves `polarSectorsOf` gives each row an equal angle clockwise from the top, splits it between the series
 *          and sizes each slice against the largest value; and `waffleCellsOf` always hands out every square by the
 *          largest remainder.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { polarSectorsOf } from "#core/functions/polar-sectors-of.function";
import { waffleCellsOf } from "#core/functions/waffle-cells-of.function";

describe("polarSectorsOf", () => {
  it("gives each row an equal angle and sizes against the largest value", () => {
    const sectors = polarSectorsOf(
      [
        { m: "Jan", a: 2 },
        { m: "Feb", a: 4 },
      ],
      [{ key: "a", label: "A" }],
    );
    expect(sectors).toEqual([
      { row: 0, series: 0, start: 0, end: Math.PI, share: 0.5, value: 2 },
      { row: 1, series: 0, start: Math.PI, end: Math.PI * 2, share: 1, value: 4 },
    ]);
  });

  it("splits a row between its series and draws nothing for missing or negative values", () => {
    const sectors = polarSectorsOf(
      [
        { m: "Jan", a: 10, b: -1 },
        { m: "Feb", a: "x", b: 5 },
      ],
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
    );
    expect(sectors.map((sector) => [sector.start, sector.end])).toEqual([
      [0, Math.PI / 2],
      [Math.PI / 2, Math.PI],
      [Math.PI, (Math.PI * 3) / 2],
      [(Math.PI * 3) / 2, Math.PI * 2],
    ]);
    expect(sectors.map((sector) => [sector.share, sector.value])).toEqual([
      [1, 10],
      [0, undefined],
      [0, undefined],
      [0.5, 5],
    ]);
  });

  it("draws empty slices when every value is zero", () => {
    expect(polarSectorsOf([{ a: 0 }], [{ key: "a", label: "A" }])[0]?.share).toBe(0);
  });
});

describe("waffleCellsOf", () => {
  it("hands out every square by the largest remainder, ties to the earlier part", () => {
    expect(waffleCellsOf([1, 1, 1], 100)).toEqual([34, 33, 33]);
    expect(waffleCellsOf([62.5, 25, 12.5], 100)).toEqual([63, 25, 12]);
    expect(waffleCellsOf([1, 2, 3, 4], 50)).toEqual([5, 10, 15, 20]);
  });

  it("always sums to the grid", () => {
    const counts = waffleCellsOf([17, 29, 3, 51, 0.4], 64);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(64);
  });

  it("gives no squares to zero, negative or broken values, and none at all for an empty whole", () => {
    expect(waffleCellsOf([5, -3, Number.NaN], 10)).toEqual([10, 0, 0]);
    expect(waffleCellsOf([0, 0], 100)).toEqual([0, 0]);
  });
});
