/**
 * Stackra file contract:
 * Purpose: `VerificationKind`, what a KYC or KYB check proves: a person's identity, a company's registration, a tax
 *          number, a sanctions screening, or a background check.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes key the market pack's driver lists
 *           (`verification.drivers`), so a code never changes. Which provider answers a kind in a market is pack data.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7: verification); OS-54, OS-367, OS-417; ACA-111; ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of check. */
export const VerificationKind = Enum.of({
  /** A person is who they say (a national ID, a document and a face). */
  Identity: "identity",
  /** A company is registered and in good standing (KYB). */
  Company: "company",
  /** A tax or VAT number is valid and belongs to the party. */
  TaxNumber: "tax_number",
  /** The party is on no sanctions or watch list. */
  Sanctions: "sanctions",
  /** A background check (safeguarding roles). */
  Background: "background",
});

/** One of the codes above. */
export type VerificationKind = Enum.Value<typeof VerificationKind>;
