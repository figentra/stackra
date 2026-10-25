/**
 * Stackra file contract:
 * Purpose: `ItemPrice`, one item's price on a price list, discriminated by `PriceKind`: a fixed unit amount, graduated
 *          bands, or a formula.
 * Boundary: a type only; catalogue data a replica carries to a till (ADR 0337 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 2); ADR 0242 (decision 2: graduated usage); the MUS-216 answer.
 */
import type { Money } from "@stackra/money";

import type { PriceKind } from "#core/enums/price-kind.enum";
import type { PriceFormula } from "#core/types/price-formula.type";
import type { GraduatedPrice } from "#core/values/graduated-price.value";

/** An item's price on one list. */
export type ItemPrice =
  | {
      /** The catalogue item (a variant or a service). */
      readonly itemId: string;
      readonly kind: typeof PriceKind.Fixed;
      /** The unit price. */
      readonly amount: Money;
    }
  | {
      readonly itemId: string;
      readonly kind: typeof PriceKind.Graduated;
      /** The bands; the quantity is priced as a whole. */
      readonly price: GraduatedPrice;
    }
  | {
      readonly itemId: string;
      readonly kind: typeof PriceKind.Formula;
      /** The unit price formula. */
      readonly formula: PriceFormula;
    };
