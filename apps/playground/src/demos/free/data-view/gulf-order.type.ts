/**
 * Stackra file contract:
 * Purpose: `GulfOrder`, one order of the collection demos' shared data (`useGulfOrders`).
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); data-collection plan (owner, 2026-10-29).
 */

/** One order of the collection demos. */
export interface GulfOrder {
  /** The row's stable key. */
  readonly id: string;
  /** The order number as shown. */
  readonly order: string;
  /** The customer's name. */
  readonly customer: string;
  /** The city the order ships to. */
  readonly city: string;
  /** The product ordered. */
  readonly product: string;
  /** The channel the order came through. */
  readonly channel: string;
  /** Where the order stands. */
  readonly status: string;
  /** The number of items ordered. */
  readonly quantity: number;
  /** The order's total amount. */
  readonly total: number;
  /** The day the order was placed. */
  readonly date: string;
}
