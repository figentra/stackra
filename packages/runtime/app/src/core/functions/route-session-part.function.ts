/**
 * Stackra file contract:
 * Purpose: `routeSessionPart`, the route context part the Worker, browser and native `createApp` contribute with
 *          `contributeRouteContext`: `session` from what `loadRouteSession` loaded for the route's container, and
 *          `identity`, the container's `SessionStore`.
 * Boundary: internal; synchronous, as a part must be. A container nothing loaded (or no container) gives `session:
 *           null`, so a gated layout redirects rather than letting an unknown visitor in.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (session and identity on RouteServices); ADR 0294 (decisions 17 and 23).
 */
import { SessionStore } from "@stackra/identity/contracts";
import type { RouteContextPart } from "@stackra/navigation";

import { ROUTE_SESSIONS } from "#core/constants/route-sessions.constant";

/**
 * The session members of one route context.
 *
 * @example
 * contributeRouteContext(routeSessionPart);
 */
export const routeSessionPart: RouteContextPart = ({ container }) => ({
  session: (container === undefined ? undefined : ROUTE_SESSIONS.get(container)) ?? null,
  identity: container?.has(SessionStore) === true ? container.get(SessionStore) : undefined,
});
