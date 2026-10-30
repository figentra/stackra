/**
 * Stackra file contract:
 * Purpose: proves `groupSelectItems` gathers a section's choices under it in first-appearance order, keeps each
 *          group's own order, leaves a list with no section as one headerless group, and keeps loose runs where they
 *          stand.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (Select sections).
 */
import { groupSelectItems } from "#core/functions/group-select-items.function";

const ids = (groups: ReturnType<typeof groupSelectItems>) =>
  groups.map(({ section, items }) => [section, items.map(({ id }) => id)]);

describe("groupSelectItems", () => {
  it("gathers each section's choices under it, sections in first-appearance order", () => {
    expect(
      ids(
        groupSelectItems([
          { id: "cairo", label: "Cairo", section: "Africa" },
          { id: "paris", label: "Paris", section: "Europe" },
          { id: "lagos", label: "Lagos", section: "Africa" },
        ]),
      ),
    ).toEqual([
      ["Africa", ["cairo", "lagos"]],
      ["Europe", ["paris"]],
    ]);
  });

  it("returns a list with no section as one headerless group in its own order", () => {
    expect(
      ids(
        groupSelectItems([
          { id: "b", label: "B" },
          { id: "a", label: "A" },
        ]),
      ),
    ).toEqual([[undefined, ["b", "a"]]]);
  });

  it("keeps loose runs where they stand, split by the sections between them", () => {
    expect(
      ids(
        groupSelectItems([
          { id: "any", label: "Any" },
          { id: "cairo", label: "Cairo", section: "Africa" },
          { id: "other", label: "Other" },
          { id: "more", label: "More" },
        ]),
      ),
    ).toEqual([
      [undefined, ["any"]],
      ["Africa", ["cairo"]],
      [undefined, ["other", "more"]],
    ]);
  });

  it("returns no group for no choices", () => {
    expect(groupSelectItems([])).toEqual([]);
  });
});
