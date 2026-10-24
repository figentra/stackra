/**
 * Stackra file contract:
 * Purpose: `NOT_CONSTANT`, the marker gen's constant evaluator returns for an expression it cannot evaluate at build
 *          time (a call outside the platform set, a variable without a literal type, a function).
 * Boundary: a unique symbol; never written to any output. A rule argument or default that evaluates to it is a
 *           `shape_rule_not_constant` or `shape_default_not_constant` error; an option that does is left out.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: decorator arguments and defaults are constants).
 */

/** Not a build-time constant. */
export const NOT_CONSTANT: unique symbol = Symbol("not-constant");
