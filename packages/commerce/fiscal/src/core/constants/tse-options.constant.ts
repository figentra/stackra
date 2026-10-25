/**
 * Stackra file contract:
 * Purpose: `TSE_OPTIONS`, the pack options of the `tse` driver: the process type, the five VAT slots of the process
 *          data by rate, the payment type per tenant method, and the home currency.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `TseDriver`. */
export const TSE_OPTIONS = z.object({
  /** The process type the TSE signs (`processType`). */
  processType: z.string().min(1),
  /** The VAT slot (1 to 5) of each rate, keyed by the rate's decimal string. */
  vatRateSlots: z.record(z.string(), z.int().min(1).max(5)),
  /** The process-data payment type (cash or non-cash) per tenant method. */
  paymentTypes: z.record(z.string(), z.string().min(1)),
  /** The currency written without a code; others carry theirs. */
  homeCurrency: z.string().length(3),
});
