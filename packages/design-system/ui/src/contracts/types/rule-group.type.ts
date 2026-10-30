/**
 * Stackra file contract:
 * Purpose: `RuleGroup`, a rule: its conditions and whether all or any must hold. Data only, so it is stored and
 *          evaluated on the server the same way (`ruleMatches`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { RuleCondition } from "#contracts/types/rule-condition.type";

/** A rule of conditions. */
export interface RuleGroup {
  readonly match: "all" | "any";
  readonly conditions: readonly RuleCondition[];
}
