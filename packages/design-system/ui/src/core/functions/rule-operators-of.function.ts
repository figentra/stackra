/**
 * Stackra file contract:
 * Purpose: `ruleOperatorsOf`, the operators a rule field of a given type offers, in menu order.
 * Boundary: pure; the one table the rule builder, the column menu and the filter bar read.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); STA-1371.
 */
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";

/** The operators of each field type. */
const OPERATORS: Readonly<Record<RuleFieldType, readonly RuleOperator[]>> = {
  text: ["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"],
  number: ["equals", "not_equals", "greater", "less", "between", "is_empty", "is_not_empty"],
  choice: ["equals", "not_equals", "in", "not_in", "is_empty", "is_not_empty"],
  date: ["equals", "before", "after", "between", "is_empty", "is_not_empty"],
  boolean: ["is_true", "is_false"],
};

/** The operators of `type`. */
export function ruleOperatorsOf(type: RuleFieldType): readonly RuleOperator[] {
  return OPERATORS[type];
}
