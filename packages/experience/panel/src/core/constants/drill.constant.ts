/**
 * Stackra file contract:
 * Purpose: `Drill`, where a click on a KPI goes: `Drill.resource(OrderResource, { filter, view })` opens the resource's
 *          list, filtered or in one of its views.
 * Boundary: pure: returns a frozen `DrillNode`. The filter keys are paths of the resource's row; a value may be a bind.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: the display adds a drill-down).
 */
import type { ResourceBase } from "#core/bases/resource.base";
import type { DrillNode } from "#core/types/drill-node.type";
import type { Path } from "#core/types/path.type";

/** The list row of a resource class. */
type RowOfResource<C> = C extends abstract new (...args: never[]) => ResourceBase<object, infer R>
  ? R
  : never;

/**
 * Drill-down targets.
 *
 * @example
 * Drill.resource(OrderResource, { filter: { status: [OrderStatus.Paid], paidAt: Bind.range() } });
 */
export const Drill = Object.freeze({
  /** The list of `resource`, filtered by `filter` or opened on `view`. */
  resource: <C extends abstract new (...args: never[]) => object>(
    resource: C,
    options: {
      readonly filter?: { readonly [K in Path<RowOfResource<C>>]?: unknown };
      readonly view?: string;
    } = {},
  ): DrillNode =>
    Object.freeze({
      kind: "resource",
      resource,
      ...(options.view === undefined ? {} : { view: options.view }),
      ...(options.filter === undefined ? {} : { filter: Object.freeze({ ...options.filter }) }),
    }),
});
