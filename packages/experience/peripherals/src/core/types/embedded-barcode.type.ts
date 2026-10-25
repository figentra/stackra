/**
 * Stackra file contract:
 * Purpose: `EmbeddedBarcode`, an in-store barcode read through its layout: the item code to look up, and the weight or
 *          price it carries as an exact decimal in its unit.
 * Boundary: a type only. `value` is a decimal string, so `Money.of(value, unit)` or a weight conversion keeps every
 *           digit.
 * Runtime: isomorphic
 * Governing contract: the COM-241 answer; ADR 0339.
 */
import type { EmbeddedValue } from "#core/enums/embedded-value.enum";

/** A parsed in-store barcode. */
export interface EmbeddedBarcode {
  /** The scanned code, as read. */
  readonly code: string;

  /** The layout prefix that matched. */
  readonly prefix: string;

  /** The item code the till looks the product up by. */
  readonly itemCode: string;

  /** Weight or price. */
  readonly kind: EmbeddedValue;

  /** The value as a decimal string in `unit` (`"1.250"`). */
  readonly value: string;

  /** `kg` or a currency code, from the layout. */
  readonly unit: string;
}
