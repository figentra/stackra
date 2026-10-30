/**
 * Stackra file contract:
 * Purpose: `TableOrder`, one row of the native Table demos.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */

/** One order of the demos; the number and the customer are sample data, never translated. */
export interface TableOrder {
  /** The row's stable key. */
  readonly id: string;
  /** The order number as shown: `#1001`. */
  readonly order: string;
  /** A sample person's name. */
  readonly customer: string;
  /** Where the order stands in payment. */
  readonly status: "paid" | "pending" | "refunded";
  /** In US dollars. */
  readonly total: number;
}
