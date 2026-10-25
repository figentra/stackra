/**
 * Stackra file contract:
 * Purpose: `contributeRouteContext(part)`, how a package supplies the `RouteServices` members it declared: identity its
 *          `session` and `identity`, iam its `actor`, state its `prefs`.
 * Boundary: writes `ROUTE_CONTEXT_PARTS`; returns the disposer that removes the part again. Parts are merged in
 *           contribution order, so a later part wins a member both supply.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import { ROUTE_CONTEXT_PARTS } from "#core/constants/route-context-parts.constant";
import type { RouteContextPart } from "#core/types/route-context-part.type";

/**
 * Adds `part` to every route context built from now on, until the returned disposer is called.
 *
 * @example
 * contributeRouteContext(({ container }) => ({ session: container?.get(SessionStore).current() ?? null }));
 */
export function contributeRouteContext(part: RouteContextPart): () => void {
  // a wrapper, so contributing one function twice gives two parts with their own disposers
  const own: RouteContextPart = (request) => part(request);
  ROUTE_CONTEXT_PARTS.add(own);
  return () => {
    ROUTE_CONTEXT_PARTS.delete(own);
  };
}
