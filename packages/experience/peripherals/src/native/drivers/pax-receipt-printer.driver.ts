/**
 * Stackra file contract:
 * Purpose: `PaxReceiptPrinterDriver`, the `ReceiptPrinter` driver of the native Android till on PAX Android terminals with a printer (A920 class)
 *          (`peripherals.printer: "pax"`): it prints through the app's `StackraPax` Expo module and kicks the
 *          drawer wired to the built-in printer.
 * Boundary: delivers only, through the shared `./native` functions; it refuses with capability `print` where the
 *           module is absent or the printer is not ready. The vendor's drawer call takes no pin, so `kickDrawer`
 *           ignores it. Certification pending: built from the vendor's public SDK documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0459 (PAX SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { openNativeDrawer } from "#native/functions/open-native-drawer.function";
import { printNativeReceipt } from "#native/functions/print-native-receipt.function";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";

/**
 * The PAX terminal's built-in receipt printer.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { pax: () => import("@stackra/peripherals/native").then((m) => m.PaxReceiptPrinterDriver) } }
 */
export class PaxReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** Answers while the printer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeNativePrinter(POS_DEVICE_FAMILIES.pax);
  }

  /** Prints the receipt as text and cuts where the model has a cutter. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    return printNativeReceipt(POS_DEVICE_FAMILIES.pax, receipt);
  }

  /** Pulses the drawer wired to the terminal; the SDK has one drawer port, so `pin` is not used. */
  async kickDrawer(_pin: DrawerPin): Promise<CapabilityResult> {
    return openNativeDrawer(POS_DEVICE_FAMILIES.pax);
  }
}
