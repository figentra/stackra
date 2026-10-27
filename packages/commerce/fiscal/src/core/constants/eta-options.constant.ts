/**
 * Stackra file contract:
 * Purpose: `ETA_OPTIONS`, the pack options of the `eta` driver: the submission endpoint, the status URL polled after
 *          acceptance, the document type version, the issuer's activity code, the reporting currency, and the tax type
 *          and subtype per UNCL 5305 category.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field but `statusUrl` is required, so a
 *           pack that leaves one out is refused by `parseOptions` instead of falling back to a value in code;
 *           `poll` refuses a pack without `statusUrl` the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `EtaDriver`. */
export const ETA_OPTIONS = z.object({
  /** Where documents are submitted. */
  submitUrl: z.url(),
  /**
   * The document status URL with `{uuid}` where the document's UUID goes, polled after an accepted submission;
   * optional for sealing, required by `poll`.
   */
  statusUrl: z.string().includes("{uuid}").exactOptional(),
  /** The `documentTypeVersion` value. */
  documentTypeVersion: z.string().min(1),
  /** The issuer's registered activity code (`taxpayerActivityCode`). */
  activityCode: z.string().min(1),
  /** The only currency this driver writes amounts in; a document in another currency is refused. */
  reportingCurrency: z.string().length(3),
  /** The authority's tax type and subtype per UNCL 5305 category. */
  taxTypes: z.record(
    z.string(),
    z.object({ taxType: z.string().min(1), subType: z.string().min(1) }),
  ),
});
