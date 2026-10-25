/**
 * Stackra file contract:
 * Purpose: `RouteCache`, how long the persisted query cache serves a route offline (`Route({ cache: { ttl: "1h" } })`).
 * Boundary: a type only; read by gen's offline map, never by the route at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (offline on every client).
 */

/** The offline cache window of a route. */
export interface RouteCache {
  /** A duration (`1h`, `30m`). */
  readonly ttl: string;
}
