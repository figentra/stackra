/**
 * Stackra file contract:
 * Purpose: `memberPath`, the `ServiceClient` member path of a call key: its model and verb, camelCased
 *          (`catalogue.variant.get_by_barcode@1` gives `variant.getByBarcode`), as gen names `readonly variant = {
 *          getByBarcode: this.member(...) }`.
 * Boundary: internal to the client fake; not exported from an entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0260 (decisions 3 and 10).
 */

/**
 * The member path of `key`.
 *
 * @example
 * memberPath("payments.payment.void@1"); // "payment.void"
 */
export function memberPath(key: string): string {
  return key
    .replace(/@\d+$/, "")
    .split(".")
    .slice(-2)
    .map((segment) => segment.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase()))
    .join(".");
}
