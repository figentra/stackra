/**
 * Stackra file contract:
 * Purpose: `ApprovalBinding`, the owning service's own record of a parked call: approval id, tenant and scope, the
 *          requester with the whole `onBehalfOf` chain, the action key with its version, the hash of the validated
 *          input, the requester's assurance, when it was requested and when it expires, and the requirement.
 * Boundary: a type only. It is the only source of who, where, what and when for an execution (B1): the pipeline writes
 *           it, the executor and the verify step read it, and the daily prune deletes it; nothing updates it. The
 *           actor chain and the input hash are personal data of the owning service (its PII table and the model's
 *           docs); the hash never travels on a cross-service event (S11).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the binding, B1, N7); STA-1724 FR-007, FR-008.
 */
import type { Actor, AssuranceLevel, PublicId, ScopeRef } from "@stackra/contracts";

import type { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import type { CallAssurance } from "#contracts/types/call-assurance.type";

/** One parked call, as the service that owns the action recorded it. */
export interface ApprovalBinding {
  /** The request's id (`apr_…`). */
  readonly approvalId: PublicId<"apr">;

  /** The tenant the call acts in. */
  readonly scopeId: PublicId;

  /** The scope node the call acts in, when it has one. */
  readonly scope?: ScopeRef;

  /** The requester, with the whole `onBehalfOf` chain. */
  readonly requester: Actor;

  /** The action key with its version. */
  readonly key: string;

  /** `fingerprintOf(key, validated input)`. */
  readonly inputHash: string;

  /** The requester's assurance when the call was requested; it stands in for theirs at execution (FR-016). */
  readonly assurance?: CallAssurance;

  /** When the call was requested, by the owning service's clock. */
  readonly requestedAt: Date;

  /** When the request stops accepting votes, by the owning service's clock. */
  readonly expiresAt: Date;

  /** Distinct approvers needed besides the requester. */
  readonly approvals: number;

  /** The permission each approver holds; absent when only the tenant's rules parked the call. */
  readonly permission?: string;

  /** The assurance level an approver's session must reach. */
  readonly approverLevel?: AssuranceLevel;

  /** Whether the person an agent acts for must confirm. */
  readonly confirm: boolean;

  /** How the request executes. */
  readonly execute: ApprovalExecution;
}
