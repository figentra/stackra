/**
 * Stackra file contract:
 * Purpose: `RECEIPT_PRINTER_VENDORS`, the Epson, Star, Sunmi and PAX receipt printer families: how each is reached,
 *          its SDK's target spelling and its ready status (Epson ePOS `PrinterStatusInfo.online` 1, Star StarXpand
 *          `StarPrinterStatus.hasError` passed as 0 or 1 so 0 is ready, Sunmi `updatePrinterState()` 1, PAX NeptuneLite
 *          `IPrinter.getStatus()` 0), from the vendors' public SDK documents.
 * Boundary: internal data: a vendor SDK's own table, not a business value. Certification pending: read from public
 *           documents, not yet checked on a certified model (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 4 and 5); ADR 0458 (decision 3); ADR 0459 (decision 3).
 */
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/** The receipt printer vendor families, by driver name. */
export const RECEIPT_PRINTER_VENDORS = Object.freeze({
  epson: { name: "epson", reach: "network", targetPrefix: "TCP:", printerReady: [1] },
  star: { name: "star", reach: "network", targetPrefix: "", printerReady: [0] },
  sunmi: { name: "sunmi", reach: "built-in", targetPrefix: "", printerReady: [1] },
  pax: { name: "pax", reach: "built-in", targetPrefix: "", printerReady: [0] },
} as const satisfies Record<ReceiptPrinterVendor["name"], ReceiptPrinterVendor>);
