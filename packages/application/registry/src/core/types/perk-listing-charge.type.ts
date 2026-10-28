/**
 * Stackra file contract:
 * Purpose: `PerkListingCharge`, the listing fee OS billing invoices to a perk partner's developer tenant for one
 *          period: the partner, the listing, the fee schedule applied, and the amount.
 * Boundary: a type only; `perkListingFee` builds it. Money flows from the partner to Figentra here, the reverse of a
 *           partner payout.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7 (listing fee), OS-130; STA-1383 (MoneyAmount in place of a
 *                     bare minor amount and currency).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

/** One listing fee. */
export interface PerkListingCharge {
  /** The partner's developer tenant id, the invoice's customer. */
  readonly partner: string;

  /** The listing key. */
  readonly listing: string;

  /** The fee schedule key applied. */
  readonly feeSchedule: string;

  /** The fee: the schedule's fixed fee in its ISO 4217 currency. */
  readonly amount: MoneyAmount;
}
