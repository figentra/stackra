/**
 * Stackra file contract:
 * Purpose: `ViewStackContextValue`, what the web `ViewStack` shares with its views and back button: the public
 *          state `useViewStack()` returns, and whether the stack has moved since it mounted.
 * Boundary: types only; internal, not in the `react` barrel.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewStackState } from "#contracts/types/view-stack-state.type";

/** The stack's state and its moved flag. */
export interface ViewStackContextValue {
  /** The stack and the calls that move it. */
  readonly state: ViewStackState;
  /** True once a push or pop has happened: a view shown after that takes focus (web) or is announced (native). */
  readonly hasMoved: boolean;
}
