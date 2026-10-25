/**
 * Stackra file contract:
 * Purpose: `RULE_VERSION_PATTERN`, the shape of a rule package version an action accepts or a document names: dotted
 *          whole numbers (`2`, `2.4`, `2.4.0`).
 * Boundary: `Action({ accepts })` refuses a `ruleVersion` that does not match; a document's version that does not match
 *           is treated as older, so it is reviewed, never refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decision 5: versioned together).
 */

/**
 * Dotted whole numbers.
 *
 * @example
 * RULE_VERSION_PATTERN.test("2.4.0"); // true
 */
export const RULE_VERSION_PATTERN = /^\d+(?:\.\d+)*$/;
