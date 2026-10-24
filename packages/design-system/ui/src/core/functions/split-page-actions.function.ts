/**
 * Stackra file contract:
 * Purpose: splits a PageHeader's ordered actions into the ones drawn as buttons and the ones that overflow into the
 *          ActionMenu, so the web and native header agree on which is which.
 * Boundary: pure; it reorders nothing and keeps the caller's objects.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 1, the page actions row).
 */
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { PAGE_HEADER_VISIBLE_ACTIONS } from "#core/constants/page-header-visible-actions.constant";

/** The two groups of a split list of actions. */
interface SplitPageActions {
  /** The first actions, drawn as buttons; the first of them is the primary action. */
  readonly visible: readonly MenuLeafItem[];
  /** The rest, in order, for the ActionMenu; empty when everything fits. */
  readonly overflow: readonly MenuLeafItem[];
}

/**
 * The actions drawn as buttons and the actions that overflow.
 * @param actions - the page's actions in priority order
 * @returns the first {@link PAGE_HEADER_VISIBLE_ACTIONS} and the remainder
 */
export function splitPageActions(actions: readonly MenuLeafItem[]): SplitPageActions {
  return {
    visible: actions.slice(0, PAGE_HEADER_VISIBLE_ACTIONS),
    overflow: actions.slice(PAGE_HEADER_VISIBLE_ACTIONS),
  };
}
