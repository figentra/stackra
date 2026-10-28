/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./plugin` entry of @stackra/native-receipt-printer, whose default export is the config
 *          plugin `app.plugin.js` hands Expo, plus its option types.
 * Boundary: names each re-export and declares nothing. Build time only: nothing here runs in the app.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0294 (decision 15).
 */
export { withReceiptPrinter as default } from "#plugin/functions/with-receipt-printer.function";
export type { ReceiptPrinterPluginProps } from "#plugin/types/receipt-printer-plugin-props.type";
export type { ReceiptPrinterVendorName } from "#plugin/types/receipt-printer-vendor-name.type";
export type { VendorArtifact } from "#plugin/types/vendor-artifact.type";
