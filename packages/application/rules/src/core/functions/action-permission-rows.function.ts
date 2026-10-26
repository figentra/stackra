/**
 * Stackra file contract:
 * Purpose: `actionPermissionRowsOf(outcomes)`, the reader of the AI action permission matrix: the checked `row`
 *          outcomes of an `ai.action_permissions` rule set as the `ActionPermissionRow`s `resolveApproval` takes in
 *          `ApprovalRules.matrix`.
 * Boundary: pure. The outcomes are checked against `ACTION_PERMISSION_RULES` first, so a stored row with an unknown
 *           state or a missing action is refused (`OutcomeInvalidError`), never guessed. A record id needs its record
 *           kind. A row names an approver rule when it names any of seat kind, not-requester or step-up; left out,
 *           not-requester is `yes` (an agent's requester never approves its own call) and step-up is `no`.
 * Runtime: isomorphic
 * Governing contract: ADR 0398 (decisions 1, 3 and 6); ADR 0360 (an agent never approves its own call); STA-1250.
 */
import type { ApproverRule } from "@stackra/actions/contracts";
import type { ActionPermission, ActionPermissionRow } from "@stackra/ai";

import { ACTION_PERMISSION_RULES } from "#core/constants/action-permission-rules.constant";
import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";

/** A checked row's parameters. */
type RowParams = Readonly<Partial<Record<string, string>>>;

/** The approver rule `params` name, if any. */
function approverOf(params: RowParams): ApproverRule | undefined {
  const { seatKind, notRequester, stepUp } = params;
  if (seatKind === undefined && notRequester === undefined && stepUp === undefined)
    return undefined;
  return {
    ...(seatKind === undefined ? {} : { seatKind }),
    notRequester: notRequester !== "no",
    stepUp: stepUp === "yes",
  };
}

/**
 * The matrix rows of `outcomes`, in order.
 *
 * @throws OutcomeInvalidError when an outcome is not a valid row, or a row names a record id without a record kind.
 * @example
 * actionPermissionRowsOf([{ kind: "row", params: { action: "legal.claim.file@1", state: "after_approval", role: "associate" } }]);
 * // [{ action: "legal.claim.file@1", state: "after_approval", role: "associate" }]
 */
export function actionPermissionRowsOf(outcomes: unknown): ActionPermissionRow[] {
  return ACTION_PERMISSION_RULES.checkOutcomes(outcomes).map((outcome, index) => {
    // reason: `checkOutcomes` held every parameter of `row` to its type, each a string or an enum code
    const params = outcome.params as RowParams;
    const { recordKind, recordId, role, dataClass } = params;
    if (recordId !== undefined && recordKind === undefined)
      throw OutcomeInvalidError.create(
        {},
        { fieldErrors: { [`${index}.params.recordKind`]: "param_missing" } },
      );
    const approver = approverOf(params);
    return Object.freeze({
      action: String(params["action"]),
      // reason: `state` is one of `STATES`' codes, which `satisfies` ties to `ActionPermission`
      state: params["state"] as ActionPermission,
      ...(role === undefined ? {} : { role }),
      ...(recordKind === undefined
        ? {}
        : {
            record:
              recordId === undefined ? { kind: recordKind } : { kind: recordKind, id: recordId },
          }),
      ...(dataClass === undefined ? {} : { dataClass }),
      ...(approver === undefined ? {} : { approver }),
    });
  });
}
