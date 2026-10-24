/**
 * Stackra file contract:
 * Purpose: `IntegrationListing`, an Integration's `listing` option: what the marketplace page shows beside what gen
 *          derives (the label, the logo, the scope explainers).
 * Boundary: a type only. Third-party publishers and the Activepieces piece format are out of scope (ADR 0308 rule 21).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 19 and 21).
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
}
