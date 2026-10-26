/**
 * Stackra file contract:
 * Purpose: `approverRefusal(rule, approver, requester)`, the check of an `ApproverRule` at grant time: the seat kind,
 *          no self-approval (the requester, the human an agent acts for, or an agent of that human), then step-up.
 * Boundary: pure. The rule is rule-set data and the approver's seat and step-up are the driver's reads; this holds only
 *           the comparison. Checked in that order, so a self-approval is reported before a missing step-up.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02; J2-6; ADR 0360 (an agent never approves its own call); ADR 0098 (decision 3).
 */
import type { Actor } from "@stackra/contracts";

import { ApproverRefusal } from "#contracts/enums/approver-refusal.enum";
import type { ApproverRule } from "#contracts/types/approver-rule.type";
import type { Approver } from "#contracts/types/approver.type";

/** Every principal id in `actor`'s on-behalf-of chain, itself first. */
function chainOf(actor: Actor): readonly string[] {
  const ids: string[] = [];
  for (let link: Actor | undefined = actor; link !== undefined; link = link.onBehalfOf)
    ids.push(link.id);
  return ids;
}

/**
 * Why `approver` may not grant `requester`'s parked call under `rule`, or `undefined` when they may.
 *
 * @example
 * approverRefusal({ seatKind: "lawyer", notRequester: true, stepUp: true }, approver, call.actor);
 * // "step_up_required" for a lawyer who has not stepped up
 */
export function approverRefusal(
  rule: ApproverRule,
  approver: Approver,
  requester: Actor,
): ApproverRefusal | undefined {
  if (rule.seatKind !== undefined && approver.seatKind !== rule.seatKind)
    return ApproverRefusal.SeatKind;
  if (rule.notRequester) {
    const requesters = new Set(chainOf(requester));
    if (chainOf(approver.actor).some((id) => requesters.has(id)))
      return ApproverRefusal.SelfApproval;
  }
  if (rule.stepUp && !approver.steppedUp) return ApproverRefusal.StepUpRequired;
  return undefined;
}
