/**
 * Stackra file contract:
 * Purpose: `ConnectionHostCalls`, the five refs of the integrations service's generated client that
 *          `ClientConnectionHostDriver` calls: resolve (the reachable records), load (one record), store, disconnect
 *          and token (a fresh access token).
 * Boundary: a type only; configuration, not code. The host passes the refs gen wrote into its
 *           `#stackra/clients/<service>` subpath, so this package names no wire key and no route: those follow gen
 *           (`<module>.<aggregate>.<verb>@<n>`) and the service's manifest. Each ref is an action or a query, as the
 *           service declares it. Inputs: resolve `{ integrationKey, scope?, userId? }`, load and token
 *           `{ integrationKey, id }`, store `{ integrationKey, record, tokens?, credentialsExpireAt? }`, disconnect
 *           `{ id, integrationKey }`. Outputs: resolve `{ items }`, load `{ record? }`, token `{ accessToken }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0308 (rules 12 and 20).
 */
import type { ActionRef, QueryRef } from "@stackra/clients";

/** A ref the driver calls: an action or a query of the service. */
type HostRef = ActionRef | QueryRef;

/**
 * The service's refs, by role.
 *
 * @example
 * const calls: ConnectionHostCalls = {
 *   resolve: ResolveConnectionsQuery,
 *   load: LoadConnectionQuery,
 *   store: StoreConnectionAction,
 *   disconnect: DisconnectConnectionAction,
 *   token: IssueAccessTokenAction,
 * };
 */
export interface ConnectionHostCalls {
  /** The live records of an Integration key that an owner reaches. */
  readonly resolve: HostRef;

  /** One live record, or none. */
  readonly load: HostRef;

  /** Stores a checked record with its tokens and credentials' expiry. */
  readonly store: HostRef;

  /** Revokes and destroys a connection's credentials, keeping a tombstone. */
  readonly disconnect: HostRef;

  /** A fresh access token of an OAuth connection. */
  readonly token: HostRef;
}
