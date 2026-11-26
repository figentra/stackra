/**
 * Stackra file contract:
 * Purpose: `BURN_RATE_WINDOWS`, the multi-window, multi-burn-rate alert table of the Google SRE workbook ("Alerting on
 *          SLOs", the recommended parameters): each row spends a share of the objective's error budget over a long
 *          window and also checks a short window a twelfth as long, so the alert fires fast and resets fast. Two rows
 *          page (critical): 2% of the budget in an hour, 5% in six hours. Two open a ticket (warning): 10% in a day,
 *          10% in three days.
 * Boundary: internal data; `observabilityPlan` turns each row into a burn rate for the runway's objective window
 *           (14.4, 6, 3 and 1 for 30 days), never below 1 (a shorter window holds a slow row at 1). Windows are
 *           Prometheus durations.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 3); ADR 0185 (decision 1: critical pages on-call).
 */
import type { BurnRateWindow } from "#core/types/burn-rate-window.type";

/** The four rows, fastest burn first. */
export const BURN_RATE_WINDOWS: readonly BurnRateWindow[] = [
  { budgetSpent: 0.02, longWindow: "1h", longHours: 1, shortWindow: "5m", severity: "critical" },
  { budgetSpent: 0.05, longWindow: "6h", longHours: 6, shortWindow: "30m", severity: "critical" },
  { budgetSpent: 0.1, longWindow: "1d", longHours: 24, shortWindow: "2h", severity: "warning" },
  { budgetSpent: 0.1, longWindow: "3d", longHours: 72, shortWindow: "6h", severity: "warning" },
];
