/**
 * Stackra file contract:
 * Purpose: `BurnRateWindow`, one row of the multi-window, multi-burn-rate alert table (`BURN_RATE_WINDOWS`): the share
 *          of the error budget its long window spends, the long and short windows, and how loud the alert is.
 * Boundary: type only; internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 3).
 */

/** One row of the burn-rate table. */
export type BurnRateWindow = {
  /** The share of the whole window's error budget spent within `longWindow` at the alerting rate. */
  readonly budgetSpent: number;
  /** The long window, as a Prometheus duration (`1h`). */
  readonly longWindow: string;
  /** The long window in hours. */
  readonly longHours: number;
  /** The short window (a twelfth of the long one), so the alert stops soon after the burn stops. */
  readonly shortWindow: string;
  /** `critical` pages whoever is on call; `warning` opens a ticket. */
  readonly severity: "critical" | "warning";
};
