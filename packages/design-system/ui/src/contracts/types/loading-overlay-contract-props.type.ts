/**
 * Stackra file contract:
 * Purpose: `LoadingOverlayContractProps`, the props every runtime's `LoadingOverlay` takes: a region whose content is
 *          covered and blocked while it loads, with a spinner and an optional message.
 * Boundary: types only; the content stays laid out underneath, so nothing jumps when the overlay lifts.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `LoadingOverlay`. */
export interface LoadingOverlayContractProps {
  /** The region's content. */
  readonly children: ReactNode;
  /** True while the content is loading or saving: it is covered, blocked and hidden from screen readers. */
  readonly isLoading: boolean;
  /** What is happening, for example "Saving the price list…"; defaults to the catalogue's "Loading…". */
  readonly message?: string | undefined;
}
