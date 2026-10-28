/**
 * Stackra file contract:
 * Purpose: `StarReceiptPrinterDriver`, the `ReceiptPrinter` driver of a Star network receipt printer in an Expo app
 *          (`peripherals.printer: "star"`), over `NetworkReceiptPrinterDriver`.
 * Boundary: names the vendor family only; the base delivers and refuses. Certification pending: built from the
 *           vendor's public SDK documents (Star StarXpand SDK).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { NetworkReceiptPrinterDriver } from "#core/drivers/network-receipt-printer.driver";

/**
 * A Star receipt printer on the network.
 *
 * @example
 * // generated native wiring, a target whose runway lists `device:star`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { star: () => import("@stackra/native-receipt-printer").then((m) => m.StarReceiptPrinterDriver) } }
 */
export class StarReceiptPrinterDriver extends NetworkReceiptPrinterDriver {
  /** The Star family. */
  protected override readonly vendor = RECEIPT_PRINTER_VENDORS.star;
}
