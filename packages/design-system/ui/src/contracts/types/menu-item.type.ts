/**
 * Stackra file contract:
 * Purpose: one entry of a Menu or ActionMenu section: an action (`MenuLeafItem`), or an action that opens a submenu
 *          of more actions when it carries `items`.
 * Boundary: types only. A submenu entry is a heading for its items: its own `href` and `onPress` are not read.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0312.
 */
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";

/** One entry of a menu section. */
export interface MenuItem extends MenuLeafItem {
  /** The actions of a submenu this entry opens; leave it out for an ordinary action. */
  readonly items?: readonly MenuLeafItem[] | undefined;
}
