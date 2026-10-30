/**
 * Stackra file contract:
 * Purpose: the props of the native `PullToRefresh`: a scrolling area that reloads when pulled down from the top, with the platform's own spinner tinted by the theme.
 * Boundary: types only. The reload itself is the app's, in `onRefresh`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

/** Props of the native `PullToRefresh`. */
export interface PullToRefreshContractProps {
  /** The content that scrolls. */
  readonly children: ReactNode;
  /** Called on a pull; while its promise runs the spinner shows. */
  readonly onRefresh: () => Promise<void> | void;
  /** True to show the spinner from the app's side (a reload it started); controlled when given. */
  readonly isRefreshing?: boolean | undefined;
  /** What the spinner says to assistive technology and under it on iOS, for example "Refreshing orders". */
  readonly label?: string | undefined;
}
