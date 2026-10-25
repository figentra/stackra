/**
 * Stackra file contract:
 * Purpose: `RKSV_OPTIONS`, the pack options of the `rksv` driver: the certification provider id, the receipt amount
 *          bucket of each rate, and the market's time zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `RksvDriver`. */
export const RKSV_OPTIONS = z.object({
  /** The certification service provider id in the receipt prefix. */
  providerId: z.string().min(1),
  /** The amount bucket of each rate, keyed by the rate's decimal string. */
  rateBuckets: z.record(z.string(), z.enum(["normal", "reduced1", "reduced2", "zero", "special"])),
  /** IANA time zone of the receipt date and time. */
  timeZone: z.string().min(1),
});
