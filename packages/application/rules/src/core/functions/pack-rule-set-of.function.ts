/**
 * Stackra file contract:
 * Purpose: `packRuleSetOf`, a rule-set pack's default rule set read straight from the pack, with no scope and no
 *          stored rule set: the template `key` of `pack`, checked against its consumer's `Rules`, as a `RuleDocument`
 *          that `evaluate` and `decide` take. What a consumer decides with before a scope has its own (seeded or
 *          edited) rule set.
 * Boundary: pure and isomorphic; it reads and writes nothing. The pack is untrusted JSON until `RuleSetPack$` parses it;
 *           the condition and outcomes are checked as `RuleSetService.seed` checks them. The floors are still applied
 *           by `decide`.
 * Runtime: isomorphic
 * Governing contract: config-model sections 4 and 6 (rule sets ship as versioned seed documents); ADR 0331 (decision
 *                     5); ADR 0455 (decision 1: a pack's default rule set opens without a scope).
 */
import { RULE_SET_PACK_SCHEMA } from "#core/constants/rule-set-pack-schema.constant";
import type { RuleDocument } from "#core/types/rule-document.type";
import type { Rules } from "#core/values/rules.value";

/**
 * The default rule set `key` of `pack`, checked against `rules`.
 *
 * @throws ZodError when `pack` is not a rule-set pack; TypeError when it has no template `key`, or the template is for
 *         another consumer than `rules`; ConditionInvalidError or OutcomeInvalidError when the template does not
 *         check against `rules`.
 * @example
 * const rule = packRuleSetOf(returnsPack, "commerce.returns.window", RETURNS_RULES);
 * const decision = decide(RETURNS_RULES, rule, facts, { now: ctx.startedAt, floors });
 */
export function packRuleSetOf(pack: unknown, key: string, rules: Rules): RuleDocument {
  const parsed = RULE_SET_PACK_SCHEMA.parse(pack);
  const template = parsed.ruleSets.find((candidate) => candidate.key === key);
  if (template === undefined)
    throw new TypeError(`packRuleSetOf: ${parsed.key} has no rule set ${key}`);
  if (template.consumer !== rules.key)
    throw new TypeError(`packRuleSetOf: ${key} is for ${template.consumer}, not ${rules.key}`);
  return Object.freeze({
    condition: rules.check(template.condition),
    outcomes: Object.freeze(rules.checkOutcomes(template.outcomes)),
  });
}
