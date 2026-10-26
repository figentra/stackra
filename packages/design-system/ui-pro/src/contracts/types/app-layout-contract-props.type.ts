/**
 * Stackra file contract:
 * Purpose: the props the web `AppLayout` compound takes from the shared vocabulary: the shell's children, and the
 *          accessible names of its two icon buttons.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `AppLayout` root. */
export interface AppLayoutContractProps {
  /** The main content, drawn in the column beside the sidebar. */
  readonly children: ReactNode;
}
