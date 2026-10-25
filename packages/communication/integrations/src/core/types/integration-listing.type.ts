/**
 * Stackra file contract:
 * Purpose: `IntegrationListing`, an Integration's `listing` option: what the app market page shows beside what gen
 *          derives (the label, the logo, the scope explainers, the roles): the documentation, support, privacy and
 *          terms links, and the Entitlement that prices it.
 * Boundary: a type only. The price is an Entitlement reference, never an amount, so the plan system stays the one
 *           source of plans. An Integration whose only credential is the platform's is not listed (ADR 0355 decision
 *           2): gen lists one only when it has a level. Third-party publishers and the Activepieces piece format are
 *           out of scope (ADR 0308 rule 21); the review state of a partner app is the registry's.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 19 and 21); ADR 0355 (decisions 2 and 7).
 */
import type { Url } from "@stackra/contracts";

/**
 * The marketplace listing.
 *
 * @example
 * listing: { docsUrl: "https://resend.com/docs" }
 */
export interface IntegrationListing {
  /** The provider's documentation, linked from the listing. */
  readonly docsUrl?: Url;

  /** Where a tenant gets help with the provider. */
  readonly supportUrl?: Url;

  /** The provider's privacy policy. */
  readonly privacyUrl?: Url;

  /** The provider's terms of service. */
  readonly termsUrl?: Url;

  /** The Entitlement key a tenant needs to connect it (`integrations.premium_connectors`); free when left out. */
  readonly entitlement?: string;
}
