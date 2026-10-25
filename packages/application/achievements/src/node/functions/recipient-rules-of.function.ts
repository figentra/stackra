/**
 * Stackra file contract:
 * Purpose: `recipientRulesOf`, the `Rules` of a registered recipient model, or the refusal a caller's input gets when
 *          the model is not registered.
 * Boundary: internal; reads `AWARD_RECIPIENTS`. Not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1 and 4).
 */
import { InputInvalidError } from "@stackra/actions";
import type { Rules } from "@stackra/rules";

import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";

/**
 * The rules of recipient model `model`.
 *
 * @throws InputInvalidError when no recipient has the key (`recipient: recipient_unknown`).
 */
export function recipientRulesOf(model: string): Rules {
  const rules = AWARD_RECIPIENTS.get(model);
  if (rules === undefined)
    throw InputInvalidError.create({}, { fieldErrors: { recipient: "recipient_unknown" } });
  return rules;
}
