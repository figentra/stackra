/**
 * Stackra file contract:
 * Purpose: `RuleCondition`, one line of a rule: a field, an operator and the value compared with.
 * Boundary: types only. The value is text; a number field parses it when the rule is evaluated.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";

/** One condition of a rule. */
export interface RuleCondition {
  /** A stable id, unique within the rule. */
  readonly id: string;
  /** The key of the field it tests. */
  readonly field: string;
  /** How the field is compared with the value. */
  readonly operator: RuleOperator;
  /** The value the field is compared with. */
  readonly value: string;
}
