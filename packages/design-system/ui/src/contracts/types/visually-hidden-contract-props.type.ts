/**
 * Stackra file contract:
 * Purpose: `VisuallyHiddenContractProps`, the props shared by the web and native `VisuallyHidden`.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `VisuallyHidden`. */
export interface VisuallyHiddenContractProps {
  /** What a screen reader reads and the screen does not show, usually translated text. */
  readonly children: ReactNode;
}
