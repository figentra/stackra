/**
 * Stackra file contract:
 * Purpose: `EmbeddedValue`, what the value digits of an in-store barcode (a GS1 restricted circulation number, prefix
 *          2x) carry: the weight a scale printed, or the price.
 * Boundary: an `Enum.of` value plus the type of the same name; the `kind` of a market pack's barcode layout row.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 7: presets name the kit); the COM-241 answer (barcode prefixes in the market
 *                     pack); ADR 0294 (decision 16); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The value an in-store barcode carries. */
export const EmbeddedValue = Enum.of({
  /** A net weight, in the layout's unit. */
  Weight: "weight",
  /** A price, in the layout's currency. */
  Price: "price",
});

/** One of the codes above. */
export type EmbeddedValue = Enum.Value<typeof EmbeddedValue>;
