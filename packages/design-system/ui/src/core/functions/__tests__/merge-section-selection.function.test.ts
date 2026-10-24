/**
 * Stackra file contract:
 * Purpose: proves `mergeSectionSelection` keeps the keys of the other sections, replaces the changed section's keys,
 *          clears a section when it has none chosen, and never changes the list it was given.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-106
import { mergeSectionSelection } from "#core/functions/merge-section-selection.function";

describe("mergeSectionSelection", () => {
  it("replaces the changed section's keys and keeps the others'", () => {
    expect(
      mergeSectionSelection(["asc", "name", "total"], ["name", "total", "date"], ["date"]),
    ).toEqual(["asc", "date"]);
  });

  it("clears a section that has nothing chosen now", () => {
    expect(mergeSectionSelection(["asc", "name"], ["name", "date"], [])).toEqual(["asc"]);
  });

  it("adds a section's first choice after the other sections' keys", () => {
    expect(mergeSectionSelection(["asc"], ["name", "date"], new Set(["date"]))).toEqual([
      "asc",
      "date",
    ]);
  });

  it("does not change the list it was given", () => {
    const selected = Object.freeze(["asc", "name"]);
    mergeSectionSelection(selected, ["name"], []);
    expect(selected).toEqual(["asc", "name"]);
  });
});
