/**
 * Stackra file contract:
 * Purpose: `RouteResponse<V>`, data with an HTTP status and headers: what `data(value, init)` builds, `ctx.fieldErrors`
 *          answers (400) and `ctx.notFound` throws (404).
 * Boundary: a type only; made by those functions alone (it carries the brand). The web adapters turn it into React
 *           Router's `data()`, thrown or returned; a page receives `data` alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0140 (error envelope).
 */
import type { ROUTE_RESPONSE } from "#core/constants/route-response-brand.constant";

/** Data with a status. */
export interface RouteResponse<V> {
  /** Type and runtime brand (non-enumerable). */
  readonly [ROUTE_RESPONSE]: true;

  /** The data the page or the error boundary receives. */
  readonly data: V;

  /** The HTTP status. */
  readonly status: number;

  /** Extra response headers. */
  readonly headers: Readonly<Record<string, string>>;
}
