/**
 * Stackra file contract:
 * Purpose: `MoneyFormatter`, what `useMoney()` returns: a function that formats a `Money`, or minor units in a
 *          currency, for the active locale and digits.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units), ADR 0192.
 */
import type { Money } from "@stackra/money";

/** Formats an amount in the active locale. */
export interface MoneyFormatter {
  /** `money(Money.ofMinor(9_900, "SAR"))` → `"SAR 99.00"` in `en`. */
  (amount: Money): string;

  /**
   * `money(order.totals.totalMinor, order.totals.currency)`.
   *
   * @throws RangeError when `minor` is not a safe integer or `currency` is not an ISO 4217 code with minor units.
   */
  (minor: number, currency: string): string;
}
