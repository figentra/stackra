/**
 * Stackra file contract:
 * Purpose: `BalancePart`, one partial payment against a `PaymentBalance`: its own payment reference, the share of the
 *          balance it pays and whether it is still open, paid or released.
 * Boundary: a type in the leaf entry. `amount` excludes any tip (a tip is the payer's, not the balance's). A part is
 *           keyed by `reference`, so settling it twice counts it once.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6); STA-1024.
 */
import type { Money } from "@stackra/money";

/**
 * One payer's share.
 *
 * @example
 * const part: BalancePart = { reference: "chk_9:seat_2", amount, state: "open" };
 */
export interface BalancePart {
  /** The payment's merchant reference (its `PaymentRecord`). */
  readonly reference: string;

  /** The share of the balance it pays, before any tip. */
  readonly amount: Money;

  /** `open` while its payment may still succeed, `paid` once captured, `released` once it failed or was voided. */
  readonly state: "open" | "paid" | "released";
}
