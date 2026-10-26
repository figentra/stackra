/**
 * Stackra file contract:
 * Purpose: `outcomeKindOf`, the `OutcomeKind` a declared outcome class (`RuleOutcome({...})`) recorded, or the kind
 *          itself when given one as data, so `Rules.create` takes either form.
 * Boundary: pure; reads the kind registry through `kindOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 9); ADR 0294 (decision 25); ADR 0425 (decision 1).
 */
import { kindOf } from "@stackra/container";

import type { OutcomeKind } from "#contracts/index";
import type { RuleOutcomeClass } from "#core/types/rule-outcome-class.type";

/**
 * The outcome kind `declared` describes.
 *
 * @throws TypeError when `declared` is a class that does not extend a called `RuleOutcome({...})`.
 * @example
 * outcomeKindOf(RefundWindow).key; // "refundWindow"
 */
export function outcomeKindOf(declared: OutcomeKind | RuleOutcomeClass): OutcomeKind {
  if (typeof declared !== "function") return declared;
  const record = kindOf(declared);
  if (record?.kind !== "rule_outcome" || record.options["key"] === undefined)
    throw new TypeError(`Rules.create: ${declared.name} does not extend RuleOutcome({ key, ... })`);
  // reason: `RuleOutcome`'s reader recorded a checked `OutcomeKind`
  return record.options as unknown as OutcomeKind;
}
