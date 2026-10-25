/**
 * Stackra file contract:
 * Purpose: `RouteQueryOptions`, the third argument of `ctx.query`: how long a warmed answer counts as fresh and which
 *          server cache profile it is stored under.
 * Boundary: a type only; hints the `RouteCaller` driver may ignore.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4); ADR 0297 (caching per query, never as HTML).
 */

/** Cache hints of one loader query. */
export interface RouteQueryOptions {
  /** How long the answer counts as fresh (`30s`). */
  readonly staleTime?: string;

  /** The cache profile the server stores the answer under (`CacheProfile.Catalogue`). */
  readonly cache?: string;
}
