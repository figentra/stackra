/**
 * Stackra file contract:
 * Purpose: `PaymentLine`, one item of what is being paid for, as itemised checkouts and buy-now-pay-later providers ask.
 * Boundary: a type in the leaf entry; the unit price is a `Money` in the payment's currency.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0220 (integer minor units).
 */
import type { Money } from "@stackra/money";

/**
 * One line of the basket.
 *
 * @example
 * const line: PaymentLine = { name: "Haircut", quantity: 1, unitPrice: Money.of("120.00", "SAR") };
 */
export interface PaymentLine {
  /** What the customer sees. */
  readonly name: string;

  /** Whole units. */
  readonly quantity: number;

  /** Price of one unit. */
  readonly unitPrice: Money;

  /** The merchant's stock code, when there is one. */
  readonly sku?: string;
}
