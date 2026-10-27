/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/money, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `CURRENCIES` and the decimal helpers other than
 *           `decimalProduct` stay internal: consumers read a currency through `Money` and `CurrencyCode`. The
 *           `RateSource` port is exported from `./contracts` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MemoryRateSourceDriver } from "#core/drivers/memory-rate-source.driver";
export { currencyCode } from "#core/functions/currency-code.function";
export { decimalProduct } from "#core/functions/decimal-product.function";
export { money } from "#core/functions/money.function";
export { roundCash } from "#core/functions/round-cash.function";
export type { CashRoundingRule } from "#core/types/cash-rounding-rule.type";
export type { CurrencyCode } from "#core/types/currency-code.type";
export { CashRounding } from "#core/values/cash-rounding.value";
export { ExchangeRate } from "#core/values/exchange-rate.value";
export { Money } from "#core/values/money.value";
export { UnitPrice } from "#core/values/unit-price.value";
