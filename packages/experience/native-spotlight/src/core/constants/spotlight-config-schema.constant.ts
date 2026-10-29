/**
 * Stackra file contract:
 * Purpose: `SPOTLIGHT_CONFIG_SCHEMA`, the shipped `SpotlightConfig$`: whether the phone's search is fed, which record
 *          kinds may be, how many records and how old.
 * Boundary: data shape only; the defaults are in `SpotlightOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); config-model.
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's SpotlightOptions into #stackra/schemas; replace with STA-339.
/** The shipped `SpotlightConfig$`. */
export const SPOTLIGHT_CONFIG_SCHEMA = z.object({
  isEnabled: z.boolean(),
  kinds: z.array(z.string().min(1)),
  maxItems: z.number().int().min(0).max(500),
  maxAgeDays: z.number().int().min(1).max(365),
});
