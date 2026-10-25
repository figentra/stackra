/**
 * Stackra file contract:
 * Purpose: `RT_OPTIONS`, the pack options of the `rt` driver: the telematic printer's document type per document kind
 *          and payment type per tenant method.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `RtDriver`. */
export const RT_OPTIONS = z.object({
  /** The printer's document type per document kind. */
  documentTypes: z.object({
    invoice: z.string().min(1),
    simplified: z.string().min(1),
    credit_note: z.string().min(1),
    debit_note: z.string().min(1),
  }),
  /** The printer's payment type per tenant method. */
  paymentTypes: z.record(z.string(), z.string().min(1)),
});
