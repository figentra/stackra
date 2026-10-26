/**
 * Stackra file contract:
 * Purpose: `resolveApproval(request, rules)`, the approval-mode resolver in its fixed order: IAM, entitlement and flag,
 *          environment, the permission matrix's off and suggest, the floor (the platform's and the market pack's),
 *          the matrix's after approval and on its own, the organisation's policy, the user's preferences, then the
 *          default by level.
 * Boundary: pure. A refusal at IAM, entitlement or environment ends the walk; a matrix row set to off refuses (the tool
 *           is not registered there) and one set to suggest proposes (a draft, no effects), both below every floor. A
 *           floor hit or a named approver by level (L3, L4) is final: no later layer relaxes it, and only the
 *           organisation's escalation reroutes it to another human. The matrix row is the most specific match for the
 *           call's action, record, role and data class; after approval asks a named approver with the row's approver
 *           rule, on its own runs, both below the floor only. Below the floor and the matrix the organisation may only
 *           tighten (escalate, ask) before anything relaxes; L0 and L1 run at once; then allow by default, always
 *           allow, and a bypass session where the organisation allows it. The floors' and the rows' values are data
 *           (`ApprovalFloor`, `ActionPermissionRow`); this holds only the checks. An agent never approves its own call:
 *           that is the approver rule's, checked by the gate.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 5 to 10 and consequences); ADR 0100 (decision 5); ADR 0359 (decision 3);
 *                     X2-12 and J2-6 (the record layer, the pack floor, the four states); R3-SO-02.
 */
import { ActionPermission } from "#core/enums/action-permission.enum";
import { Approval } from "#core/enums/approval.enum";
import { ApprovalMode } from "#core/enums/approval-mode.enum";
import { approvalFor } from "#core/functions/approval-for.function";
import type { ActionPermissionRow } from "#core/types/action-permission-row.type";
import type { ApprovalDecision } from "#core/types/approval-decision.type";
import type { ApprovalFloor } from "#core/types/approval-floor.type";
import type { ApprovalRequest } from "#core/types/approval-request.type";
import type { ApprovalRules } from "#core/types/approval-rules.type";

/** Whether `request` hits `floor`. */
function onFloor(request: ApprovalRequest, floor: ApprovalFloor | undefined): boolean {
  if (floor === undefined) return false;
  if (floor.actions?.includes(request.action) === true) return true;
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
 * The most specific matrix row for `request`: a record id (8) over a record kind (4), then a role (2), then a data
 * class (1); the first row wins a tie. A row that names a narrowing the request lacks does not match.
 */
function rowFor(
  request: ApprovalRequest,
  rows: readonly ActionPermissionRow[] | undefined,
): ActionPermissionRow | undefined {
  let best: ActionPermissionRow | undefined;
  let bestScore = -1;
  for (const row of rows ?? []) {
    if (row.action !== request.action) continue;
    if (row.role !== undefined && request.roles?.includes(row.role) !== true) continue;
    if (row.dataClass !== undefined && row.dataClass !== request.dataClass) continue;
    if (row.record !== undefined) {
      if (row.record.kind !== request.record?.kind) continue;
      if (row.record.id !== undefined && row.record.id !== request.record?.id) continue;
    }
    const score =
      (row.record?.id !== undefined ? 8 : row.record !== undefined ? 4 : 0) +
      (row.role !== undefined ? 2 : 0) +
      (row.dataClass !== undefined ? 1 : 0);
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return best;
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

  const row = rowFor(request, rules.matrix);
  if (row?.state === ActionPermission.Off) return { outcome: "refused", step: "matrix" };
  if (row?.state === ActionPermission.Suggest) return { outcome: "propose", step: "matrix" };
  const approver = row?.approver === undefined ? {} : { approver: row.approver };

  const { policy, preferences } = rules;
  const escalates = policy.escalate.includes(request.action);
  const floor = onFloor(request, rules.floor) || onFloor(request, rules.packFloor);
  if (floor || byLevel === Approval.NamedApprover) {
    const step = floor ? "floor" : "level";
    return escalates
      ? { outcome: "escalate", step, mode: ApprovalMode.Escalate }
      : { outcome: Approval.NamedApprover, step, ...approver };
  }
  if (row?.state === ActionPermission.AfterApproval)
    return escalates
      ? { outcome: "escalate", step: "matrix", mode: ApprovalMode.Escalate }
      : { outcome: Approval.NamedApprover, step: "matrix", ...approver };
  if (row?.state === ActionPermission.OnItsOwn) return { outcome: "run", step: "matrix" };
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
