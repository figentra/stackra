/**
 * Stackra file contract:
 * Purpose: `PaymentBalance`, one amount due (a guest check, an invoice) that several payers pay in parts at once: the
 *          amount, its parts and when it was settled in full.
 * Boundary: a type in the leaf entry; stored through the `PaymentBalances` port and changed only under its lock.
 *           Open and paid parts together never exceed `amount`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6); STA-1024.
 */
import type { Money } from "@stackra/money";

import type { BalancePart } from "#contracts/types/balance-part.type";

/**
 * An amount due, paid in parts.
 *
 * @example
 * const balance = await balances.open("chk_9", Money.ofMinor(42_000, "SAR"));
 */
export interface PaymentBalance {
  /** The merchant's id of what is due (the check, the order). */
  readonly reference: string;

  /** The whole amount due, before tips. */
  readonly amount: Money;

  /** The parts taken against it, in the order they were reserved. */
  readonly parts: readonly BalancePart[];

  /** When the paid parts first covered `amount`. */
  readonly settledAt?: Date;

  /** When the balance last changed. */
  readonly updatedAt: Date;
}
