/**
 * Stackra file contract:
 * Purpose: `ResourceRoutes<O>`, what `resource(key, options)` returns: the resource's route constants (`Resources.Order.view`)
 *          and its operation refs.
 * Boundary: a type only; the View, Create and Edit constants exist only when their operation does, so a redirect to a
 *           page that does not exist fails to compile.
 * Runtime: isomorphic
 * Governing contract: ADR 0164; ADR 0307; owner decision R-56.
 */
import type { PageRef } from "#core/types/page-ref.type";
import type { ResourceRoutesOptions } from "#core/types/resource-routes-options.type";

/** A resource's route constants. */
export type ResourceRoutes<O extends ResourceRoutesOptions = ResourceRoutesOptions> = {
  /** The resource key (`orders.order`). */
  readonly key: string;
  /** The list path. */
  readonly base: string;
  /** The read permission, when given. */
  readonly permission?: string;
  /** The operation refs as given. */
  readonly operations: Readonly<Omit<O, "base" | "permission">>;
  /** The List page. */
  readonly list: PageRef;
} & (O extends { readonly view: object } ? { readonly view: PageRef } : unknown) &
  (O extends { readonly create: object } ? { readonly create: PageRef } : unknown) &
  (O extends { readonly update: object } ? { readonly edit: PageRef } : unknown);
