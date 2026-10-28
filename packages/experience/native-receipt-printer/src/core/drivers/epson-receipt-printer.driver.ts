/**
 * Stackra file contract:
 * Purpose: `EpsonReceiptPrinterDriver`, the `ReceiptPrinter` driver of a Epson network receipt printer in an Expo app
 *          (`peripherals.printer: "epson"`), over `NetworkReceiptPrinterDriver`.
 * Boundary: names the vendor family only; the base delivers and refuses. Certification pending: built from the
 *           vendor's public SDK documents (Epson ePOS SDK).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { NetworkReceiptPrinterDriver } from "#core/drivers/network-receipt-printer.driver";

/**
 * A Epson receipt printer on the network.
 *
 * @example
 * // generated native wiring, a target whose runway lists `device:epson`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { epson: () => import("@stackra/native-receipt-printer").then((m) => m.EpsonReceiptPrinterDriver) } }
 */
export class EpsonReceiptPrinterDriver extends NetworkReceiptPrinterDriver {
  /** The Epson family. */
  protected override readonly vendor = RECEIPT_PRINTER_VENDORS.epson;
}
