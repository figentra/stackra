/**
 * Stackra file contract:
 * Purpose: `LabelScaleItem`, one item sent to a label scale: the item code the scale keys and prints in its embedded
 *          barcode, the name on the label, the price per kilogram or per piece, the tare and when the price applies.
 * Boundary: a type only; plain data that crosses a vendor protocol. `price` is a decimal string in `currency`, so no
 *           digit is lost; the product formats nothing here. The values are the product's catalogue and price data.
 * Runtime: isomorphic
 * Governing contract: ADR 0253; STA-965.
 */

/** An item on a label scale. */
export interface LabelScaleItem {
  /** The item code (PLU) the scale keys and prints in its barcode (`"12345"`). */
  readonly itemCode: string;

  /** The name printed on the label. */
  readonly name: string;

  /** The price as a decimal string in `currency` (`"42.00"`): per kilogram when `byWeight`, otherwise per piece. */
  readonly price: string;

  /** ISO 4217 code of `price`. */
  readonly currency: string;

  /** True when the scale weighs the item and prices it per kilogram. */
  readonly byWeight: boolean;

  /** The container weight the scale takes off, in grams. */
  readonly tareGrams: number;

  /** When the price applies (ISO 8601 instant), or null for now. */
  readonly effectiveAt: string | null;
}
