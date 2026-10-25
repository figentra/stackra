/**
 * Stackra file contract:
 * Purpose: `CurrencyWords`, a currency's names for amounts in words, read from the market pack.
 * Boundary: a type only, inferred from `CURRENCY_WORDS_SCHEMA`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3).
 */
import type { z } from "zod";

import type { CURRENCY_WORDS_SCHEMA } from "#core/constants/currency-words-schema.constant";

/** A currency's exponent and noun forms per language. */
export type CurrencyWords = z.output<typeof CURRENCY_WORDS_SCHEMA>;
