/**
 * Stackra file contract:
 * Purpose: `BARCODE_DETECTOR_FORMATS`, each `BarcodeFormat` of the scanner port with the name the browser's Shape
 *          Detection API (`BarcodeDetector`) gives it.
 * Boundary: internal data of the web scanner view; not exported from the entry.
 * Runtime: browser
 * Governing contract: ADR 0250 (decision 2: one driver per target).
 */
import type { BarcodeFormat } from "#contracts/types/barcode-format.type";

/** Port format to `BarcodeDetector` format. */
export const BARCODE_DETECTOR_FORMATS: Readonly<Record<BarcodeFormat, string>> = Object.freeze({
  ean13: "ean_13",
  ean8: "ean_8",
  upc_a: "upc_a",
  upc_e: "upc_e",
  code128: "code_128",
  code39: "code_39",
  itf: "itf",
  qr: "qr_code",
  pdf417: "pdf417",
  data_matrix: "data_matrix",
  aztec: "aztec",
});
