/**
 * Stackra file contract:
 * Purpose: proves `groupNotifications` keeps first-appearance group order and item order, and `badgeCountOf` caps at
 *          99+, uses the locale's digits and is empty for none.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
import { badgeCountOf } from "#core/functions/badge-count-of.function";
import { groupNotifications } from "#core/functions/group-notifications.function";

describe("groupNotifications", () => {
  it("groups by heading in first-appearance order and keeps item order", () => {
    const groups = groupNotifications([
      { id: "1", title: "a", group: "Today" },
      { id: "2", title: "b", group: "Yesterday" },
      { id: "3", title: "c", group: "Today" },
      { id: "4", title: "d" },
    ]);
    expect(groups.map((group) => [group.heading, group.items.map((item) => item.id)])).toEqual([
      ["Today", ["1", "3"]],
      ["Yesterday", ["2"]],
      [undefined, ["4"]],
    ]);
    expect(groupNotifications([])).toEqual([]);
  });
});

describe("badgeCountOf", () => {
  it("is empty for none, spells the count, and caps at 99+", () => {
    expect(badgeCountOf(0, "en")).toBe("");
    expect(badgeCountOf(-1, "en")).toBe("");
    expect(badgeCountOf(7, "en")).toBe("7");
    expect(badgeCountOf(140, "en")).toBe("99+");
  });

  it("uses the locale's digits", () => {
    expect(badgeCountOf(7, "ar-EG")).toBe("٧");
  });
});
