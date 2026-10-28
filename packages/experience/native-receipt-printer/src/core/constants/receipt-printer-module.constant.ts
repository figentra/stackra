/**
 * Stackra file contract:
 * Purpose: `RECEIPT_PRINTER_MODULE`, the name the package's Expo module registers (`Name("StackraReceiptPrinter")` in
 *          the Swift and Kotlin), which the drivers look up in the app's modules registry.
 * Boundary: internal data; it must equal the `Name` of `ios/StackraReceiptPrinterModule.swift` and
 *           `android/.../StackraReceiptPrinterModule.kt`.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 2).
 */

/** The Expo module name. */
export const RECEIPT_PRINTER_MODULE = "StackraReceiptPrinter";
