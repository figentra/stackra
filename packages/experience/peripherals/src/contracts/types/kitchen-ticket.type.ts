/**
 * Stackra file contract:
 * Purpose: `KitchenTicket`, what a kitchen ticket printer prints for one station: the order, the station it is routed
 *          to and the lines, already laid out and translated by the caller (`"2x Shawarma, no garlic"`).
 * Boundary: a type only. Lines are text, never printer commands; a driver drops control characters. Which items go to
 *           which station is the product's routing, not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the POS kit's printers); ADR 0339 (decision 1).
 */

/** A ticket for one kitchen station. */
export interface KitchenTicket {
  /** The order the ticket is for; the printed result names it back. */
  readonly orderId: string;

  /** The station key the ticket is routed to (`grill`, `cold`, `bar`). */
  readonly station: string;

  /** The lines, top to bottom, as they should read on paper. */
  readonly lines: readonly string[];
}
