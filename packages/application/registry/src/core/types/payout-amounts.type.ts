/**
 * Stackra file contract:
 * Purpose: `PayoutAmounts`, what `computePartnerPayout` answers: the gross, the fee and the net, in minor units.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8).
 */

/** The amounts of one payout. */
export interface PayoutAmounts {
  /** What tenants paid. */
  readonly grossMinor: number;

  /** What the schedule keeps. */
  readonly feeMinor: number;

  /** What the partner is paid. */
  readonly netMinor: number;
}
