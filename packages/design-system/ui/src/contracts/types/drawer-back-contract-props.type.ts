/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Drawer.Back` takes: the button at the header's start that goes back one view
 *          inside the drawer, or closes this layer of a stack of drawers to show the one under it.
 * Boundary: types only. `Drawer.Header` draws one by itself when there is somewhere to go back to; the part is for a
 *           caller that places it elsewhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left: the chevron mirrors); WCAG 2.2 SC 2.4.3 and 4.1.2.
 */

/** Props shared by the web and native `Drawer.Back`. */
export interface DrawerBackContractProps {
  /** The accessible name; defaults to "Back" in the app's language. */
  readonly label?: string | undefined;
  /** Called instead of the default (pop the view, or close this layer). */
  readonly onPress?: (() => void) | undefined;
}
