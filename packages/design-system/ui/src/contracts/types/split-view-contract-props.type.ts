/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SplitView` takes: a list pane and a detail pane side by side on a tablet or desktop, and one at a time on a phone, where `isSecondaryShown` picks which.
 * Boundary: types only. The breakpoint is the size class: side by side from `tablet`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `SplitView`. */
export interface SplitViewContractProps {
  /** The list pane, at the reading start. */
  readonly primary: ReactNode;
  /** The detail pane, at the reading end. */
  readonly secondary: ReactNode;
  /** On a phone, true to show the detail pane in place of the list. Ignored when both fit. */
  readonly isSecondaryShown?: boolean | undefined;
  /** The landmark name of the list pane, for example "Orders". */
  readonly primaryLabel: string;
  /** The landmark name of the detail pane, for example "Order details". */
  readonly secondaryLabel: string;
  /** The list pane's width when side by side, in points or CSS pixels. Defaults to 320. */
  readonly primaryWidth?: number | undefined;
}
