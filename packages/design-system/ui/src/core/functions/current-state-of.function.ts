/**
 * Stackra file contract:
 * Purpose: how a navigation entry stands to the current place, in the one answer web and native both draw from:
 *          `page` for the entry the user is on, `ancestor` for an entry that only holds the current one among its
 *          descendants, and `none` for the rest. The web NavigationList maps them to `aria-current` (`page`, `true`) and
 *          the native one to the selected state.
 * Boundary: pure function over the item tree; no React, no router. It reads the `isCurrent` flags the app set and
 *           never decides which place is current (ADR 0314 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0314 (decisions 1 and 3); WCAG 2.2
 *          SC 1.3.1 and 4.1.2.
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** How an entry stands to the current place. */
export type CurrentState = "page" | "ancestor" | "none";

/** True when any descendant of the item is flagged as the current place. */
function hasCurrentDescendant(item: NavigationItem): boolean {
  return (item.children ?? []).some(
    (child) => child.isCurrent === true || hasCurrentDescendant(child),
  );
}

/**
 * Returns how the item stands to the current place. An item that is flagged current but also holds a current
 * descendant is an ancestor: the deepest flagged entry is the page, so a trail of flagged entries has one `page`.
 * @param item - the navigation entry, with its nested `children`
 * @returns `page`, `ancestor` or `none`
 */
export function currentStateOf(item: NavigationItem): CurrentState {
  if (hasCurrentDescendant(item)) return "ancestor";
  return item.isCurrent === true ? "page" : "none";
}
