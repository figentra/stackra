/**
 * Stackra file contract:
 * Purpose: `PaxReceiptPrinterDriver`, the `ReceiptPrinter` driver of the built-in printer of
 *          PAX Android terminals (A920 class) (`peripherals.printer: "pax"`), over `BuiltInReceiptPrinterDriver`. Moved here
 *          from `@stackra/peripherals/native` (ADR 0478 decision 5).
 * Boundary: names the vendor family only; the base delivers and refuses. Certification pending: built from the
 *           vendor's public SDK documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0459 (decisions 3 to 5); ADR 0253 (decision 4); ADR 0250
 *                     (decision 3).
 */
import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { BuiltInReceiptPrinterDriver } from "#core/drivers/built-in-receipt-printer.driver";

/**
 * The PAX terminal's built-in receipt printer.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { pax: () => import("@stackra/native-receipt-printer").then((m) => m.PaxReceiptPrinterDriver) } }
 */
export class PaxReceiptPrinterDriver extends BuiltInReceiptPrinterDriver {
  /** The PAX family. */
  protected override readonly vendor = RECEIPT_PRINTER_VENDORS.pax;
}
