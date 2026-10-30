/**
 * Stackra file contract:
 * Purpose: `Views<R, I>`, the builder a resource's `views(v)` member receives: one preset view per call.
 * Boundary: a type only; filter keys are paths of the row `R`, and a fixed input (`.input`) is typed by `I`, the list
 *           query's input, when the override names it (`Views<R, QueryInput<typeof ListQuery>>`). Users save their own
 *           views beside these.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 9).
 */
import type { Path } from "#core/types/path.type";
import type { ViewBuilder } from "#core/types/view-builder.type";

/**
 * Builds the preset views of a table over row type `R`.
 *
 * @example
 * override views(v: Views<OrderView>) {
 *   return [v.view("awaiting_payment", { status: [OrderStatus.PendingPayment] })];
 * }
 * override views(v: Views<CustomerView, QueryInput<typeof ListCustomersQuery>>) {
 *   return [v.view("merged", {}).input({ includeMerged: true })];
 * }
 */
export interface Views<R, I = Readonly<Record<string, unknown>>> {
  /** A preset view named `name` with `filter` applied. */
  view: (name: string, filter: { readonly [K in Path<R>]?: unknown }) => ViewBuilder<R, I>;
}
