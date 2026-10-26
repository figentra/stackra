/**
 * Stackra file contract:
 * Purpose: `RuleOutcome`, the kind base of a declared outcome kind: `class RefundWindow extends RuleOutcome({ key:
 *          "refundWindow", label: "returns::outcomes.refund_window", params: { days: {...} } }) {}` in a module's
 *          `rules/` group, one `<name>.outcome.ts` per kind. Gen reads the options from source and lists every kind
 *          in the manifest's `outcomes` section, so the studio, the docs and AI tools know what a rule may yield
 *          without running the consumer. The interface of the same name is its instance side.
 * Boundary: called only. The call checks the key and records the options, frozen, in the kind registry; `Rules.create`
 *           takes the class in `outcomes` and checks the parameters there (`outcomeKindOf`). A kind holds no
 *           handler: the consumer's `OutcomeDispatcher` applies it (ADR 0331 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4, 9 and 10); ADR 0294 (decisions 13, 20 and 25); ADR 0425 (decision 1).
 */
import { createKind } from "@stackra/container";

import type { OutcomeKind } from "#contracts/index";
import type { RuleOutcomeClass } from "#core/types/rule-outcome-class.type";

/** A camelCase outcome key of 1 to 63 characters. */
const KEY = /^[a-z][a-zA-Z0-9]{0,62}$/;

/** The instance side of every declared outcome kind. */
export interface RuleOutcome {
  /** Type-only kind brand, so a class of another kind cannot stand in for an outcome kind. */
  readonly "~kind": "rule_outcome";
}

/**
 * Checks `options` and returns them frozen.
 *
 * @throws TypeError for a key that is not camelCase, or a label or params that are missing.
 */
function readOutcomeOptions(options: OutcomeKind): Readonly<Record<string, unknown>> {
  const { key, label, params } = options ?? ({} as Partial<OutcomeKind>);
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `RuleOutcome({ key }) is a camelCase key such as "refundWindow", got ${JSON.stringify(key)}`,
    );
  if (typeof label !== "string" || typeof params !== "object" || params === null)
    throw new TypeError(`RuleOutcome ${key}: a label and the params object are required`);
  return Object.freeze({ key, label, params: Object.freeze({ ...params }) });
}

/**
 * The outcome kind base.
 *
 * @example
 * export class RefundWindow extends RuleOutcome({
 *   key: "refundWindow",
 *   label: "returns::outcomes.refund_window",
 *   params: { days: { type: FieldType.Number, label: "returns::outcomes.days", floor: "consumer.withdrawal_days" } },
 * }) {}
 */
export const RuleOutcome = createKind(
  "rule_outcome",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; an outcome kind holds no state
  class RuleOutcomeBase {},
  readOutcomeOptions,
) as (options: OutcomeKind) => RuleOutcomeClass;
