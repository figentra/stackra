/**
 * Stackra file contract:
 * Purpose: proves the distribution helpers: histogram bins by Sturges, by count and by width, with the largest value in
 *          the last bin; and the box plot summary with interpolated quartiles, Tukey whiskers and outliers.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { boxStatsOf } from "#core/functions/box-stats-of.function";
import { bulletScaleOf } from "#core/functions/bullet-scale-of.function";
import { histogramBinsOf } from "#core/functions/histogram-bins-of.function";

describe("histogramBinsOf", () => {
  it("counts into equal bins, the largest value in the last", () => {
    expect(histogramBinsOf([1, 2, 2, 9], { binCount: 2 })).toEqual([
      { from: 1, to: 5, count: 3 },
      { from: 5, to: 9, count: 1 },
    ]);
  });

  it("uses Sturges' rule by default and a width when given", () => {
    const values = Array.from({ length: 16 }, (_, index) => index);
    expect(histogramBinsOf(values)).toHaveLength(5);
    const byWidth = histogramBinsOf([0, 10, 20, 25], { binWidth: 10 });
    expect(byWidth.map((bin) => [bin.from, bin.to, bin.count])).toEqual([
      [0, 10, 1],
      [10, 20, 1],
      [20, 30, 2],
    ]);
  });

  it("leaves out non-finite values and handles none or all equal", () => {
    expect(histogramBinsOf([Number.NaN])).toEqual([]);
    expect(histogramBinsOf([3, 3, Number.POSITIVE_INFINITY])).toEqual([
      { from: 3, to: 3, count: 2 },
    ]);
  });
});

describe("boxStatsOf", () => {
  it("interpolates quartiles and draws whiskers within 1.5 IQR", () => {
    expect(boxStatsOf([1, 2, 3, 4, 100])).toEqual({
      min: 1,
      max: 100,
      q1: 2,
      median: 3,
      q3: 4,
      low: 1,
      high: 4,
      outliers: [100],
    });
    expect(boxStatsOf([4, 1, 3, 2])).toMatchObject({
      q1: 1.75,
      median: 2.5,
      q3: 3.25,
      outliers: [],
    });
  });

  it("gives null for no values", () => {
    expect(boxStatsOf([])).toBeNull();
  });
});

describe("bulletScaleOf", () => {
  it("places bands, value and target in percent of the largest of them", () => {
    expect(
      bulletScaleOf({ key: "a", label: "A", value: 60, target: 80, ranges: [100, 50] }),
    ).toEqual({
      bands: [
        { from: 0, to: 50 },
        { from: 50, to: 100 },
      ],
      value: 60,
      target: 80,
    });
  });

  it("stretches the scale when the value passes the last band and draws negatives as zero", () => {
    const scale = bulletScaleOf({ key: "a", label: "A", value: 200, ranges: [100] });
    expect(scale.bands).toEqual([
      { from: 0, to: 50 },
      { from: 50, to: 100 },
    ]);
    expect(scale.target).toBeNull();
    expect(bulletScaleOf({ key: "b", label: "B", value: -5 }).value).toBe(0);
  });
});
