/**
 * Stackra file contract:
 * Purpose: proves `cellTextOf` reads the property a column's id names as text, writes numbers and booleans as
 *          `String` does, and gives an empty string for a missing or null property.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-123
import { cellTextOf } from "#core/functions/cell-text-of.function";

describe("cellTextOf", () => {
  const row = { id: "1", name: "Ada", total: 12.5, isPaid: false, note: null };

  it("reads the property the column names", () => {
    expect(cellTextOf(row, "name")).toBe("Ada");
  });

  it("writes a number and a boolean as text", () => {
    expect(cellTextOf(row, "total")).toBe("12.5");
    expect(cellTextOf(row, "isPaid")).toBe("false");
  });

  it("gives nothing for a null or missing property", () => {
    expect(cellTextOf(row, "note")).toBe("");
    expect(cellTextOf(row, "absent")).toBe("");
  });
});
