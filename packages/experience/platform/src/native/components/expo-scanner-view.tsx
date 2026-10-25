/**
 * Stackra file contract:
 * Purpose: `ExpoScannerView`, the Expo driver's scanner view: expo-camera's rear `CameraView` decoding the requested
 *          symbologies, each code handed to `onBarcode`. `ScannerView` renders it on the Expo target.
 * Boundary: device only. expo-camera keeps firing for the same code while it stays in frame and the view does not
 *           de-duplicate: the page decides when to stop listening. The camera permission is the page's to ask first
 *           (`scanner.requestPermission`).
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 2); ADR 0253.
 */
import { CameraView } from "expo-camera";
import type { ReactNode } from "react";

import type { BarcodeFormat } from "#contracts/types/barcode-format.type";
import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
import { CAMERA_BARCODE_TYPES } from "#native/constants/camera-barcode-types.constant";

/**
 * The camera view that decodes barcodes on a device.
 *
 * @example
 * <ExpoScannerView formats={["ean13", "qr"]} onBarcode={(code) => lookUp(code)} />
 */
export function ExpoScannerView({
  formats,
  onBarcode,
  style,
  className,
}: ScannerViewProps): ReactNode {
  const all = Object.keys(CAMERA_BARCODE_TYPES) as BarcodeFormat[];
  const barcodeTypes = (formats ?? all).map((format) => CAMERA_BARCODE_TYPES[format]);
  return (
    <CameraView
      facing="back"
      barcodeScannerSettings={{ barcodeTypes }}
      onBarcodeScanned={({ data }) => onBarcode(data)}
      style={style as never}
      {...({ className } as object)} // Uniwind's prop; CameraView's own types do not declare it
    />
  );
}
