/**
 * Stackra file contract:
 * Purpose: `PlatformShare`, the platform side of a payment taken for a merchant onboarded under the platform's provider
 *          account: whose account receives it and the platform fee kept.
 * Boundary: a type in the leaf entry; the fee is computed by the caller from its fee schedule (data), never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 3); ADR 0219 (decision 2).
 */
import type { Money } from "@stackra/money";

/**
 * Destination and fee of a platform payment.
 *
 * @example
 * const platform: PlatformShare = { accountRef: "acct_123", fee: Money.of("2.50", "SAR") };
 */
export interface PlatformShare {
  /** The merchant's account at the provider (`MerchantAccount.accountRef`). */
  readonly accountRef: string;

  /** What the platform keeps. */
  readonly fee: Money;
}
