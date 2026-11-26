/**
 * Stackra file contract:
 * Purpose: `deriveEndpoint`, the endpoint convention: the HTTP route of an action or a query derived from its written
 *          key the way Rails resource routing does, or the `endpoint: { method, path }` override, or none.
 * Boundary: pure. No route when `endpoint: false`, or when the actors include no user, agent, anonymous or API-key
 *           caller.
 *           Every derived path starts with its area, `/<area>`, and `/app` when no area is written (ADR 0082, ADR 0237
 *           decision 1). An override is returned as written; `checkEndpoints` refuses one outside its area.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 21: endpoints follow a convention); ADR 0305 (rule 28); ADR 0082
 *                     (decision 3: four areas); ADR 0237 (decision 1: the edge routes by area).
 */
import { camelCase, kebabCase, snakeCase } from "@stackra/support";

import { DEFAULT_AREA } from "#core/constants/default-area.constant";
import { plural } from "#core/functions/plural.function";
import type { Endpoint } from "#core/types/endpoint.type";

/**
 * The actor codes that reach a public endpoint; an anonymous-only call is answered with `auth: false` (STA-2578), and
 * an API-key caller (`api_client`, a tenant's servers) is routed like a user (B1, #867).
 */
const PUBLIC_ACTORS = new Set(["user", "agent", "anonymous", "api_client"]);

/** A derived route. */
function route(method: string, path: string): Endpoint {
  return { method, path, derived: true };
}

/**
 * The route of an action or query.
 *
 * @param request - the written key (`order.cancel`), whether it is an action or a query, the input's field names, the
 *                  actors and area options, and the `endpoint` option as written.
 * @returns the route, or undefined when the declaration has no public endpoint.
 * @example
 * deriveEndpoint({ key: "order.cancel", kind: "action", inputFields: ["orderId"] });
 * // { method: "PUT", path: "/app/orders/:orderId/cancel", derived: true }
 * deriveEndpoint({ key: "product.search", kind: "query", inputFields: [], area: "public" });
 * // { method: "GET", path: "/public/products/search", derived: true }
 */
export function deriveEndpoint(request: {
  readonly key: string;
  readonly kind: "action" | "query";
  readonly inputFields: readonly string[];
  readonly actors?: readonly string[];
  readonly area?: string;
  readonly endpoint?: unknown;
}): Endpoint | undefined {
  const { endpoint } = request;
  if (endpoint === false) return undefined;
  if (request.actors !== undefined && !request.actors.some((actor) => PUBLIC_ACTORS.has(actor)))
    return undefined;
  if (typeof endpoint === "object" && endpoint !== null) {
    const { method, path } = endpoint as { method?: unknown; path?: unknown };
    if (typeof method === "string" && typeof path === "string")
      return { method: method.toUpperCase(), path, derived: false };
  }
  const segments = request.key.split(".");
  const verb = segments.pop() ?? "";
  const model = snakeCase(segments.join("_"));
  const resource = `/${request.area ?? DEFAULT_AREA}/${kebabCase(plural(model))}`;
  const id = `${camelCase(model)}Id`;
  if (request.kind === "query") {
    if (verb === "list") return route("GET", resource);
    if (verb === "get") return route("GET", `${resource}/:${id}`);
    return route("GET", `${resource}/${kebabCase(verb)}`);
  }
  if (verb === "create") return route("POST", resource);
  if (verb === "update") return route("PATCH", `${resource}/:${id}`);
  if (verb === "delete") return route("DELETE", `${resource}/:${id}`);
  if (request.inputFields.includes(id))
    return route("PUT", `${resource}/:${id}/${kebabCase(verb)}`);
  return route("POST", `${resource}/${kebabCase(verb)}`);
}
