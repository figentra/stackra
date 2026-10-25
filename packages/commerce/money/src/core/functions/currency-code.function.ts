/**
 * Stackra file contract:
 * Purpose: `currencyCode()`, the zod schema of an ISO 4217 code that generated schemas and clients write for a field
 *          typed `CurrencyCode` (`currency: currencyCode()`, `defaultCurrency: currencyCode().default("USD")`).
 * Boundary: a zod enum of the `CURRENCIES` codes, so its output type is exactly `CurrencyCode` and the generated
 *           `X$Check` holds. Case-sensitive: `"usd"` is refused. Authored code never calls it; gen emits it.
 * Runtime: isomorphic
 * Governing contract: ADR 0127 2026-10-24 note (the money codecs ship from @stackra/money); ADR 0294 (decision 26:
 *                     the shape compiler and `X$Check`); ADR 0220 (decision 1).
 */
import { z } from "zod";

import { CURRENCIES } from "#core/constants/currencies.constant";
import type { CurrencyCode } from "#core/types/currency-code.type";

/** The codes, typed as the union, for `z.enum`. */
const CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * A new zod schema that accepts an ISO 4217 code with minor units and outputs it as a `CurrencyCode`.
 *
 * @example
 * export const CommerceConfig$ = z.object({ defaultCurrency: currencyCode().default("USD") });
 */
export function currencyCode() {
  return z.enum(CODES);
}
