/**
 * Stackra file contract:
 * Purpose: `ApprovalVote`, one approver's recorded yes: who voted, the realm they voted from, and when.
 * Boundary: a type only. The store records it and core counts it: only a vote of a user actor counts, and votes of one
 *           person count once (`actorsSharePerson`). The realm is recorded so a customer-realm vote can be audited
 *           (it is refused at the store, N4).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (votes); STA-1724 FR-010.
 */
import type { Actor, Realm } from "@stackra/contracts";

/** One approver's vote. */
export interface ApprovalVote {
  /** The verified approver. */
  readonly voter: Actor;

  /** The realm the voter's session belongs to. */
  readonly realm: Realm;

  /** When the vote was recorded. */
  readonly at: Date;
}
