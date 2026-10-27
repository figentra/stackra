/**
 * Stackra file contract:
 * Purpose: `PaxBarcodeScannerDriver`, the `BarcodeScanner` driver of the native Android till on PAX Android terminals with a printer (A920 class)
 *          (`peripherals.scanner: "pax"`): it hands each code the built-in scanner decodes, as the app's
 *          `StackraPax` Expo module reports it, to the listeners.
 * Boundary: listens only; the probe refuses with capability `scanner` where the module is absent, and a subscription
 *           there does nothing. Codes are never stored. Certification pending: built from the vendor's public SDK
 *           documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0459 (PAX SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
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
 * The PAX terminal's built-in scanner.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: BarcodeScanner, selectedBy: "config:peripherals.scanner", candidates: { pax: () => import("@stackra/peripherals/native").then((m) => m.PaxBarcodeScannerDriver) } }
 */
export class PaxBarcodeScannerDriver extends Driver(BarcodeScanner) {
  /** Answers while the app links the module. */
  async probe(): Promise<CapabilityResult> {
    if (nativeDevice(POS_DEVICE_FAMILIES.pax) === undefined)
      return refuse(Capability.Scanner, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Calls `listener` with each decoded code; the returned function stops it. */
  onScan(listener: (code: string) => void): () => void {
    return listenNativeScanner(POS_DEVICE_FAMILIES.pax, listener);
  }
}
