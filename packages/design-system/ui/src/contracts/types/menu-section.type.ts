/**
 * Stackra file contract:
 * Purpose: one group of a Menu or ActionMenu: its key, its title and its entries. A divider is drawn between
 *          sections, and the title names the group for assistive technology whether it shows or not. With a
 *          `selectionMode` on the menu, selection is scoped to the section, so a menu can hold one choice for sorting
 *          and several for columns.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0312.
 */
import type { MenuItem } from "#contracts/types/menu-item.type";

/** One group of a menu. */
export interface MenuSection {
  /** The key of the section; unique within the menu. */
  readonly id: string;
  /** The name of the group: a visible heading, or only the accessible name when `isTitleHidden` is true. */
  readonly title: string;
  /** True to keep the title for assistive technology and draw no heading, as in a "more actions" menu. */
  readonly isTitleHidden?: boolean | undefined;
  /** The entries of the section, in order. */
  readonly items: readonly MenuItem[];
}
