/**
 * Stackra file contract:
 * Purpose: `xmlAttribute`, one attribute's decoded value from an XML start tag's attribute text, by local name
 *          (`id` finds `r:id`; `sheetId` is a different name).
 * Boundary: pure; internal to the XLSX reader.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2).
 */
import { xmlText } from "#node/functions/xml-text.function";

/**
 * The value of attribute `name` in `attributes`, or `undefined`.
 *
 * @example
 * xmlAttribute(' name="Orders" r:id="rId1"', "id"); // "rId1"
 */
export function xmlAttribute(attributes: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)(?:[\\w-]+:)?${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(
    attributes,
  );
  return match === null ? undefined : xmlText(match[1] ?? match[2] ?? "");
}
