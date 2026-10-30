/**
 * Stackra file contract:
 * Purpose: `ViewStackViewContractProps`, the props of one `ViewStack.View`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); WCAG 2.2 SC 2.4.3 and 4.1.2.
 */
import type { ReactNode } from "react";

/** Props of `ViewStack.View`. */
export interface ViewStackViewContractProps {
  /** The view's id, what `push` takes. */
  readonly id: string;
  /** The view's accessible name, read when it is shown and focus moves to it. */
  readonly label: string;
  /** The view's content. */
  readonly children: ReactNode;
}
