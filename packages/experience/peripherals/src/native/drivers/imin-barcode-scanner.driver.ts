/**
 * Stackra file contract:
 * Purpose: `IminBarcodeScannerDriver`, the `BarcodeScanner` driver of the native Android till on iMin Android terminals (Swan, D4 class)
 *          (`peripherals.scanner: "imin"`): it hands each code the built-in scanner decodes, as the app's
 *          `StackraImin` Expo module reports it, to the listeners.
 * Boundary: listens only; the probe refuses with capability `scanner` where the module is absent, and a subscription
 *           there does nothing. Codes are never stored. Certification pending: built from the vendor's public SDK
 *           documents (ADR 0460).
 * Runtime: isomorphic
 * Governing contract: ADR 0460 (iMin SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import { refuse } from "#core/functions/refuse.function";
import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { listenNativeScanner } from "#native/functions/listen-native-scanner.function";
import { nativeDevice } from "#native/functions/native-device.function";

/**
 * The iMin terminal's built-in scanner.
 *
 * @example
 * // generated native wiring, android target with `device:imin`
 * { port: BarcodeScanner, selectedBy: "config:peripherals.scanner", candidates: { imin: () => import("@stackra/peripherals/native").then((m) => m.IminBarcodeScannerDriver) } }
 */
export class IminBarcodeScannerDriver extends Driver(BarcodeScanner) {
  /** Answers while the app links the module. */
  async probe(): Promise<CapabilityResult> {
    if (nativeDevice(POS_DEVICE_FAMILIES.imin) === undefined)
      return refuse(Capability.Scanner, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Calls `listener` with each decoded code; the returned function stops it. */
  onScan(listener: (code: string) => void): () => void {
    return listenNativeScanner(POS_DEVICE_FAMILIES.imin, listener);
  }
}
