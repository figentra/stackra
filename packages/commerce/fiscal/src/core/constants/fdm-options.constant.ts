/**
 * Stackra file contract:
 * Purpose: `FDM_OPTIONS`, the pack options of the `fdm` driver: the fiscal data module's VAT slot per rate and the
 *          event type per document kind.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `FdmDriver`. */
export const FDM_OPTIONS = z.object({
  /** The module's VAT slot letter of each rate, keyed by the rate's decimal string. */
  vatRateSlots: z.record(z.string(), z.string().min(1)),
  /** The module's event type per document kind. */
  eventTypes: z.object({
    invoice: z.string().min(1),
    simplified: z.string().min(1),
    credit_note: z.string().min(1),
    debit_note: z.string().min(1),
  }),
});
