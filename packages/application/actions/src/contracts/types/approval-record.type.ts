/**
 * Stackra file contract:
 * Purpose: `ApprovalRecord`, one request as the store answers `ApprovalGate.find`: its status, votes, snapshot and
 *          the facts the store alone knows (when it was granted, which execution key holds it).
 * Boundary: a type only. The store is trusted for status and votes and for nothing else: `verifyApproval` compares
 *           every other field with the owning service's binding and refuses a row that differs. The snapshot is absent
 *           once the request reached a final state.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the store supplies status, votes and snapshot); STA-1724 FR-008, FR-021.
 */
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";

import type { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import type { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import type { ApprovalVote } from "#contracts/types/approval-vote.type";

/** A request as the store holds it. */
export interface ApprovalRecord {
  /** The request's id. */
  readonly approvalId: PublicId<"apr">;

  /** Where the request is. */
  readonly status: ApprovalStatus;

  /** The action key the store holds for it. */
  readonly key: string;

  /** The tenant the store holds for it. */
  readonly scopeId: PublicId;

  /** The scope node the store holds for it. */
  readonly scope?: ScopeRef;

  /** The requester the store holds for it. */
  readonly requester: Actor;

  /** The input snapshot; absent at a final state. */
  readonly snapshot?: unknown;

  /** The votes recorded so far. */
  readonly votes: readonly ApprovalVote[];

  /** How it executes. */
  readonly execute: ApprovalExecution;

  /** When it was granted, by the store's clock; absent until then. */
  readonly grantedAt?: Date;

  /** The execution key that moved it to `executing`; absent before. */
  readonly executionKey?: string;

  /** The refusal code of a `failed` request. */
  readonly failureCode?: string;
}
