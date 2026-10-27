/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/support, which now has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `rational`, `parseDecimal`, `roundRational`, `hmacKey`,
 *           `base64url`, the unit table and the Code 128 width table stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { oneTimeCode } from "#core/constants/one-time-code.constant";
export { signedToken } from "#core/constants/signed-token.constant";
export { time } from "#core/constants/time.constant";
export { canonicalHash } from "#core/functions/canonical-hash.function";
export { canonicalJson } from "#core/functions/canonical-json.function";
export { code128 } from "#core/functions/code128.function";
export { restrictedGtin } from "#core/functions/restricted-gtin.function";
export type { Code128Symbol } from "#core/types/code128-symbol.type";
export type { OneTimeCodeCheck } from "#core/types/one-time-code-check.type";
export type { OneTimeCodeRecord } from "#core/types/one-time-code-record.type";
export type { QuantityRounding } from "#core/types/quantity-rounding.type";
export type { QuantityUnit } from "#core/types/quantity-unit.type";
export type { Rational } from "#core/types/rational.type";
export type { SignedTokenCheck } from "#core/types/signed-token-check.type";
export type { SigningKeySource } from "#core/types/signing-key-source.type";
export { Quantity } from "#core/values/quantity.value";
