/**
 * Stackra file contract:
 * Purpose: proves `nextSortDescriptor` starts an unsorted column ascending, flips an ascending column to descending,
 *          returns a descending column to ascending, and starts a different column ascending.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-122
import { nextSortDescriptor } from "#core/functions/next-sort-descriptor.function";

describe("nextSortDescriptor", () => {
  it("sorts a column ascending when nothing is sorted", () => {
    expect(nextSortDescriptor(undefined, "name")).toEqual({
      column: "name",
      direction: "ascending",
    });
  });

  it("flips an ascending column to descending", () => {
    expect(nextSortDescriptor({ column: "name", direction: "ascending" }, "name")).toEqual({
      column: "name",
      direction: "descending",
    });
  });

  it("returns a descending column to ascending", () => {
    expect(nextSortDescriptor({ column: "name", direction: "descending" }, "name")).toEqual({
      column: "name",
      direction: "ascending",
    });
  });

  it("starts another column ascending whatever the current one was", () => {
    expect(nextSortDescriptor({ column: "name", direction: "descending" }, "total")).toEqual({
      column: "total",
      direction: "ascending",
    });
  });
});
