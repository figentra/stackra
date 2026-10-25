/**
 * Stackra file contract:
 * Purpose: one action on a record or on a selection of records: the same menu-leaf fields as `MenuLeafItem` (key,
 *          text, icon, shortcut hint, tone, disabled and why, link) with a handler that may be asynchronous. DataTable
 *          lists a row's actions in its row menu and BulkActionBar lists the selection's actions as buttons, both from
 *          this one type, so an action defined once serves both and an ActionMenu takes it as it is.
 * Boundary: types only. The handler closes over the record or the selected keys, because the app already holds both;
 *           the table and the bar never pass them back. While a returned promise is pending the action shows busy and
 *           refuses a second press, and a rejection leaves the selection as it was (ADR 0318).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7, props vocabulary); ADR 0312 (menu items);
 *          ADR 0139 (action UX); ADR 0318.
 */
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";

/** An action on a record or a selection, with a handler that may take time. */
export interface ResourceAction extends Omit<MenuLeafItem, "onPress"> {
  /**
   * Called when the action is chosen, before `href` is followed. Return a promise for work that takes time: the action
   * shows busy until it settles, and a rejection is the app's to report (a toast or an `ErrorState`).
   */
  readonly onPress?: (() => void | Promise<void>) | undefined;
}
