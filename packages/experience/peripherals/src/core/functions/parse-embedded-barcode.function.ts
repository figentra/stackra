/**
 * Stackra file contract:
 * Purpose: `parseEmbeddedBarcode`, an in-store barcode a scale or a pricing gun printed (a GS1 restricted circulation
 *          number, prefix 2x) read through the market pack's layouts: the item code and the weight or price it
 *          carries, after the code's check digit is verified.
 * Boundary: pure; the layouts are market-pack data passed in. A code that matches no layout, has the wrong length or a
 *           wrong check digit answers `null` (an ordinary barcode, or a misread to scan again); a layout whose digits do
 *           not add up to its length is a `RangeError`. The value check digit, where a layout has one, is skipped, not
 *           verified.
 * Runtime: isomorphic
 * Governing contract: the COM-241 answer (scales and weight barcodes; prefixes in `market-pack:*`); ADR 0339 (decision
 *                     7); STA-965 (the implied decimal shared with `parseGs1ElementString`).
 */
import { gs1CheckDigit } from "#core/functions/gs1-check-digit.function";
import { impliedDecimal } from "#core/functions/implied-decimal.function";
import type { EmbeddedBarcode } from "#core/types/embedded-barcode.type";
import type { EmbeddedBarcodeLayout } from "#core/types/embedded-barcode-layout.type";

/**
 * The item and value `code` carries, or null when no layout reads it.
 *
 * @example
 * parseEmbeddedBarcode("2112345012506", pack.barcodeLayouts);
 * // { code, prefix: "21", itemCode: "12345", kind: "weight", value: "1.250", unit: "kg" }
 * @throws RangeError when a matching layout's digits do not add up to its length.
 */
export function parseEmbeddedBarcode(
  code: string,
  layouts: readonly EmbeddedBarcodeLayout[],
): EmbeddedBarcode | null {
  if (!/^\d+$/.test(code)) return null;
  const layout = layouts
    .filter((candidate) => candidate.length === code.length && code.startsWith(candidate.prefix))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (layout === undefined) return null;
  const check = layout.valueCheckDigit ? 1 : 0;
  if (layout.prefix.length + layout.itemDigits + check + layout.valueDigits + 1 !== layout.length)
    throw new RangeError(
      `parseEmbeddedBarcode: the layout for prefix ${layout.prefix} does not add up to ${layout.length} digits`,
    );
  if (gs1CheckDigit(code.slice(0, -1)) !== Number(code.slice(-1))) return null;
  const itemStart = layout.prefix.length;
  const valueStart = itemStart + layout.itemDigits + check;
  const digits = code.slice(valueStart, valueStart + layout.valueDigits);
  return {
    code,
    prefix: layout.prefix,
    itemCode: code.slice(itemStart, itemStart + layout.itemDigits),
    kind: layout.kind,
    value: impliedDecimal(digits, layout.valueDecimals),
    unit: layout.unit,
  };
}
