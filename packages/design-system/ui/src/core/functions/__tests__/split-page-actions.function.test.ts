/**
 * Stackra file contract:
 * Purpose: proves `splitPageActions` shows every action when there are three or fewer, shows the first three and
 *          overflows the rest in order when there are more, copes with none, and keeps the caller's objects.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0317 (decision 1); ADR 0022 (test placement).
 */
// @covers sta-350:FR-163
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { PAGE_HEADER_VISIBLE_ACTIONS } from "#core/constants/page-header-visible-actions.constant";
import { splitPageActions } from "#core/functions/split-page-actions.function";

/** `count` actions with the keys `a1`, `a2` and so on. */
const actionsOf = (count: number): MenuLeafItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `a${index + 1}`,
    label: `Action ${index + 1}`,
  }));

describe("splitPageActions", () => {
  it("shows three actions at most", () => {
    expect(PAGE_HEADER_VISIBLE_ACTIONS).toBe(3);
  });

  it("shows everything when the actions fit, so nothing overflows", () => {
    for (const count of [0, 1, 3]) {
      const { visible, overflow } = splitPageActions(actionsOf(count));
      expect(visible).toHaveLength(count);
      expect(overflow).toEqual([]);
    }
  });

  it("shows the first three and overflows the rest in order", () => {
    const { visible, overflow } = splitPageActions(actionsOf(6));
    expect(visible.map((action) => action.id)).toEqual(["a1", "a2", "a3"]);
    expect(overflow.map((action) => action.id)).toEqual(["a4", "a5", "a6"]);
  });

  it("overflows a single action when there is one more than fits", () => {
    expect(splitPageActions(actionsOf(4)).overflow.map((action) => action.id)).toEqual(["a4"]);
  });

  it("keeps the caller's objects", () => {
    const actions = actionsOf(4);
    const { visible, overflow } = splitPageActions(actions);
    expect(visible[0]).toBe(actions[0]);
    expect(overflow[0]).toBe(actions[3]);
  });
});
