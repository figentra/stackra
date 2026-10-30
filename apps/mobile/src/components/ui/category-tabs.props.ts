/**
 * Stackra file contract:
 * Purpose: `CategoryTabsProps`: props of `CategoryTabs`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec (2026-10-27) section 3.3.
 */

/** Props of {@link CategoryTabs}. */
export interface CategoryTabsProps {
  /** The spoken name of the tab list. */
  readonly label: string;
  /** The page on screen: `ALL_PAGE` or a category id. */
  readonly page: string;
  /** Called with the page the user tapped. */
  readonly onPageChange: (page: string) => void;
}
