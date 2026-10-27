/**
 * Stackra file contract:
 * Purpose: `AccessExplanation`, why the decision point allowed or refused one permission: the answer, the reason, the
 *          link of the actor chain that decided, and the snapshot version, role or deny rule involved.
 * Boundary: a type only, for the audit record (every deny and every L3 or L4 allow) and the explain query; it is never
 *           sent to the refused caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 3); ADR 0098 (the actor chain).
 */
import type { PublicId } from "@stackra/contracts";

import type { AccessReason } from "#core/enums/access-reason.enum";

/**
 * One explained decision.
 *
 * @example
 * { allowed: false, reason: AccessReason.Denied, principal: "usr_01j9z3k4m5n6p7q8r9s0t1v2w1", version: 42, rule: 0 }
 */
export interface AccessExplanation {
  /** Whether the permission is held. */
  readonly allowed: boolean;

  /** Why the decision came out as it did. */
  readonly reason: AccessReason;

  /** The principal of the link that decided: the first refused link, else the last link of the chain. */
  readonly principal: PublicId;

  /** The snapshot version read; absent when the platform decided without one. */
  readonly version?: number;

  /** The role whose grant held the permission, for an allow by grant. */
  readonly role?: string;

  /** The index of the deny rule that matched in the snapshot's `denies`, for a deny. */
  readonly rule?: number;

  /** The index of the break-glass grant in the snapshot's `breakGlass`, for an allow by break-glass. */
  readonly breakGlass?: number;
}
