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
  ean13: "ean13",
  ean8: "ean8",
  upc_a: "upc_a",
  upc_e: "upc_e",
  code128: "code128",
  code39: "code39",
  itf: "itf14",
  qr: "qr",
  pdf417: "pdf417",
  data_matrix: "datamatrix",
  aztec: "aztec",
} as const satisfies Readonly<Record<BarcodeFormat, string>>;
