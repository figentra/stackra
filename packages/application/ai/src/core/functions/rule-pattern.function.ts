/**
 * Stackra file contract:
 * Purpose: `rulePattern(rule)`, the non-global regular expression of a `RedactionRule`, for testing whether text holds
 *          a match without the `lastIndex` state a global expression carries between calls.
 * Boundary: pure; internal to the guardrail drivers (not on the entry). An invalid pattern or flag throws, so a broken
 *           rule fails when the driver is built, never by letting text through.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0360 (decision 15); STA-1377 (stackra-219).
 */
import type { RedactionRule } from "#core/types/redaction-rule.type";

/**
 * The rule's expression without the `g` and `y` flags.
 *
 * @throws SyntaxError when the pattern or flags are not a valid regular expression.
 * @example
 * rulePattern({ name: "email", pattern: "[^\\s@]+@[^\\s@]+" }).test("a@b.co"); // true
 */
export function rulePattern(rule: RedactionRule): RegExp {
  return new RegExp(rule.pattern, (rule.flags ?? "").replaceAll(/[gy]/g, ""));
}
