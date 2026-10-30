/**
 * Stackra file contract:
 * Purpose: `DemoBoundaryProps`, props of the error boundary around a live demo.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 5.
 */
import type { ReactNode } from "react";

/** Props of `DemoBoundary`. */
export interface DemoBoundaryProps {
  /** The demo. */
  readonly children: ReactNode;
  /** What to draw when the demo throws. */
  readonly fallback: ReactNode;
}
