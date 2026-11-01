/**
 * Stackra file contract:
 * Purpose: `mergeApprovalRequirements(declared, decided)`, `max(declared, decided)`: the larger approver count, the
 *          declared permission (else the decided one), the shorter window, the higher approver assurance level, and
 *          `confirm` when either asks for it.
 * Boundary: pure. The gate may add to the declared floor and never remove from it, so a driver that answers fewer
 *           approvals, a longer window or a weaker level than the declaration cannot lower it. `undefined` means "no
 *           requirement".
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the floor is enforced in core); STA-1724 FR-005, FR-018.
 */
import { AssuranceLevel, Duration, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";

/** The stronger of two assurance levels; `undefined` when neither is set. */
function stronger(a: AssuranceLevel | undefined, b: AssuranceLevel | undefined) {
  const order = Enum.values(AssuranceLevel);
  if (a === undefined || b === undefined) return a ?? b;
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

/**
 * The requirement a call must meet given what it declared and what the gate decided.
 *
 * @example
 * mergeApprovalRequirements({ approvals: 2, expiresAfter: "72h" }, { approvals: 1, expiresAfter: "24h" });
 * // { approvals: 2, expiresAfter: "24h" }
 */
export function mergeApprovalRequirements(
  declared: ApprovalRequirement | undefined,
  decided: ApprovalRequirement | undefined,
): ApprovalRequirement | undefined {
  if (declared === undefined || decided === undefined) return declared ?? decided;
  const shorter =
    Duration.toMilliseconds(duration(decided.expiresAfter)) <
    Duration.toMilliseconds(duration(declared.expiresAfter))
      ? decided.expiresAfter
      : declared.expiresAfter;
  const permission = declared.permission ?? decided.permission;
  const approverLevel = stronger(declared.approverLevel, decided.approverLevel);
  return {
    approvals: Math.max(declared.approvals, decided.approvals),
    ...(permission === undefined ? {} : { permission }),
    expiresAfter: shorter,
    ...(approverLevel === undefined ? {} : { approverLevel }),
    ...(declared.confirm === true || decided.confirm === true ? { confirm: true } : {}),
  };
}
