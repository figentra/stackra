/**
 * Stackra file contract:
 * Purpose: `NF525_OPTIONS`, the pack options of the `nf525` driver: the operation type per document kind and the
 *          market's time zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `Nf525Driver`; every document kind needs an operation type. */
export const NF525_OPTIONS = z.object({
  /** The signed operation type per document kind. */
  operationTypes: z.object({
    invoice: z.string().min(1),
    simplified: z.string().min(1),
    credit_note: z.string().min(1),
    debit_note: z.string().min(1),
  }),
  /** IANA time zone of the signed date and time. */
  timeZone: z.string().min(1),
});
