/**
 * Stackra file contract:
 * Purpose: `ViewStackBackContractProps`, the props of `ViewStack.Back`, the button that goes back one view.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.2.
 */

/** Props of `ViewStack.Back`. */
export interface ViewStackBackContractProps {
  /** The visible label in the app's language, for example "Back" or the previous view's name. */
  readonly children: string;
}
