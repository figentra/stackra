/**
 * Stackra file contract:
 * Purpose: `ApprovalRequirement`, what a call needs before it may run: how many distinct approvers besides the
 *          requester, the permission each must hold in the request's scope, how long the request lives, the assurance
 *          level an approver's session must reach, and whether the person an agent acts for must confirm first.
 * Boundary: a type only. The declared requirement comes from `Action({ approval })`; the gate's `decide` may add to it
 *           from tenant rules and the AI floor but never remove from it, and the pipeline enforces the larger of the
 *           two (`mergeApprovalRequirements`). Durations are strings (`"72h"`), as in the declaration.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (decisions on the declared floor); STA-1724 FR-001, FR-005, FR-018.
 */
import type { AssuranceLevel } from "@stackra/contracts";

/** The approvals one call needs. */
export interface ApprovalRequirement {
  /** Distinct approvers besides the requester, a whole number from 1. */
  readonly approvals: number;

  /** The permission each approver holds in the request's scope. */
  readonly permission?: string;

  /** How long the request lives, a duration string (`"72h"`, at most `"720h"`). */
  readonly expiresAfter: string;

  /** The assurance level an approver's session must reach at vote time. */
  readonly approverLevel?: AssuranceLevel;

  /** Whether the person an agent acts for must confirm (ADR 0360); the declared stage never sets it. */
  readonly confirm?: boolean;
}
