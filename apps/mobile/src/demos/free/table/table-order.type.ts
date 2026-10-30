/**
 * Stackra file contract:
 * Purpose: `TableOrder`, one row of the native Table demos.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */

/** One order of the demos; the number and the customer are sample data, never translated. */
export interface TableOrder {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly status: "paid" | "pending" | "refunded";
  /** In US dollars. */
  readonly total: number;
}
