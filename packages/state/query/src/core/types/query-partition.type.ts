/**
 * Stackra file contract:
 * Purpose: `QueryPartition`, whose cache and queue the host opens: the signed-in principal and the active scope, given
 *          to `MutationQueue.open` and `ServerStateCache.open` after sign-in and on every switch.
 * Boundary: a type only. Both ids come from the authenticated session and the scope context, never from request input;
 *           `QueryConfig.scope` decides whether the scope is part of the key. `null` principal is the signed-out
 *           partition, which no signed-in user reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (cached personal data); ADR 0135 (public ids); ADR 0327 (`ScopeRef`: the node id and path, no level).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/**
 * The owner of one cache and one queue.
 *
 * @example
 * await queue.open({ principal: session.user.userId, scope: scopes.current });
 */
export interface QueryPartition {
  /** The signed-in principal's public id, or `null` while signed out. */
  readonly principal: PublicId | null;

  /** The active scope, or `null` when none is active. */
  readonly scope: ScopeRef | null;
}
