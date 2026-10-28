/**
 * Stackra file contract:
 * Purpose: `RECEIPT_PRINTER_PLUGIN`, the build-time table of the config plugin: which vendor families each platform
 *          can link, the Gradle and Podfile property keys the module's `android/build.gradle` and `ios/*.podspec` read,
 *          and the Sunmi printer service package Android 11+ must be allowed to see.
 * Boundary: internal data; the keys must equal what `android/build.gradle` and `ios/StackraReceiptPrinter.podspec`
 *           read. Star and Epson have iOS SDKs; Sunmi and PAX are Android terminals.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 4); ADR 0458 (decision 2); ADR 0442 (decision 3).
 */

/** The plugin's platform table and property keys. */
export const RECEIPT_PRINTER_PLUGIN = Object.freeze({
  platforms: Object.freeze({
    android: Object.freeze(["epson", "star", "sunmi", "pax"] as const),
    ios: Object.freeze(["epson", "star"] as const),
  }),
  property: Object.freeze({
    vendors: "stackra.receiptPrinter.vendors",
    artifact: (vendor: string): string => `stackra.receiptPrinter.${vendor}Artifact`,
    epsonFramework: "stackra.receiptPrinter.epsonFramework",
    starVersion: "stackra.receiptPrinter.starVersion",
  }),
  sunmiPrinterService: "woyou.aidlservice.jiuiv5",
});
