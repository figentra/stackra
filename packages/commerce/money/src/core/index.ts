/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/money, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `CURRENCIES` stays internal: consumers read a currency through
 *           `Money` and `CurrencyCode`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Rounding } from "#core/enums/rounding.enum";
export { currencyCode } from "#core/functions/currency-code.function";
export { money } from "#core/functions/money.function";
export type { CurrencyCode } from "#core/types/currency-code.type";
export { Money } from "#core/values/money.value";
