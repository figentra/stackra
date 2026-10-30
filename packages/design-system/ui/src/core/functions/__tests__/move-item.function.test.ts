/**
 * Stackra file contract:
 * Purpose: proves `moveItem` moves forward and back, and returns the same list for a no-op or an index out of range.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 10.
 */
import { moveItem } from "#core/functions/move-item.function";

describe("moveItem", () => {
  it("moves an item forward and back", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns the same list for a no-op or an index out of range", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, -1, 0)).toBe(items);
    expect(moveItem(items, 0, 2)).toBe(items);
  });
});
