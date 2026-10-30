/**
 * Stackra file contract:
 * Purpose: `Order`, one row of the native DataTable demos' pretend order list.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */

/** One order of the demos. */
export interface Order {
  /** The row's stable key. */
  readonly id: string;
  /** The order number as shown, never translated: `#1001`. */
  readonly order: string;
  /** A sample person's name, never translated. */
  readonly customer: string;
  /** Where the order stands in payment. */
  readonly status: "paid" | "pending" | "refunded";
  /** In US dollars. */
  readonly total: number;
}
