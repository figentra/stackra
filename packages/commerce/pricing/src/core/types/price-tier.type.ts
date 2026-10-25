/**
 * Stackra file contract:
 * Purpose: `PriceTier`, one band of a graduated price: the units up to `upTo` (counted from the end of the band
 *          before) each cost `unitPrice`; `upTo: null` is the open last band.
 * Boundary: a type only; `GraduatedPrice.of` checks a list of bands (ascending bounds, one currency, an open last band).
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2: metered usage over an included amount); ADR 0127 (pricing primitives).
 */
import type { Money } from "@stackra/money";

/** One band of a graduated price: `{ upTo: 10_000, unitPrice: Money.zero("USD") }` includes the first 10 000 units. */
export type PriceTier = {
  /** The last unit of this band, counted from the first unit overall; `null` for the open last band. */
  readonly upTo: number | null;
  /** What each unit in this band costs. */
  readonly unitPrice: Money;
};
