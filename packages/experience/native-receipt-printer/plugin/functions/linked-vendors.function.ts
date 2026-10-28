/**
 * Stackra file contract:
 * Purpose: `linkedVendors`, the vendor families a platform's build links: the plugin's `vendors` that the platform
 *          has an SDK for, each once, in the platform table's order.
 * Boundary: internal. An unknown family name is a programming error in the app's config and throws at prebuild, so a
 *           typo never builds a till without its printer.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3).
 */
import { RECEIPT_PRINTER_PLUGIN } from "#plugin/constants/receipt-printer-plugin.constant";
import type { ReceiptPrinterPluginProps } from "#plugin/types/receipt-printer-plugin-props.type";
import type { ReceiptPrinterVendorName } from "#plugin/types/receipt-printer-vendor-name.type";

/**
 * The families `platform` links for `props`.
 *
 * @example
 * linkedVendors({ vendors: ["sunmi", "epson"] }, "ios"); // ["epson"]
 */
export function linkedVendors(
  props: ReceiptPrinterPluginProps,
  platform: "android" | "ios",
): ReceiptPrinterVendorName[] {
  const asked = props.vendors ?? [];
  const known: readonly string[] = RECEIPT_PRINTER_PLUGIN.platforms.android;
  for (const vendor of asked) {
    if (!known.includes(vendor))
      throw new Error(`@stackra/native-receipt-printer: unknown vendor "${String(vendor)}"`);
  }
  const table: readonly ReceiptPrinterVendorName[] = RECEIPT_PRINTER_PLUGIN.platforms[platform];
  return table.filter((vendor) => asked.includes(vendor));
}
