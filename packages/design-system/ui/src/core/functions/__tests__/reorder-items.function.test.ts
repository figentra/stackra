/**
 * Stackra file contract:
 * Purpose: proves `reorderItems` drops rows before or after a target, keeps several moved rows in order, and returns
 *          the list unchanged for an unknown target or a target that is itself moving.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 10.
 */
import { reorderItems } from "#core/functions/reorder-items.function";

const ROWS = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (rows: readonly { id: string }[]) => rows.map((row) => row.id).join("");

describe("reorderItems", () => {
  it("drops before or after the target", () => {
    expect(ids(reorderItems(ROWS, new Set(["a"]), "c", "after"))).toBe("bcad");
    expect(ids(reorderItems(ROWS, new Set(["d"]), "a", "before"))).toBe("dabc");
  });

  it("keeps several moved rows in their order", () => {
    expect(ids(reorderItems(ROWS, new Set(["c", "a"]), "d", "after"))).toBe("bdac");
  });

  it("returns the list unchanged for an unknown or moving target", () => {
    expect(reorderItems(ROWS, new Set(["a"]), "z", "after")).toBe(ROWS);
    expect(reorderItems(ROWS, new Set(["a"]), "a", "after")).toBe(ROWS);
  });
});
