/**
 * Stackra file contract:
 * Purpose: the `ConnectionResolver` port: which connection set (a cell: a primary and its replicas) serves the work of
 *          one scope, so a `Database` driver can pick the connection before the transaction opens.
 * Boundary: an abstract class that is its own token. The free driver is `PrimaryConnectionResolverDriver` (`./node`):
 *           every scope on `PRIMARY_CONNECTION`, the one pool. `@stackra/tenancy` answers from the tenant placement.
 *           The routing `Database` driver that opens a connection set per name is stackra-322 (P2); nothing here
 *           opens a connection. It names no tenant: a scope is the contracts `ScopeRef`.
 * Runtime: isomorphic
 * Governing contract: ADR 0088 (decision 3: the connection resolver contract is free, DB-per-tenant a Pro driver); ADR
 *                     0186 (decision 6: cells later, "data plus a picker"); ADR 0263 (ports resolve by type);
 *                     stackra-310.
 */
import { Port, type ScopeRef } from "@stackra/contracts";

/**
 * Names the connection set of a scope.
 *
 * @example
 * export class PrimaryConnectionResolverDriver extends Driver(ConnectionResolver) {
 *   async connectionOf(): Promise<string> {
 *     return PRIMARY_CONNECTION;
 *   }
 * }
 */
export abstract class ConnectionResolver extends Port {
  /**
   * The name of the connection set that serves `scope`; `PRIMARY_CONNECTION` for a scope with no other placement.
   *
   * @param scope - the scope the work runs in; `undefined` for platform-wide work, which the primary serves.
   */
  abstract connectionOf(scope: ScopeRef | undefined): Promise<string>;
}
