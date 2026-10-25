/**
 * Stackra file contract:
 * Purpose: `RouteContextPart`, what a contributing package hands `contributeRouteContext`: a function that returns its
 *          `RouteServices` members for one request (identity its `session` from the request's cookie, iam its
 *          `actor`), read when the context is built.
 * Boundary: a type only. A function rather than a value, so a member that depends on the request is never stale.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import type { Container } from "@stackra/container";

import type { RouteServices } from "#core/types/route-services.type";

/** One package's members of the route context, read per request. */
export type RouteContextPart = (request: {
  /** The request being loaded or submitted. */
  readonly request: Request;
  /** The container the route runs in, when the adapter has one. */
  readonly container: Container | undefined;
}) => Partial<RouteServices>;
