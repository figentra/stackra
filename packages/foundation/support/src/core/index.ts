/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/support, which now has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `rational`, `parseDecimal`, the unit table and the Code 128
 *           width table stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { time } from "#core/constants/time.constant";
export { code128 } from "#core/functions/code128.function";
export { restrictedGtin } from "#core/functions/restricted-gtin.function";
export type { Code128Symbol } from "#core/types/code128-symbol.type";
export type { QuantityUnit } from "#core/types/quantity-unit.type";
export type { Rational } from "#core/types/rational.type";
export { Quantity } from "#core/values/quantity.value";
