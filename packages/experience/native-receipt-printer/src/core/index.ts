/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-receipt-printer: the Epson, Star, Sunmi and PAX drivers
 *          behind `ReceiptPrinter` (ADR 0478 decision 5) and `kickThroughPrinter`, the drawer kick
 *          @stackra/native-cash-drawer uses, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package; the
 *           drivers read the `StackraReceiptPrinter` module from the modules registry when they run. The vendor table,
 *           the module type and the shared functions stay internal. Certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0478 (decisions 2 and 5); the STA-347 stand-in barrel decision.
 */
export { EpsonReceiptPrinterDriver } from "#core/drivers/epson-receipt-printer.driver";
export { kickThroughPrinter } from "#core/functions/kick-through-printer.function";
export { PaxReceiptPrinterDriver } from "#core/drivers/pax-receipt-printer.driver";
export { StarReceiptPrinterDriver } from "#core/drivers/star-receipt-printer.driver";
export { SunmiReceiptPrinterDriver } from "#core/drivers/sunmi-receipt-printer.driver";
