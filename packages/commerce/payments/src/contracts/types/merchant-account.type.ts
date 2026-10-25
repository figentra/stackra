/**
 * Stackra file contract:
 * Purpose: `MerchantAccount`, a merchant's account under the platform's provider account and whether it may take and receive
 *          money yet.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 7).
 */

/**
 * A connected merchant.
 *
 * @example
 * const account = await gateway.account(accountRef);
 * if (!account.chargesEnabled) redirect(account.onboardingUrl);
 */
export interface MerchantAccount {
  /** The provider's id of the account. */
  readonly accountRef: string;

  /** Where the merchant completes the provider's KYC, while it is open. */
  readonly onboardingUrl?: string;

  /** Whether it may take payments. */
  readonly chargesEnabled: boolean;

  /** Whether it may receive payouts. */
  readonly payoutsEnabled: boolean;
}
