/**
 * Stackra file contract:
 * Purpose: proves `barListRowsOf` ranks by value, keeps the given order on `none`, sizes against the largest or
 *          `max`, and draws no bar for zero or negative values.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { barListRowsOf } from "#core/functions/bar-list-rows-of.function";

const ITEMS = [
  { key: "a", label: "Jeddah", value: 50 },
  { key: "b", label: "Riyadh", value: 100 },
  { key: "c", label: "Abha", value: -5 },
];

describe("barListRowsOf", () => {
  it("ranks and sizes against the largest", () => {
    expect(barListRowsOf(ITEMS).map((row) => [row.key, row.share])).toEqual([
      ["b", 1],
      ["a", 0.5],
      ["c", 0],
    ]);
  });

  it("keeps the order on `none` and sizes against `max`", () => {
    expect(barListRowsOf(ITEMS, "none", 200).map((row) => row.share)).toEqual([0.25, 0.5, 0]);
  });

  it("draws empty bars for a list of zeros", () => {
    expect(barListRowsOf([{ key: "z", label: "z", value: 0 }])[0]?.share).toBe(0);
  });
});
