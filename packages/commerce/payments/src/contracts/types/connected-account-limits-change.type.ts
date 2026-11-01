/**
 * Stackra file contract:
 * Purpose: `ConnectedAccountLimitsChange`, the limits the platform sets on one connected account (its pre-verification
 *          cap and payout hold) with who set them and why, as the stored-limits driver's `set` takes them.
 * Boundary: a type only; a leaf file.
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; STA-1707.
 */
import type { Money } from "@stackra/money";

/** The limits the platform sets on one connected account. */
export interface ConnectedAccountLimitsChange {
  /** The most one payment may take; null for no cap (the owner is verified). */
  readonly cap: Money | null;

  /** Whether its payouts are held. */
  readonly payoutHeld: boolean;

  /** The platform principal setting them. */
  readonly by: string;

  /** Why, kept in the history. */
  readonly reason: string;
}
