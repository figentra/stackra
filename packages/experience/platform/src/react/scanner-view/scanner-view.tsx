/**
 * Stackra file contract:
 * Purpose: `ScannerView`, the scanner port's camera view: it renders the view component of the running platform's
 *          scanner (the browser's `BarcodeDetector` on the web, the native camera on a device, nothing in the memory
 *          driver), so a page scans without importing a camera module.
 * Boundary: renders only; the page decides what a decoded code means and when to stop listening. Check
 *           `scanner.isAvailable` and `scanner.permission` (from `useCapability("scanner", ...)`) before rendering it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0253.
 */
import type { ReactNode } from "react";

import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
import { usePlatform } from "#react/platform/use-platform";

/**
 * The camera view that decodes barcodes.
 *
 * @example
 * <ScannerView style={{ flex: 1 }} formats={["ean13", "qr"]} onBarcode={onBarcode} />
 */
export function ScannerView(props: ScannerViewProps): ReactNode {
  const { View } = usePlatform().scanner;
  return <View {...props} />;
}
