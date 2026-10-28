/**
 * Stackra file contract:
 * Purpose: `SunmiReceiptPrinterDriver`, the `ReceiptPrinter` driver of the built-in printer of
 *          Sunmi Android terminals (T2, V2 class) (`peripherals.printer: "sunmi"`), over `BuiltInReceiptPrinterDriver`. Moved here
 *          from `@stackra/peripherals/native` (ADR 0478 decision 5).
 * Boundary: names the vendor family only; the base delivers and refuses. Certification pending: built from the
 *           vendor's public SDK documents (ADR 0458).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decisions 3 to 5); ADR 0253 (decision 4); ADR 0250
 *                     (decision 3).
 */
import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { BuiltInReceiptPrinterDriver } from "#core/drivers/built-in-receipt-printer.driver";

/**
 * The Sunmi terminal's built-in receipt printer.
 *
 * @example
 * // generated native wiring, android target with `device:sunmi`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { sunmi: () => import("@stackra/native-receipt-printer").then((m) => m.SunmiReceiptPrinterDriver) } }
 */
export class SunmiReceiptPrinterDriver extends BuiltInReceiptPrinterDriver {
  /** The Sunmi family. */
  protected override readonly vendor = RECEIPT_PRINTER_VENDORS.sunmi;
}
