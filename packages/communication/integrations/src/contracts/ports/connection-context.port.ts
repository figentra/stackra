/**
 * Stackra file contract:
 * Purpose: the `ConnectionContext` port: who may own a connection in the running call, its scope node and the user it
 *          acts for. A store walks an Integration's levels against it, and places a new connection with it.
 * Boundary: an abstract class that is its own token, exported from `./contracts` only (ADR 0294 decision 15). It
 *           imports `@stackra/contracts` only. The `request` driver in `.` (`RequestConnectionContextDriver`) reads
 *           the call's current scope and actor (ADR 0327 decision 6 puts the scope in the action context). The answers
 *           are the authenticated principal's, never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 9); ADR 0327 (decisions 5 and 6); ADR 0294 (decision 15); R-59 (no tenant
 *                     vocabulary outside tenancy).
 */
import { Port, type PublicId, type ScopeRef } from "@stackra/contracts";

/**
 * The owners the running call can reach.
 *
 * @example
 * export class RequestConnectionContextDriver extends Driver(ConnectionContext) {
 *   scope() { return this.call()?.scope; }
 *   user() { return userOf(this.call()?.actor); }
 * }
 */
export abstract class ConnectionContext extends Port {
  /** The scope node the call acts in; undefined for a platform call. */
  abstract scope(): ScopeRef | undefined;

  /** The user the call acts for (`actor.onBehalfOf ?? actor`, when that is a user); undefined otherwise. */
  abstract user(): PublicId<"usr"> | undefined;
}
