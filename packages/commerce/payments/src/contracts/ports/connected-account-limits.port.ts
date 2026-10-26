/**
 * Stackra file contract:
 * Purpose: `ConnectedAccountLimits`, the port that answers the two limits of a `connected-account` connection before
 *          its owner is verified: the largest amount one payment may take (the pre-verification cap) and whether its
 *          payouts are held.
 * Boundary: an abstract class that is its own token, key `payments.ConnectedAccountLimits`. The host binds it over the
 *           OS verification record and `fee-schedule:pay`; this package names no amount and no rule. `PaymentService`
 *           asks only for a `connected-account` connection, never for `oauth-standard`, `own-key` or a legacy one. A
 *           leaf file.
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; RV-9 (OS verification is the record of truth); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { Money } from "@stackra/money";

/**
 * The limits of a connected account, from data.
 *
 * @example
 * export class VerificationLimitsDriver extends Driver(ConnectedAccountLimits) { … }
 */
export abstract class ConnectedAccountLimits extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.ConnectedAccountLimits";

  /**
   * The most one payment on connection `connectionId` may take now.
   *
   * @returns null when no cap applies (the owner is verified).
   */
  abstract cap(connectionId: string): Promise<Money | null>;

  /** Whether payouts of connection `connectionId` are held. */
  abstract payoutHeld(connectionId: string): Promise<boolean>;
}
