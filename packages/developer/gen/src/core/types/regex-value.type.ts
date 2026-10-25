/**
 * Stackra file contract:
 * Purpose: `RegexValue`, how gen's constant evaluator records a RegExp literal written in a rule
 *          (`@Str({ pattern: /^[a-z]+$/ })`): its source and flags, so the zod emitter writes the literal back and the
 *          JSON Schema emitter writes `pattern`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: decorator arguments are constants).
 */

/** A RegExp literal read as a constant. */
export interface RegexValue {
  /** The pattern source, without slashes. */
  readonly $regex: string;

  /** The flags (`i`, `u`, ...). */
  readonly flags: string;
}
