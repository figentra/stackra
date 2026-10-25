/**
 * Stackra file contract:
 * Purpose: `EndpointOptions`, an action's or query's `endpoint` override: the HTTP method and path that replace the
 *          route gen derives from the key.
 * Boundary: a type only. Omitted, gen derives the route by the endpoint convention; `endpoint: false` removes it. A
 *           query takes `GET` only and an action never does (checked when the class is declared).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 21: endpoints follow a convention); ADR 0305 (rule 28).
 */
import type { HttpMethod } from "@stackra/contracts";

/** A route override. */
export interface EndpointOptions {
  /** The method; `GET` for a query, `POST`, `PUT`, `PATCH` or `DELETE` for an action. */
  readonly method: HttpMethod;

  /** The path, kebab-case and plural, starting with `/` (`/loyalty/accounts/:accountId/freeze`). */
  readonly path: string;
}
