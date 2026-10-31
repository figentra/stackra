/**
 * Stackra file contract:
 * Purpose: the `ScopeOwnership` port: whether an actor's own scope is the one that owns a unit of work's scope, so a
 *          consumer that takes an actor from a stored message (the inbox) can refuse to trust one that does not match
 *          the scope the message carries.
 * Boundary: an abstract class that is its own token, implemented by the package that owns the scope-to-owner rule
 *           (`@stackra/tenancy`); this package names no tenant rule. An app that binds none trusts the stored actor, as
 *           the event bus is trusted for actor identity (ADR 0142).
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2); ADR 0142 (transport behind the port).
 */
import { Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";

/**
 * Checks an actor against a scope.
 *
 * @example
 * export class TenantScopeOwnershipDriver extends Driver(ScopeOwnership) {
 *   async holds(actor: Actor, scope: ScopeRef | undefined): Promise<boolean> {
 *     return actor.scopeId === undefined || (scope !== undefined && (await ownerOf(scope)) === actor.scopeId);
 *   }
 * }
 */
export abstract class ScopeOwnership extends Port {
  /**
   * Resolves `true` when `actor` acts in no scope of its own (a platform actor), or acts in the scope that owns
   * `scope`; `false` when its scope is not the owner of `scope`, or `scope` is absent.
   */
  abstract holds(actor: Actor, scope: ScopeRef | undefined): Promise<boolean>;
}
