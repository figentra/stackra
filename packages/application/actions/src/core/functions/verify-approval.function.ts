/**
 * Stackra file contract:
 * Purpose: `verifyApproval(input)`, the check in core that a call naming an approval id may run: the binding fits the
 *          call (tenant, scope, requester and chain, key, input hash), the store's row fits the binding and its snapshot
 *          hashes to it, the status is `granted` (for an `on_resubmit` request) or `executing` under this execution's
 *          own key, the window holds by the owning service's clock, at least the binding's `approvals` distinct people
 *          voted and none is the requester's person, the requester is still active with unrevoked delegations, and
 *          their sessions and factors are unchanged since the request.
 * Boundary: the store is trusted for status and votes only; every other field is compared with the binding, so a
 *           forged row is refused `approval_mismatch`. An identity rejection that is not a refusal becomes the
 *           retryable `approval_identity_unavailable`, never a pass. Resolves when the call may run; throws a refusal
 *           otherwise. Customer-realm and non-user votes never count.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (verify, B1, S1 to S6, N4, N5); ADR 0360; STA-1724 FR-008, FR-013, FR-015, FR-016 (e),
 *                     FR-019, FR-022.
 */
import { actorsSharePerson, ActorKind, Duration, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";

import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import { IDEMPOTENCY_TTL } from "#core/constants/idempotency-ttl.constant";
import { ApprovalConsumedError } from "#core/errors/approval-consumed.error";
import { ApprovalExpiredError } from "#core/errors/approval-expired.error";
import { ApprovalIdentityUnavailableError } from "#core/errors/approval-identity-unavailable.error";
import { ApprovalMismatchError } from "#core/errors/approval-mismatch.error";
import { ApprovalNotGrantedError } from "#core/errors/approval-not-granted.error";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import type { VerifyApprovalInput } from "#core/types/verify-approval-input.type";

/** Whether two actors are the same chain: the same kinds and ids, link by link. */
function sameChain(a: Actor | undefined, b: Actor | undefined): boolean {
  let left = a;
  let right = b;
  while (left !== undefined && right !== undefined) {
    if (left.kind !== right.kind || left.id !== right.id) return false;
    left = left.onBehalfOf;
    right = right.onBehalfOf;
  }
  return left === right;
}

/** Whether two scope references name the same node (or both none). */
function sameScope(a: ScopeRef | undefined, b: ScopeRef | undefined): boolean {
  return a === undefined || b === undefined ? a === b : a.id === b.id && a.path === b.path;
}

/** Runs an identity read, turning an outage (a rejection that is not a refusal) into a retryable refusal. */
async function answered<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (isRefusal(error)) throw error;
    throw ApprovalIdentityUnavailableError.create({}, { cause: error });
  }
}

/**
 * Resolves when the call may run under the approval, throws the refusal otherwise.
 *
 * @throws ApprovalMismatchError, ApprovalExpiredError, ApprovalNotGrantedError, ApprovalConsumedError, the actor
 *         check's refusals (`forbidden`, `step_up_required`), or ApprovalIdentityUnavailableError.
 * @example
 * await verifyApproval({ call, inputHash, binding, record, executionKey: `approval:${id}`, now, identity, actors });
 */
export async function verifyApproval(input: VerifyApprovalInput): Promise<void> {
  const { call, binding, record, now } = input;
  if (
    binding === undefined ||
    binding.scopeId !== call.scopeId ||
    !sameScope(binding.scope, call.scope) ||
    !sameChain(binding.requester, call.actor) ||
    binding.key !== call.key ||
    binding.inputHash !== input.inputHash
  )
    throw ApprovalMismatchError.create();
  if (
    record === undefined ||
    record.approvalId !== binding.approvalId ||
    record.key !== binding.key ||
    record.scopeId !== binding.scopeId ||
    !sameScope(record.scope, binding.scope) ||
    !sameChain(record.requester, binding.requester) ||
    record.execute !== binding.execute
  )
    throw ApprovalMismatchError.create();

  switch (record.status) {
    case ApprovalStatus.Pending: {
      if (now.getTime() > binding.expiresAt.getTime()) throw ApprovalExpiredError.create();
      throw ApprovalNotGrantedError.create();
    }
    case ApprovalStatus.Rejected:
    case ApprovalStatus.Withdrawn: {
      throw ApprovalNotGrantedError.create();
    }
    case ApprovalStatus.Expired: {
      throw ApprovalExpiredError.create();
    }
    case ApprovalStatus.Executed:
    case ApprovalStatus.Failed:
    case ApprovalStatus.Unknown: {
      throw ApprovalConsumedError.create();
    }
    case ApprovalStatus.Executing: {
      // in flight under another key, or this one: only its own retry may pass (S3)
      if (record.executionKey !== input.executionKey) throw ApprovalConsumedError.create();
      break;
    }
    case ApprovalStatus.Granted: {
      // an on_grant request runs only through the executor, which moves it to executing first (FR-013)
      if (record.execute === ApprovalExecution.OnGrant) throw ApprovalConsumedError.create();
      break;
    }
  }

  // the store's snapshot must be the input the binding hashed (B1)
  if (
    record.snapshot === undefined ||
    (await fingerprintOf(binding.key, record.snapshot)) !== binding.inputHash
  )
    throw ApprovalMismatchError.create();

  // a granted request runs for 24 hours from its grant, whatever its own window (FR-015)
  if (
    record.grantedAt === undefined ||
    now.getTime() > record.grantedAt.getTime() + Duration.toMilliseconds(IDEMPOTENCY_TTL)
  )
    throw ApprovalExpiredError.create();

  const voters: Actor[] = [];
  for (const vote of record.votes) {
    if (vote.voter.kind !== ActorKind.User || vote.realm === Realm.Customer) continue;
    if (await answered(() => actorsSharePerson(input.identity, vote.voter, binding.requester)))
      throw ApprovalMismatchError.create();
    let again = false;
    for (const earlier of voters)
      if (await answered(() => actorsSharePerson(input.identity, vote.voter, earlier))) {
        again = true;
        break;
      }
    if (!again) voters.push(vote.voter);
  }
  if (voters.length < binding.approvals) throw ApprovalNotGrantedError.create();

  await answered(() => input.actors.requireActive(binding.requester));
  await answered(() => input.actors.requireUnchangedSince(binding.requester, binding.requestedAt));
}
