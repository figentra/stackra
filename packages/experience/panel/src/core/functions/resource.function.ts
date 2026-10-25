/**
 * Stackra file contract:
 * Purpose: `resource(key, options)`, what gen calls in `#stackra/resources`: a resource's route constants
 *          (`Resources.Order.view`, a page ref a route redirects to) and its operation refs.
 * Boundary: pure; returns frozen refs. List always exists, View with a get query, Create with a create action, Edit with an
 *           update action. Paths: the list is `base`, View `base/:id`, Create `base/new`, Edit `base/:id/edit`.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (0294 note: pages follow from operations); ADR 0307; owner decision R-56 (generated route keys).
 */
import type { PageRef } from "#core/types/page-ref.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import type { ResourceRoutesOptions } from "#core/types/resource-routes-options.type";

/** A resource key. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** A frozen page ref. */
const page = (name: string, path: string): PageRef => Object.freeze({ name, path });

/**
 * The route constants of the resource `key`.
 *
 * @throws RangeError when `key` is not `<module>.<model>` or `base` does not start with `/`.
 * @example
 * export const Resources = {
 *   Order: resource("orders.order", { base: "/orders/orders", list: ListOrdersQuery, view: GetOrderQuery }),
 * } as const;
 * Resources.Order.view.path; // "/orders/orders/:id"
 */
export function resource<const O extends ResourceRoutesOptions>(
  key: string,
  options: O,
): ResourceRoutes<O> {
  if (!KEY.test(key)) throw new RangeError(`resource: "${key}" is not <module>.<model>`);
  const { base, permission, ...operations } = options;
  if (!base.startsWith("/"))
    throw new RangeError(`resource: ${key}'s base "${base}" does not start with "/"`);
  return Object.freeze({
    key,
    base,
    ...(permission === undefined ? {} : { permission }),
    operations: Object.freeze(operations),
    list: page(`${key}.list`, base),
    ...(options.view === undefined ? {} : { view: page(`${key}.view`, `${base}/:id`) }),
    ...(options.create === undefined ? {} : { create: page(`${key}.create`, `${base}/new`) }),
    ...(options.update === undefined ? {} : { edit: page(`${key}.edit`, `${base}/:id/edit`) }),
  }) as unknown as ResourceRoutes<O>;
}
