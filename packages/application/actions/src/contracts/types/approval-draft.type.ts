/**
 * Stackra file contract:
 * Purpose: `ApprovalDraft`, what `ApprovalGate.park` writes to the store: the approval id the pipeline minted, the
 *          action key, tenant, scope and requester for display and voting, the input snapshot, the requirement with
 *          its approver assurance level, when it expires, and how it executes.
 * Boundary: a type only. Nothing the store holds decides the identity, scope or input of an execution: the binding in
 *           the owning service does (`ApprovalBinding`). The snapshot is the validated input and is deleted at a
 *           final state (FR-014); a `credential` field never reaches it (gen refuses it, FR-003).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the draft and the binding, B1); STA-1724 FR-007, FR-014.
 */
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";

import type { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";

/** The request the store holds for voters. */
export interface ApprovalDraft {
  /** The request's id, minted by the pipeline (`apr_…`). */
  readonly approvalId: PublicId<"apr">;

  /** The action key with its version. */
  readonly key: string;

  /** The tenant the call acts in. */
  readonly scopeId: PublicId;

  /** The scope node the call acts in, when it has one. */
  readonly scope?: ScopeRef;

  /** The requester, with the whole `onBehalfOf` chain. */
  readonly requester: Actor;

  /** The validated input the call will run with. */
  readonly snapshot: unknown;

  /** What the request needs; `permission` is absent when only the tenant's rules parked it (the store's rules decide). */
  readonly requirement: ApprovalRequirement;

  /** When the request stops accepting votes, by the owning service's clock. */
  readonly expiresAt: Date;

  /** `on_grant` for a declared stage, `on_resubmit` for a request parked only by tenant rules. */
  readonly execute: ApprovalExecution;
}
