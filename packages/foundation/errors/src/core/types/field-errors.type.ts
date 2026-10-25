/**
 * Stackra file contract:
 * Purpose: `FieldErrors`, the field errors of a refusal: each wire path of the input that was refused, to the
 *          snake_case code that says why (`{ "lines.0.variantId": "insufficient_stock" }`).
 * Boundary: a type only. A form shows a refusal with field errors on its fields, not as an error page (0140).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1), ADR 0231 (snake_case codes, camelCase JSON keys).
 */

/** A wire path (dots between segments, list indexes as numbers) to a snake_case code. */
export type FieldErrors = Readonly<Record<string, string>>;
