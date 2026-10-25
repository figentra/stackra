/**
 * Stackra file contract:
 * Purpose: `PEPPOL_OPTIONS`, the pack options of the `peppol` driver: the access point or ASP endpoint, the
 *          customization and profile ids of the specification in force, and the market's time zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `PeppolDriver`. */
export const PEPPOL_OPTIONS = z.object({
  /** The access point (or accredited service provider) that sends the document. */
  accessPointUrl: z.url(),
  /** The UBL `CustomizationID` of the specification in force (a BIS or PINT id). */
  customizationId: z.string().min(1),
  /** The UBL `ProfileID` of the business process. */
  profileId: z.string().min(1),
  /** IANA time zone of the issue date. */
  timeZone: z.string().min(1),
});
