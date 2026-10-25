/**
 * Stackra file contract:
 * Purpose: `FACTUR_X_OPTIONS`, the pack options of the `factur-x` driver: the CII guideline id of the profile, the
 *          embedded file name and XMP facts of the hybrid PDF, an optional platform endpoint, and the market's time
 *          zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `FacturXDriver`; the same driver writes Factur-X and ZUGFeRD, the pack names the profile. */
export const FACTUR_X_OPTIONS = z.object({
  /** The `GuidelineSpecifiedDocumentContextParameter` id of the profile. */
  guidelineId: z.string().min(1),
  /** The embedded XML's file name. */
  fileName: z.string().min(1),
  /** The XMP conformance level. */
  conformanceLevel: z.string().min(1),
  /** The XMP version. */
  version: z.string().min(1),
  /** The XMP document type. */
  documentType: z.string().min(1),
  /** A platform that receives the XML; `null` when the hybrid PDF is exchanged directly. */
  submitUrl: z.url().nullable(),
  /** IANA time zone of the issue date. */
  timeZone: z.string().min(1),
});
