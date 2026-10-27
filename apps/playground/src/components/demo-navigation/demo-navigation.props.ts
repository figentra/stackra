/**
 * Stackra file contract:
 * Purpose: `DemoNavigationProps`: props of `DemoNavigation`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link DemoNavigation}. */
export interface DemoNavigationProps {
  /** The id of the current item. */
  current: string;
  /** Called with the id of the item the user pressed. */
  onNavigate: (id: string) => void;
}
