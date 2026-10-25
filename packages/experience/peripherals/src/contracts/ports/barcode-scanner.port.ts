/**
 * Stackra file contract:
 * Purpose: the `BarcodeScanner` port: the POS kit's handheld scanner (ADR 0253), a keyboard-wedge or HID device that
 *          types each code and an Enter. A listener receives every decoded code until it unsubscribes. Config
 *          `peripherals.scanner` picks the driver (`hid`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.BarcodeScanner`. It is not the camera scanner:
 *           that is `platform.scanner` with its `ScannerView`. A code is the text the scanner sent, with no symbology.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1, 2 and 4); ADR 0250 (decision 3); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * The handheld barcode scanner.
 *
 * @example
 * const stop = scanner.onScan((code) => cart.addByBarcode(code));
 * // later
 * stop();
 */
export abstract class BarcodeScanner extends Port {
  /** Type-only port key, so `DriverName<BarcodeScanner>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.BarcodeScanner";

  /** Whether the scanner can be listened to now; refuses with capability `scanner` otherwise. */
  abstract probe(): Promise<CapabilityResult>;

  /** Calls `listener` with each scanned code; the returned function stops it. */
  abstract onScan(listener: (code: string) => void): () => void;
}
