/**
 * Stackra file contract:
 * Purpose: `BurnRateAlert`, one multi-window burn-rate alert of one objective: it fires while the error ratio over
 *          both the long and the short window is above `threshold`, the ratio at which the objective's error budget
 *          burns `burnRate` times faster than the window allows.
 * Boundary: type only; pure data in the plan. `prometheusSloRules` renders it as a Prometheus alerting rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 3); ADR 0185 (decision 1: critical pages on-call).
 */
import type { SliKind } from "#core/enums/sli-kind.enum";

/** One burn-rate alert of one objective. */
export type BurnRateAlert = {
  /** The service member. */
  readonly service: string;
  /** The objective's indicator. */
  readonly kind: SliKind;
  /** `critical` pages whoever is on call (`notify.critical`); `warning` opens a ticket (`notify.warning`). */
  readonly severity: "critical" | "warning";
  /**
   * How many times faster than sustainable the budget burns at the threshold (14.4 for an hour on a 30-day window);
   * never below 1, the rate at which the budget runs out exactly at the window's end.
   */
  readonly burnRate: number;
  /** The error ratio both windows must exceed: `burnRate × (1 − target)`. */
  readonly threshold: number;
  /** The share of the window's budget the long window spends at this rate. */
  readonly budgetSpent: number;
  /** The long window, as a Prometheus duration (`1h`). */
  readonly longWindow: string;
  /** The short window, a twelfth of the long one (`5m`), so the alert stops soon after the burn stops. */
  readonly shortWindow: string;
};
