/**
 * Stackra file contract:
 * Purpose: `RuleOperator`, how a condition compares a field with its value.
 * Boundary: values only; which operators a field offers is `ruleOperatorsOf(type)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** The operators of a rule condition. */
export const RuleOperator = Object.freeze([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater",
  "less",
  "is_empty",
  "is_not_empty",
] as const);

/** One rule operator. */
export type RuleOperator = (typeof RuleOperator)[number];
