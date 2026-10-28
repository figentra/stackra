/**
 * Stackra file contract:
 * Purpose: `PayoutAmounts`, what `computePartnerPayout` answers: the gross, the fee and the net, each a `MoneyAmount`
 *          in the gross's currency.
 * Boundary: a type only. The stored `PartnerPayout` record keeps its `grossMinor`, `feeMinor`, `netMinor` and
 *           `currency` columns; a writer maps these amounts into them at its boundary.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); STA-1383 (MoneyAmount in place of bare minor amounts).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

/** The amounts of one payout. */
export interface PayoutAmounts {
  /** What tenants paid. */
  readonly gross: MoneyAmount;

  /** What the schedule keeps. */
  readonly fee: MoneyAmount;

  /** What the partner is paid. */
  readonly net: MoneyAmount;
}
