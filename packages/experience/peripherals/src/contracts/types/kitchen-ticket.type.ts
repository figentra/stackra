/**
 * Stackra file contract:
 * Purpose: `KitchenTicket`, what a kitchen ticket printer prints for one station: the order, the station it is routed
 *          to and the lines, already laid out and translated by the caller (`"2x Shawarma, no garlic"`), or the ticket
 *          already drawn as a 1-bit image (an Arabic ticket: shaping and direction are the renderer's, ADR 0339 d2).
 * Boundary: a type only. Lines are text, never printer commands; a driver drops control characters. A raster, when
 *           given, is printed instead of the lines (the lines stay for the memory driver and the audit). Which items
 *           go to which station is the product's routing; which named printer serves a station is configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the POS kit's printers); ADR 0339 (decisions 1 and 2); ADR 0449.
 */
import type { RasterImage } from "#contracts/types/raster-image.type";

/** A ticket for one kitchen station. */
export interface KitchenTicket {
  /** The order the ticket is for; the printed result names it back. */
  readonly orderId: string;

  /** The station key the ticket is routed to (`grill`, `cold`, `bar`). */
  readonly station: string;

  /** The lines, top to bottom, as they should read on paper. */
  readonly lines: readonly string[];

  /** The ticket drawn as a 1-bit image, printed instead of the lines; absent for a text ticket. */
  readonly raster?: RasterImage | undefined;
}
