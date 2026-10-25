/**
 * Stackra file contract:
 * Purpose: `Endpoint`, the HTTP route of an action or a query as the manifest records it: method, path with `:param`
 *          segments, and whether the route was derived from the key or written as an override.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 21: endpoints follow a convention); ADR 0305 (rule 28).
 */

/** One HTTP route of an action or query. */
export interface Endpoint {
  /** `GET`, `POST`, `PUT`, `PATCH` or `DELETE`. */
  readonly method: string;

  /** The path, with `:name` parameters (`/orders/:orderId/cancel`). */
  readonly path: string;

  /** `true` when derived from the key, `false` when `endpoint: { method, path }` wrote it. */
  readonly derived: boolean;
}
