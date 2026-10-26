/**
 * Stackra file contract:
 * Purpose: `PayInput`, one pay-input line Figentra hands a payroll provider: whose it is, which pay item (hours,
 *          sessions, tips, commission, bonus), the period, and its quantity or amount.
 * Boundary: a type only. Figentra computes pay inputs and never runs payroll (owner RV-50); `item` is the tenant's pay
 *           item key, which a `PayrollExportProfile` turns into the provider's wage code. It holds personal data
 *           (an employee's pay) and is never logged here.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4); owner RV-50, RV-26, R3-SO-05.
 */

/** One pay-input line. */
export interface PayInput {
  /** The employee's number at the payroll provider. */
  readonly employee: string;

  /** The tenant's pay item key (`hours.regular`, `tips`, `commission`). */
  readonly item: string;

  /** The first day of the pay period, `YYYY-MM-DD`. */
  readonly periodStart: string;

  /** The last day of the pay period, `YYYY-MM-DD`. */
  readonly periodEnd: string;

  /** Hours, sessions or units; absent for a money-only item. */
  readonly quantity?: number;

  /** Money in major units of `currency`; absent for a quantity-only item. */
  readonly amount?: number;

  /** ISO 4217 code of `amount`. */
  readonly currency?: string;
}
