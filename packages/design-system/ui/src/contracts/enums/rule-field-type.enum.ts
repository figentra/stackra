/**
 * Stackra file contract:
 * Purpose: `RuleFieldType`, the kinds of value a rule condition compares, which set its operators and its input.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** The value kinds of a rule field. */
export const RuleFieldType = Object.freeze(["text", "number", "choice"] as const);

/** One rule field type. */
export type RuleFieldType = (typeof RuleFieldType)[number];
