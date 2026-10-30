/**
 * Stackra file contract:
 * Purpose: `NavigationMenuContractProps`, the props of the web `NavigationMenu`: a site's top bar of links, where an
 *          entry with children opens a panel of links (a mega menu when they carry a line each).
 * Boundary: types only. Web only: a phone app navigates by its tab bar and lists (`TabBar`, `NavigationList`), and a
 *           hover-and-panel bar has no native counterpart.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA disclosure navigation pattern; STA-1371 (wave C).
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** Props of the web `NavigationMenu`. */
export interface NavigationMenuContractProps {
  /**
   * The top-level entries, in order. An entry with `children` is a button that opens a panel of its children's links
   * (with their `description` and `icon`); any other entry is a link.
   */
  readonly items: readonly NavigationItem[];
  /** The landmark's name; defaults to the catalogue's "Main navigation". Name it when a page has two. */
  readonly label?: string | undefined;
  /** The panel's columns: 1 (the default) or 2, for a mega menu of many links. */
  readonly columns?: 1 | 2 | undefined;
}
