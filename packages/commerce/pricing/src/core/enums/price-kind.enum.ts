/**
 * Stackra file contract:
 * Purpose: `PriceKind`, how a price list states an item's price: a fixed unit price, graduated bands, or a formula over
 *          a rate and the item's own fields (the gold-rate price of jewellery).
 * Boundary: an `Enum.of` value plus the type of the same name; the discriminant of `ItemPrice`. A data kind of a price
 *           entry, not a programming-model kind: no decorator, no registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 2: price lists); ADR 0294 (decision 16: enums); ADR 0231 (snake_case codes);
 *                     the MUS-216 answer (price from formula).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of an item's price. */
export const PriceKind = Enum.of({
  /** One unit price, times the quantity. */
  Fixed: "fixed",
  /** Per-unit bands over the quantity (`GraduatedPrice`). */
  Graduated: "graduated",
  /** A unit price computed from rates and the item's fields (`PriceFormula`). */
  Formula: "formula",
});

/** One of the codes above. */
export type PriceKind = Enum.Value<typeof PriceKind>;
