/**
 * Stackra file contract:
 * Purpose: `CurrencyCode`, an ISO 4217 code that has minor units (`"USD"`, `"JPY"`, `"KWD"`), as a literal union, so a
 *          config default `defaultCurrency: CurrencyCode = "USD"` type-checks and `"usd"` does not.
 * Boundary: a type only, derived from the `CURRENCIES` table, so the type and the runtime check never disagree. A
 *           plain `string` from outside becomes one through `Money.ofMinor` or the `currencyCode()` codec.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 1: ISO 4217 codes); ADR 0127 2026-10-24 note (the codecs in money).
 */
import type { CURRENCIES } from "#core/constants/currencies.constant";

/** One of the ISO 4217 codes in `CURRENCIES`. */
export type CurrencyCode = keyof typeof CURRENCIES;
