/**
 * Stackra file contract:
 * Purpose: `BreakGlassGrant`, a time-boxed emergency grant: a role at a scope node, opened by a principal with a
 *          stated reason (and approved by another, where the workflow asks), counting only between its start and end.
 * Boundary: a type only. The IAM service opens it through a workflow and audits every decision it allows; the decision
 *           point counts it only inside its window, and only past the denies marked `breakable`. Its longest duration
 *           is a setting, not a number here.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 3); OS-21 (break-glass on live); JUR-335 (break-glass into a walled
 *                     matter); STA-595.
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/** One break-glass grant. */
export interface BreakGlassGrant {
  /** The role it lends. */
  readonly role: string;

  /** The node it applies at and below. */
  readonly scope: ScopeRef;

  /** Why it was opened, as the requester wrote it; shown in the audit and the access review. */
  readonly reason: string;

  /** Who asked for it. */
  readonly openedBy: PublicId;

  /** Who approved it, when the workflow needs a second person; needed for a restricted permission. */
  readonly approvedBy?: PublicId;

  /** When it starts counting. */
  readonly startsAt: Date;

  /** When it stops counting. */
  readonly expiresAt: Date;
}
