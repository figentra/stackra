/**
 * Stackra file contract:
 * Purpose: `VerifyApprovalInput`, what `verifyApproval` compares: the call, the hash of its validated input, the
 *          owning service's binding and the store's record, the execution key it runs under, the owning service's
 *          clock reading, and the two identity ports it asks.
 * Boundary: a type only. The binding and the record are what the ports answered, `undefined` when they have none.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (verify in core); STA-1724 FR-008.
 */
import type { IdentityResolver } from "@stackra/contracts";

import type { ActorStatusCheck } from "#contracts/ports/actor-status-check.port";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/** One verification of an approval id against a call. */
export interface VerifyApprovalInput {
  /** The call that names the approval id. */
  readonly call: CallDescriptor;

  /** `fingerprintOf(call key, validated input)`. */
  readonly inputHash: string;

  /** The binding of the call's tenant with that id, when there is one. */
  readonly binding: ApprovalBinding | undefined;

  /** The store's request with that id, when there is one. */
  readonly record: ApprovalRecord | undefined;

  /** The key this execution runs under (`approval:<id>`). */
  readonly executionKey: string;

  /** Now, by the owning service's clock. */
  readonly now: Date;

  /** Resolves a person from an actor. */
  readonly identity: IdentityResolver;

  /** Reads whether the requester may still be acted for. */
  readonly actors: ActorStatusCheck;
}
