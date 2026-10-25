/**
 * Stackra file contract:
 * Purpose: `Views<R>`, the builder a resource's `views(v)` member receives: one preset view per call.
 * Boundary: a type only; filter keys are paths of the row `R`. Users save their own views beside these.
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
 */
export interface Views<R> {
  /** A preset view named `name` with `filter` applied. */
  view(name: string, filter: { readonly [K in Path<R>]?: unknown }): ViewBuilder<R>;
}
