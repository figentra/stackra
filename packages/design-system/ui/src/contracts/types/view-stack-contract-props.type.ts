/**
 * Stackra file contract:
 * Purpose: `ViewStackContractProps`, the props of `ViewStack` on every runtime: a drill-down inside one region, whose
 *          views are `ViewStack.View`s, one shown at a time, moved between with `useViewStack()`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); ADR 0329 (motion layer).
 */
import type { ReactNode } from "react";

import type { ViewStackTransition } from "#contracts/enums/view-stack-transition.enum";

/** Props of `ViewStack`. */
export interface ViewStackContractProps {
  /** The views, as `ViewStack.View` elements. */
  readonly children: ReactNode;
  /** The id of the view shown first, the bottom of the stack. */
  readonly defaultView: string;
  /** How a view enters and leaves. Defaults to `push`; the motion level can lower it to a fade or nothing. */
  readonly transition?: ViewStackTransition | undefined;
  /** Called with the view on top after every push and pop. */
  readonly onViewChange?: ((view: string) => void) | undefined;
}
