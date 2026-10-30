/**
 * Stackra file contract:
 * Purpose: `GulfOrder`, one order of the collection demos' shared data (`useGulfOrders`).
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); data-collection plan (owner, 2026-10-29).
 */

/** One order. */
export interface GulfOrder {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly city: string;
  readonly product: string;
  readonly channel: string;
  readonly status: string;
  readonly quantity: number;
  readonly total: number;
  readonly date: string;
}
