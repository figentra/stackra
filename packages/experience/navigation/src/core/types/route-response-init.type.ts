/**
 * Stackra file contract:
 * Purpose: `RouteResponseInit`, the status and headers `data(value, init)` takes.
 * Boundary: a type only; the status defaults to 200.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */

/** The status and headers of a route response. */
export interface RouteResponseInit {
  /** The HTTP status; 200 when left out. */
  readonly status?: number;

  /** Extra response headers. */
  readonly headers?: Readonly<Record<string, string>>;
}
