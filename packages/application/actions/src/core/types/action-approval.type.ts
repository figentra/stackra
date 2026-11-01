/**
 * Stackra file contract:
 * Purpose: `ActionApproval`, what `Action({ approval })` takes beyond `true`: how many distinct approvers besides the
 *          requester, the permission each must hold in the request's scope, how long the request lives, and the
 *          `ApprovalCondition` class that says when a call needs it.
 * Boundary: a type only. `approvals` is a whole number from 1 (default 1, four-eyes); `expiresAfter` is a duration
 *           string, default `"72h"`, at most `"720h"` (30 days); no `when` means every call needs approval. The
 *           pipeline enforces this declaration as a floor: the gate's rules and the AI modes may add to it, never
 *           remove from it. `Action()` refuses any other shape at boot, and gen refuses the same.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the declared floor); STA-1724 FR-001, FR-003, L-01, L-03.
 */
import type { AnyClass } from "@stackra/container";

import type { ApprovalCondition } from "#core/bases/approval-condition.base";

/** The declared approval stage of an action. */
export interface ActionApproval {
  /** Distinct approvers besides the requester, a whole number from 1; `1` when absent. */
  readonly approvals?: number;

  /** A `Permissions` static (`CouponPermissions.approve`) the approver must hold in the request's scope. */
  readonly permission: unknown;

  /** How long the request lives, a duration string; `"72h"` when absent, at most `"720h"`. */
  readonly expiresAfter?: string;

  /** The condition that says whether a call needs approval; every call does when absent. */
  readonly when?: AnyClass<ApprovalCondition>;
}
