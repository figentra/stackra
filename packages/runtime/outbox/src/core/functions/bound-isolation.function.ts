/**
 * Stackra file contract:
 * Purpose: `boundIsolation(resolver)`, the `CallIsolation` the container binds, or `undefined` when the app runs
 *          without tenancy: how a cross-tenant caller that is built by injection (an operator command, a maintenance
 *          job, the warehouse sink) reaches the isolation optionally, as the action pipeline does, so an app that binds
 *          none still boots.
 * Boundary: isomorphic; the caller injects the `Container` (a `Resolver`) and asks at call time, never at construction.
 *           With none bound a platform row still runs and an owned row is refused by `inRowOwner`
 *           (`RowIsolationMissingError`).
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gap A); ADR 0263 (classes are
 *                     tokens).
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";

/**
 * The bound isolation, if any.
 *
 * @example
 * await pruneOutbox(outbox, inbox, days, now, boundIsolation(this.container));
 */
export function boundIsolation(resolver: Resolver): CallIsolation | undefined {
  return resolver.has(CallIsolation) ? resolver.get(CallIsolation) : undefined;
}
