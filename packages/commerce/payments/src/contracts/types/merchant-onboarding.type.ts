/**
 * Stackra file contract:
 * Purpose: `MerchantOnboarding`, a merchant to onboard under the platform's provider account, with the pages the provider's
 *          KYC flow returns to.
 * Boundary: a type in the leaf entry; the country is taken from the merchant's records, never chosen here.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 7).
 */

/**
 * Start a merchant's onboarding.
 *
 * @example
 * await gateway.onboard({ reference: "org_1", country, email, returnUrl, refreshUrl });
 */
export interface MerchantOnboarding {
  /** The merchant's id on the platform. */
  readonly reference: string;

  /** ISO 3166-1 alpha-2 country of the business. */
  readonly country: string;

  /** The merchant's contact email. */
  readonly email?: string;

  /** Where the provider sends the merchant when onboarding is done. */
  readonly returnUrl: string;

  /** Where the provider sends the merchant when the link has expired. */
  readonly refreshUrl: string;
}
