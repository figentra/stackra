/**
 * Stackra file contract:
 * Purpose: `CURRENCY_WORDS_SCHEMA`, the zod schema of a currency's names for amounts in words: its minor-unit exponent
 *          and, per supported language, the noun forms the speller needs.
 * Boundary: the values are market-pack data (the currency section of `market-pack:<code>`), never code; this checks
 *           their shape at the trust boundary. Arabic needs singular, dual, plural (3 to 10), accusative (11 to 99)
 *           and gender; English needs singular and plural. `minor` is optional for a currency spelled whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3); ADR 0363 (decision 3: market packs).
 */
import { z } from "zod";

/** The Arabic forms of one noun. */
const ARABIC_NOUN = z.object({
  singular: z.string().min(1),
  dual: z.string().min(1),
  plural: z.string().min(1),
  accusative: z.string().min(1),
  feminine: z.boolean(),
});

/** The English forms of one noun. */
const ENGLISH_NOUN = z.object({ singular: z.string().min(1), plural: z.string().min(1) });

/** The shipped schema of `CurrencyWords`. */
export const CURRENCY_WORDS_SCHEMA = z.object({
  exponent: z.int().min(0).max(4),
  ar: z.object({ major: ARABIC_NOUN, minor: ARABIC_NOUN.optional() }).optional(),
  en: z.object({ major: ENGLISH_NOUN, minor: ENGLISH_NOUN.optional() }).optional(),
});
