/**
 * Stackra file contract:
 * Purpose: `ApproverRefusal`, why a person may not grant a parked approval under an `ApproverRule`: the wrong seat
 *          kind, self-approval, or no step-up.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; snake_case machine codes (ADR 0231).
 *           The gate's driver turns one into its refusal.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02; J2-6; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The approver refusals.
 *
 * @example
 * if (approverRefusal(rule, approver, call.actor) === ApproverRefusal.StepUpRequired) askForStepUp();
 */
export const ApproverRefusal = Enum.of({
  /** The approver holds no seat of the rule's kind. */
  SeatKind: "seat_kind",
  /** The approver is the requester, or the human the requesting agent acts for. */
  SelfApproval: "self_approval",
  /** The rule needs a step-up the approver's session lacks. */
  StepUpRequired: "step_up_required",
});

/** One of the codes above. */
export type ApproverRefusal = Enum.Value<typeof ApproverRefusal>;
