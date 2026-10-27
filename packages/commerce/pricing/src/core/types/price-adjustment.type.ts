/**
 * Stackra file contract:
 * Purpose: `PriceAdjustment`, a price list derived from a base list: each base price times a factor, then onto a price
 *          point (a purchasing-power list, a delivery app's markup on the channel's list).
 * Boundary: a type only; the factor and the point are tenant data (the restaurant's channel markup rule is data, not
 *           code). A graduated base price is scaled as a total and takes no point.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decisions 2 and 6); the RES-169 answer (channel markup).
import type { Rounding } from "@stackra/contracts";
 */

import type { PricePoint } from "#core/values/price-point.value";

/** How a derived list follows its base. */
export interface PriceAdjustment {
  /** The list the prices come from, in the same currency. */
  readonly baseListId: string;

  /** The multiplier, as a decimal string (`"1.15"` for 15% more). */
  readonly factor: string;

  /** How the multiplied price rounds to minor units. */
  readonly rounding: Rounding;

  /** The point a unit price moves onto afterwards (`Up`), or null for none. */
  readonly pricePoint: PricePoint | null;
}
