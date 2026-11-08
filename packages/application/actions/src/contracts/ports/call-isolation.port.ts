/**
 * Stackra file contract:
 * Purpose: the `CallIsolation` port: the one transaction whose `app.*` settings (the scope, and the tenant of the
 *          verified actor) are set transaction-locally, and inside which a call or a background unit (a queue job, an
 *          outbox delivery, a workflow step, a scheduled run) runs, so every policy reads the caller's isolation and
 *          nothing outlives the transaction on a pooled connection.
 * Boundary: an abstract class that is its own token, implemented by the package that owns tenant isolation
 *           (`@stackra/tenancy`); this package names no tenant rule. The pipeline runs every call in it after the
 *           tenancy check; the queue, outbox, workflow and scheduler packages run each unit in it with the actor and
 *           scope stored with the work. An app that binds none runs as before: the unit's own `Database.withScope`, or
 *           nothing, and a tenant-scoped model fails closed.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (decision 1); ADR 0138 (as amended: tenancy step).
 */
import { Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";

/**
 * Runs work in one isolation transaction.
 *
 * @example
 * export class CallIsolationDriver extends Driver(CallIsolation) {
 *   run<T>(actor: Actor, scope: ScopeRef | readonly ScopeRef[] | undefined, work: (actor?: Actor) => Promise<T>) {
 *     return this.database.withScope(scope ?? [], () => this.isolation.withTenant(actor, () => work(actor)));
 *   }
 * }
 */
export abstract class CallIsolation extends Port {
  /**
   * Runs `work` in a transaction whose scope settings are `scope` (`undefined` or empty: no granted scope, so no
   * scoped row) and whose tenant is `actor.scopeId` (none: a platform call, which matches no tenant row). The settings
   * end with the transaction. `options.readOnly` starts it read-only: a write inside it fails. `work` receives the actor
   * the transaction runs as: `actor`, or a copy whose `scopeId` is the tenant the isolation resolved (a branch's parent
   * tenant), so the caller writes the same tenant the settings name. It is optional so that an isolation that resolves
   * nothing (a test stand-in) may call `work()`; the caller then keeps its own actor.
   *
   * @throws TypeError when `actor.scopeId` is not a tenant id or a scope path is not an `ltree` path.
   */
  abstract run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T>;
}
