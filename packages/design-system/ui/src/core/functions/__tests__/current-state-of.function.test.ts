/**
 * Stackra file contract:
 * Purpose: proves `currentStateOf` for the current entry, an entry that only holds the current one, a current entry
 *          whose own child is current too, an unflagged entry, and a deeper descendant.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-155
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { currentStateOf } from "#core/functions/current-state-of.function";

describe("currentStateOf", () => {
  it("is `page` for the flagged entry with no flagged descendant", () => {
    expect(currentStateOf({ id: "a", label: "A", isCurrent: true })).toBe("page");
  });

  it("is `none` for an unflagged entry", () => {
    expect(currentStateOf({ id: "a", label: "A" })).toBe("none");
    expect(currentStateOf({ id: "a", label: "A", isCurrent: false })).toBe("none");
  });

  it("is `ancestor` for an entry that holds the current one, flagged or not", () => {
    const child: NavigationItem = { id: "b", label: "B", isCurrent: true };
    expect(currentStateOf({ id: "a", label: "A", children: [child] })).toBe("ancestor");
    expect(currentStateOf({ id: "a", label: "A", isCurrent: true, children: [child] })).toBe(
      "ancestor",
    );
  });

  it("looks through every level of nesting", () => {
    const deep: NavigationItem = {
      id: "a",
      label: "A",
      children: [{ id: "b", label: "B", children: [{ id: "c", label: "C", isCurrent: true }] }],
    };
    expect(currentStateOf(deep)).toBe("ancestor");
  });

  it("is `none` for an entry whose children are all unflagged", () => {
    expect(currentStateOf({ id: "a", label: "A", children: [{ id: "b", label: "B" }] })).toBe(
      "none",
    );
  });
});
