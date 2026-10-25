/**
 * Stackra file contract:
 * Purpose: `resolveApproval(request, rules)`, the approval-mode resolver in its fixed order: IAM, entitlement and flag,
 *          environment, the floor, the organisation's policy, the user's preferences, then the default by level.
 * Boundary: pure. A refusal at IAM, entitlement or environment ends the walk. A floor hit or a named approver by level
 *           (L3, L4) is final: no later layer relaxes it, and only the organisation's escalation reroutes it to another
 *           human. Below the floor the organisation may only tighten (escalate, ask) before anything relaxes; L0 and L1
 *           run at once; then allow by default, always allow, and a bypass session where the organisation allows it.
 *           The floor's values are data (`ApprovalFloor`); this holds only the check. An agent never approves its own
 *           call: that is the gateway's, which never routes an approval to the requesting agent.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 5 to 10 and consequences); ADR 0100 (decision 5); ADR 0359 (decision 3).
 */
import { Approval } from "#core/enums/approval.enum";
import { ApprovalMode } from "#core/enums/approval-mode.enum";
import { approvalFor } from "#core/functions/approval-for.function";
import type { ApprovalDecision } from "#core/types/approval-decision.type";
import type { ApprovalFloor } from "#core/types/approval-floor.type";
import type { ApprovalRequest } from "#core/types/approval-request.type";
import type { ApprovalRules } from "#core/types/approval-rules.type";

/** Whether `request` hits the floor. */
function onFloor(request: ApprovalRequest, floor: ApprovalFloor): boolean {
  const tags = new Set(request.tags);
  if (floor.tags.some((tag) => tags.has(tag))) return true;
  if (floor.tagSets.some((set) => set.length > 0 && set.every((tag) => tags.has(tag)))) return true;
  if (floor.deletes && request.deletes === true) return true;
  return (
    floor.recipientLimit !== undefined &&
    request.recipients !== undefined &&
    request.recipients > floor.recipientLimit
  );
}

/**
 * The approval `request` needs under `rules`.
 *
 * @throws RangeError when `request.risk` is not `L0` to `L4` (from `approvalFor`).
 * @example
 * resolveApproval(
 *   { action: "orders.order.cancel@1", risk: "L2", tags: [], permitted: true, entitled: true },
 *   { floor, policy, preferences: { alwaysAllow: ["orders.order.cancel@1"], bypass: false } },
 * ); // { outcome: "run", step: "user", mode: "always_allow" }
 */
export function resolveApproval(request: ApprovalRequest, rules: ApprovalRules): ApprovalDecision {
  const byLevel = approvalFor(request.risk);
  if (!request.permitted) return { outcome: "refused", step: "iam" };
  if (!request.entitled) return { outcome: "refused", step: "entitlement" };
  if (request.liveConfiguration === true) return { outcome: "refused", step: "environment" };

  const { policy, preferences } = rules;
  const escalates = policy.escalate.includes(request.action);
  const floor = onFloor(request, rules.floor);
  if (floor || byLevel === Approval.NamedApprover) {
    const step = floor ? "floor" : "level";
    return escalates
      ? { outcome: "escalate", step, mode: ApprovalMode.Escalate }
      : { outcome: Approval.NamedApprover, step };
  }
  if (escalates) return { outcome: "escalate", step: "policy", mode: ApprovalMode.Escalate };
  if (policy.ask.includes(request.action))
    return { outcome: Approval.Confirm, step: "policy", mode: ApprovalMode.Ask };
  if (byLevel === undefined) return { outcome: "run", step: "level" };
  if (policy.allowByDefault.includes(request.action))
    return { outcome: "run", step: "policy", mode: ApprovalMode.AllowByDefault };
  if (preferences.alwaysAllow.includes(request.action))
    return { outcome: "run", step: "user", mode: ApprovalMode.AlwaysAllow };
  if (preferences.bypass && policy.bypass)
    return { outcome: "run", step: "user", mode: ApprovalMode.Bypass };
  return { outcome: Approval.Confirm, step: "level", mode: ApprovalMode.Ask };
}
