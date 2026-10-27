/**
 * Stackra file contract:
 * Purpose: `Parcel`, one box handed to a carrier: its outside dimensions and its actual weight, in whole metric units.
 * Boundary: a type in the leaf entry. Millimetres and grams keep every value a whole number, so dimensional weight is
 *           exact; a connector converts to its carrier's units at its edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 6).
 */

/**
 * One box in a shipment.
 *
 * @example
 * const parcel: Parcel = { lengthMm: 400, widthMm: 300, heightMm: 200, weightG: 2_500 };
 */
export interface Parcel {
  /** Outside length in millimetres; a positive whole number. */
  readonly lengthMm: number;

  /** Outside width in millimetres; a positive whole number. */
  readonly widthMm: number;

  /** Outside height in millimetres; a positive whole number. */
  readonly heightMm: number;

  /** Actual weight in grams, packed; a positive whole number. */
  readonly weightG: number;
}
