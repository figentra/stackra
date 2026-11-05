/**
 * Stackra file contract:
 * Purpose: `BudgetAlert`, one alert of a vended account's monthly budget: a percentage of the limit, on actual or
 *          forecast spend.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172, ADR 0524.
 */

/** One budget alert: a percentage of the limit, on actual or forecast spend. */
export interface BudgetAlert {
  readonly kind: "ACTUAL" | "FORECASTED";
  readonly percent: number;
}
