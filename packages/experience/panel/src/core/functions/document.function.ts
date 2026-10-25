/**
 * Stackra file contract:
 * Purpose: `document(key, options)`, what gen calls in `#stackra/resources`: a document's route constant inside the panel
 *          hosting its area (`Resources.SalesOverview`).
 * Boundary: pure; returns a frozen ref whose path is the panel's mount path joined with the document's path.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0164; owner decision R-56.
 */
import type { DocumentRoute } from "#core/types/document-route.type";
import type { DocumentRouteOptions } from "#core/types/document-route-options.type";

/** A document key. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * The route constant of the document `key`.
 *
 * @throws RangeError when `key` is not `<module>.<name>` or `path` does not start with `/`.
 * @example
 * document("orders.my_orders", { path: "/orders", panel: Panels.CustomerPortal }).path; // "/portal/orders"
 */
export function document(key: string, options: DocumentRouteOptions): DocumentRoute {
  if (!KEY.test(key)) throw new RangeError(`document: "${key}" is not <module>.<name>`);
  if (!options.path.startsWith("/"))
    throw new RangeError(`document: ${key}'s path "${options.path}" does not start with "/"`);
  const mount = options.panel.path.replace(/\/+$/, "");
  return Object.freeze({
    key,
    name: key,
    path: `${mount}${options.path}`,
    panel: options.panel,
    ...(options.permission === undefined ? {} : { permission: options.permission }),
  });
}
