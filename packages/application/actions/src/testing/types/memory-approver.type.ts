/**
 * Stackra file contract:
 * Purpose: `MemoryApprover`, the facts the memory approval gate needs to judge one vote: the voter, their realm, the
 *          permissions they hold, their session's assurance and step-up, whether it is an operator-access session, and
 *          whether they are still active.
 * Boundary: a type only, for tests. The real store reads these from identity, iam and the session at the vote.
 * Runtime: node
 * Governing contract: ADR 0509 (approve rules, N4, N6); STA-1724 FR-010.
 */
import type { Actor, AssuranceLevel, Realm } from "@stackra/contracts";

/** One approver at the moment of a vote. */
export interface MemoryApprover {
  /** The verified approver. */
  readonly actor: Actor;

  /** The realm of the approver's session. */
  readonly realm: Realm;

  /** The permissions the approver holds in the request's scope. */
  readonly permissions: readonly string[];

  /** The assurance level of the session; none when unknown. */
  readonly assurance?: AssuranceLevel;

  /** Whether the session stepped up for this vote. */
  readonly steppedUp: boolean;

  /** Whether the session is an operator-access session (ADR 0188); such a vote is refused. */
  readonly operatorAccess?: boolean;

  /** Whether the approver is still active; `true` when absent. */
  readonly active?: boolean;
}
