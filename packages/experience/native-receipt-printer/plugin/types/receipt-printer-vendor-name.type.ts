/**
 * Stackra file contract:
 * Purpose: `ReceiptPrinterVendorName`, a receipt printer vendor family the config plugin can link, as the runway's
 *          `device:<family>` names it.
 * Boundary: a type only; it equals the driver names of `RECEIPT_PRINTER_VENDORS` in `src/`.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3).
 */

/** A receipt printer vendor family. */
export type ReceiptPrinterVendorName = "epson" | "star" | "sunmi" | "pax";
