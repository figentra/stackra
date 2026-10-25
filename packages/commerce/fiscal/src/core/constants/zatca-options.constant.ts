/**
 * Stackra file contract:
 * Purpose: `ZATCA_OPTIONS`, the pack options of the `zatca` driver: the reporting, clearance and onboarding endpoints,
 *          the API version, the UBL profile, the tax currency, the payment-means codes per tenant method, and the
 *          market's time zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `ZatcaDriver` and `ZatcaOnboarding`. */
export const ZATCA_OPTIONS = z.object({
  /** Where simplified invoices are reported. */
  reportingUrl: z.url(),
  /** Where standard invoices are cleared. */
  clearanceUrl: z.url(),
  /** Where a unit asks for its compliance CSID with a one-time password. */
  complianceCsidUrl: z.url(),
  /** Where sample invoices are checked during onboarding. */
  complianceInvoicesUrl: z.url(),
  /** Where a unit exchanges its compliance CSID for a production CSID. */
  productionCsidUrl: z.url(),
  /** The `Accept-Version` header value. */
  apiVersion: z.string().min(1),
  /** The UBL `ProfileID`. */
  profileId: z.string().min(1),
  /** The currency tax totals must also be stated in; a document in another currency is refused. */
  taxCurrency: z.string().length(3),
  /** UNCL 4461 payment-means code per tenant payment method. */
  paymentMeans: z.record(z.string(), z.string().min(1)),
  /** IANA time zone of the issue date and time. */
  timeZone: z.string().min(1),
});
