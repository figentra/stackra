/**
 * Stackra file contract:
 * Purpose: `BarcodeFormat`, the scanner port's own names for the symbologies a `ScannerView` looks for; each driver
 *          maps them to its engine's names (the browser's `BarcodeDetector`, expo-camera).
 * Boundary: a type only; the port's vocabulary, so a page never spells an engine's format name.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0253 (peripherals: scanners).
 */

/** A barcode symbology. */
export type BarcodeFormat =
  | "ean13"
  | "ean8"
  | "upc_a"
  | "upc_e"
  | "code128"
  | "code39"
  | "itf"
  | "qr"
  | "pdf417"
  | "data_matrix"
  | "aztec";
