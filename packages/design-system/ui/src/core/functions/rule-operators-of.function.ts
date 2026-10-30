/**
 * Stackra file contract:
 * Purpose: `ruleOperatorsOf`, the operators a rule field of a given type offers, in menu order.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";

/** The operators of each field type. */
const OPERATORS: Readonly<Record<RuleFieldType, readonly RuleOperator[]>> = {
  text: ["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"],
  number: ["equals", "not_equals", "greater", "less", "is_empty", "is_not_empty"],
  choice: ["equals", "not_equals", "is_empty", "is_not_empty"],
};

/** The operators of `type`. */
export function ruleOperatorsOf(type: RuleFieldType): readonly RuleOperator[] {
  return OPERATORS[type];
}
