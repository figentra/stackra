/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SystemBanner` takes: an app-wide message (an outage, a trial ending, a compliance
 *          notice) across the top of the app, with its detail, actions and an optional dismiss.
 * Boundary: types only. Whether it was dismissed before is the caller's fact; the banner reports the dismiss and
 *           collapses. `EnvironmentBanner` stays the persistent, non-dismissible environment strip.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 27 (owner approval 2026-10-28, P1 + P2 core); ADR 0302 (decision 3).
 */
import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";

/** Props shared by the web and native `SystemBanner`. */
export interface SystemBannerContractProps extends AlertContractProps {
  /** True, the default, to draw a dismiss button. */
  readonly isDismissible?: boolean | undefined;
  /** Called once the banner has collapsed after a dismiss. */
  readonly onDismiss?: (() => void) | undefined;
  /** The dismiss button's accessible name; defaults to "Dismiss message". */
  readonly dismissLabel?: string | undefined;
}
