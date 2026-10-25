/**
 * Stackra file contract:
 * Purpose: `PageRef`, a generated screen's route constant: its route name and its path pattern (`/orders/orders/:id`).
 * Boundary: a type only; route keys are generated constants, never strings in authored code (R-56). The router adapter
 *           fills the `:params`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307; ADR 0164; owner decision R-56 (generated route keys).
 */

/** A generated screen's route. */
export interface PageRef {
  /** The route name (`orders.order.view`). */
  readonly name: string;

  /** The path pattern; `:id` is the record's public id. */
  readonly path: string;
}
