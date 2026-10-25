/**
 * Stackra file contract:
 * Purpose: `decide`, one rule's decision: it evaluates the condition, and when it holds checks the outcomes against the
 *          consumer's kinds and guards them against the market floors, so what a consumer dispatches never crosses a
 *          floor.
 * Boundary: pure and deterministic, as `evaluate` is: the time is `options.now`, the floors are `options.floors`. It
 *           applies nothing (ADR 0331 decision 9): the consumer's `OutcomeDispatcher` does. A condition that did not
 *           hold yields no outcomes.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 1, 6, 7 and 9); config-model section 4 (the floor is the final guard).
 */
import { evaluate } from "#core/functions/evaluate.function";
import { guardFloors } from "#core/functions/guard-floors.function";
import type { DecideOptions } from "#core/types/decide-options.type";
import type { Decision } from "#core/types/decision.type";
import type { Facts } from "#core/types/facts.type";
import type { RuleDocument } from "#core/types/rule-document.type";
import type { Rules } from "#core/values/rules.value";

/**
 * The decision of `rule` on `facts`.
 *
 * @throws ConditionInvalidError or OutcomeInvalidError when the stored rule no longer checks against `rules`; TypeError
 *         for a floor whose pack value is not a number.
 * @example
 * const decision = decide(RETURNS_RULES, revision, facts, { now: ctx.startedAt, floors: floorsOn(resolved, today) });
 * await dispatcher.dispatch(decision, order);
 */
export function decide(
  rules: Rules,
  rule: RuleDocument,
  facts: Facts,
  options: DecideOptions,
): Decision {
  const evaluation = evaluate(rules, rule.condition, facts, {
    now: options.now,
    ...(options.revision === undefined ? {} : { revision: options.revision }),
  });
  if (!evaluation.matched)
    return Object.freeze({
      matched: false,
      evaluation,
      outcomes: Object.freeze([]),
      floored: Object.freeze([]),
    });
  const guarded = guardFloors(rules, rules.checkOutcomes(rule.outcomes), options.floors);
  return Object.freeze({ matched: true, evaluation, ...guarded });
}
