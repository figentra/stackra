/**
 * Stackra file contract:
 * Purpose: `PlatformGateway`, the Connect-style port: onboard a merchant under the platform's provider account (the
 *          provider runs its own KYC) and read whether the account may take and receive money.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. Only the licensed provider holds money; the platform never does (ADR 0357 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 3 and 7).
 */
import type { MerchantAccount } from "#contracts/types/merchant-account.type";
import type { MerchantOnboarding } from "#contracts/types/merchant-onboarding.type";

/**
 * Merchant onboarding (`PaymentCapability.Platform`).
 *
 * @example
 * const account = await gateway.onboard({ reference, country, returnUrl, refreshUrl });
 */
export interface PlatformGateway {
  /** Creates the merchant's account and returns it with the provider's onboarding URL. */
  onboard(request: MerchantOnboarding): Promise<MerchantAccount>;

  /** The account as the provider holds it now. */
  account(accountRef: string): Promise<MerchantAccount>;
}
