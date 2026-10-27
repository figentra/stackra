/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/peripherals: the Sunmi, PAX and iMin drivers of the
 *          native Android till (ADR 0442 decision 4) behind `ReceiptPrinter`, `CashDrawer` and `BarcodeScanner`, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package;
 *           each driver reads its family's Expo module from the modules registry when it runs. The families, the
 *           module type and the shared functions stay internal. Certification pending (ADR 0458, 0459, 0460).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0442 (decision 4); ADR 0458; ADR 0459; ADR 0460; the STA-347
 *                     stand-in barrel decision.
 */
export { IminBarcodeScannerDriver } from "#native/drivers/imin-barcode-scanner.driver";
export { IminCashDrawerDriver } from "#native/drivers/imin-cash-drawer.driver";
export { IminReceiptPrinterDriver } from "#native/drivers/imin-receipt-printer.driver";
export { PaxBarcodeScannerDriver } from "#native/drivers/pax-barcode-scanner.driver";
export { PaxCashDrawerDriver } from "#native/drivers/pax-cash-drawer.driver";
export { PaxReceiptPrinterDriver } from "#native/drivers/pax-receipt-printer.driver";
export { SunmiBarcodeScannerDriver } from "#native/drivers/sunmi-barcode-scanner.driver";
export { SunmiCashDrawerDriver } from "#native/drivers/sunmi-cash-drawer.driver";
export { SunmiReceiptPrinterDriver } from "#native/drivers/sunmi-receipt-printer.driver";
