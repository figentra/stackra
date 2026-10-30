/**
 * Stackra file contract:
 * Purpose: `ViewStackState`, what `useViewStack()` returns inside a `ViewStack`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3).
 */

/** The stack of a `ViewStack` and the calls that move it. */
export interface ViewStackState {
  /** The view ids from the bottom to the top. */
  readonly stack: readonly string[];
  /** The id of the view on top, the one shown. */
  readonly current: string;
  /** True when there is a view under the top one to go back to. */
  readonly canGoBack: boolean;
  /** Shows a view on top of the current one. */
  readonly push: (view: string) => void;
  /** Goes back one view; does nothing on the bottom one. */
  readonly pop: () => void;
}
