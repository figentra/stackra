/**
 * Stackra file contract:
 * Purpose: `CAMERA_BARCODE_TYPES`, the map from the scanner port's `BarcodeFormat` names to the symbology names
 *          expo-camera's `barcodeScannerSettings.barcodeTypes` takes.
 * Boundary: internal to `./native`; data only. Complete over `BarcodeFormat`, so a new format fails the type check
 *           here until its engine name is added.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 2); ADR 0253 (peripherals: scanners).
 */
import type { BarcodeFormat } from "#contracts/types/barcode-format.type";

/** The expo-camera name of each port format. */
export const CAMERA_BARCODE_TYPES = {
  /** EAN-13. */
  ean13: "ean13",
  /** EAN-8. */
  ean8: "ean8",
  /** UPC-A. */
  upc_a: "upc_a",
  /** UPC-E. */
  upc_e: "upc_e",
  /** Code 128. */
  code128: "code128",
  /** Code 39. */
  code39: "code39",
  /** ITF-14 (interleaved 2 of 5). */
  itf: "itf14",
  /** QR code. */
  qr: "qr",
  /** PDF417. */
  pdf417: "pdf417",
  /** Data Matrix. */
  data_matrix: "datamatrix",
  /** Aztec. */
  aztec: "aztec",
} as const satisfies Readonly<Record<BarcodeFormat, string>>;
