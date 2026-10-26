/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/rules (`Rules`, `evaluate`, `decide`, `guardFloors`,
 *          `OutcomeDispatcher`, the `RuleOutcome` kind base, the condition, outcome, decision and pack types, the
 *          refusals, `Condition$`, `FactSource$`, `RuleSetPack$` and `RuleSetPublished`, and the AI action
 *          permission matrix's readers `ACTION_PERMISSION_RULES`, `actionPermissionRowsOf` and `packApprovalFloorOf`)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: it imports no ORM and no Node API, so a browser
 *           (the rule builder's preview) evaluates with the same code as the server. It imports `./contracts` and
 *           never re-exports it (one symbol, one entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0331 (decisions 1, 2, 6, 7, 9 and 12); the STA-347 stand-in barrel
 *                     decision; ADR 0398 and STA-1250 (the matrix readers).
 */
export { RuleOutcome } from "#core/bases/rule-outcome.base";
export { ACTION_PERMISSION_RULES } from "#core/constants/action-permission-rules.constant";
export { CONDITION_SCHEMA as Condition$ } from "#core/constants/condition-schema.constant";
export { FACT_SOURCE_SCHEMA as FactSource$ } from "#core/constants/fact-source-schema.constant";
export { RULE_SET_PACK_SCHEMA as RuleSetPack$ } from "#core/constants/rule-set-pack-schema.constant";
export { ConditionInvalidError } from "#core/errors/condition-invalid.error";
export { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
export { RuleSetChangedError } from "#core/errors/rule-set-changed.error";
export { RuleSetPublished } from "#core/events/rule-set-published.event";
export { actionPermissionRowsOf } from "#core/functions/action-permission-rows.function";
export { decide } from "#core/functions/decide.function";
export { evaluate } from "#core/functions/evaluate.function";
export { guardFloors } from "#core/functions/guard-floors.function";
export {
  APPROVAL_FLOOR_KEY,
  packApprovalFloorOf,
} from "#core/functions/pack-approval-floor.function";
export type { Condition } from "#core/types/condition.type";
export type { DecideOptions } from "#core/types/decide-options.type";
export type { Decision } from "#core/types/decision.type";
export type { EvaluateOptions } from "#core/types/evaluate-options.type";
export type { Evaluation } from "#core/types/evaluation.type";
export type { EvaluationStep } from "#core/types/evaluation-step.type";
export type { FactValue } from "#core/types/fact-value.type";
export type { Facts } from "#core/types/facts.type";
export type { FloorValue } from "#core/types/floor-value.type";
export type { FlooredParam } from "#core/types/floored-param.type";
export type { Outcome } from "#core/types/outcome.type";
export type { OutcomeHandler } from "#core/types/outcome-handler.type";
export type { RuleDocument } from "#core/types/rule-document.type";
export type { RuleField } from "#core/types/rule-field.type";
export type { RuleOutcomeClass } from "#core/types/rule-outcome-class.type";
export type { RuleSetPack } from "#core/types/rule-set-pack.type";
export type { RuleSetTemplate } from "#core/types/rule-set-template.type";
export type { RulesOptions } from "#core/types/rules-options.type";
export { OutcomeDispatcher } from "#core/values/outcome-dispatcher.value";
export { Rules } from "#core/values/rules.value";
