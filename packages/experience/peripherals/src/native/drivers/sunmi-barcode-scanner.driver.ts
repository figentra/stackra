/**
 * Stackra file contract:
 * Purpose: `SunmiBarcodeScannerDriver`, the `BarcodeScanner` driver of the native Android till on Sunmi Android terminals (T2, V2 class)
 *          (`peripherals.scanner: "sunmi"`): it hands each code the built-in scanner decodes, as the app's
 *          `StackraSunmi` Expo module reports it, to the listeners.
 * Boundary: listens only; the probe refuses with capability `scanner` where the module is absent, and a subscription
 *           there does nothing. Codes are never stored. Certification pending: built from the vendor's public SDK
 *           documents (ADR 0458).
 * Runtime: isomorphic
 * Governing contract: ADR 0458 (Sunmi SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
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
 * The Sunmi terminal's built-in scanner.
 *
 * @example
 * // generated native wiring, android target with `device:sunmi`
 * { port: BarcodeScanner, selectedBy: "config:peripherals.scanner", candidates: { sunmi: () => import("@stackra/peripherals/native").then((m) => m.SunmiBarcodeScannerDriver) } }
 */
export class SunmiBarcodeScannerDriver extends Driver(BarcodeScanner) {
  /** Answers while the app links the module. */
  async probe(): Promise<CapabilityResult> {
    if (nativeDevice(POS_DEVICE_FAMILIES.sunmi) === undefined)
      return refuse(Capability.Scanner, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Calls `listener` with each decoded code; the returned function stops it. */
  onScan(listener: (code: string) => void): () => void {
    return listenNativeScanner(POS_DEVICE_FAMILIES.sunmi, listener);
  }
}
