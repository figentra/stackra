/**
 * Stackra file contract:
 * Purpose: `approverRefusal(rule, approver, requester)`, the check of an `ApproverRule` at grant time: the seat kind,
 *          no self-approval (the requester, the human an agent acts for, or an agent of that human; `actorChainOverlaps`), then step-up.
 * Boundary: pure. The rule is rule-set data and the approver's seat and step-up are the driver's reads; this holds only
 *           the comparison. Checked in that order, so a self-approval is reported before a missing step-up.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the one chain check, `actorChainOverlaps`); R3-SO-02; J2-6; ADR 0360 (an agent never approves its own call); ADR 0098 (decision 3).
 */
import { actorChainOverlaps } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import { ApproverRefusal } from "#contracts/enums/approver-refusal.enum";
import type { ApproverRule } from "#contracts/types/approver-rule.type";
import type { Approver } from "#contracts/types/approver.type";

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
  if (rule.notRequester && actorChainOverlaps(approver.actor, requester))
    return ApproverRefusal.SelfApproval;
  if (rule.stepUp && !approver.steppedUp) return ApproverRefusal.StepUpRequired;
  return undefined;
}
