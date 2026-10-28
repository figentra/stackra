/**
 * Stackra file contract:
 * Purpose: `printNativeReceipt`, which prints a receipt on a POS terminal family's built-in printer: it checks the
 *          printer is ready, then hands the lines to the module as text.
 * Boundary: internal; not exported from the entry. Lines are text, never printer commands: control characters are
 *           dropped, so a line cannot reach the drawer or the cutter. Unlike the ESC/POS encoder it keeps every other
 *           Unicode character, because the vendor SDK draws the text itself (Arabic shaping is the SDK font's, and is
 *           part of certification). A failed call refuses with capability `print`.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decision 4); ADR 0458, ADR 0459, ADR 0460; ADR 0253 (decision 4).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { refuse } from "#core/functions/refuse.function";
import { nativeDevice } from "#native/functions/native-device.function";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";

/** Every control character (C0, DEL and C1). */
const CONTROL = /\p{Cc}/gu;

/**
 * Prints `receipt` on the family's printer.
 *
 * @example
 * const printed = await printNativeReceipt(POS_DEVICE_FAMILIES.imin, { orderId, lines });
 */
export async function printNativeReceipt(
  family: PosDeviceFamily,
  receipt: Receipt,
): Promise<CapabilityResult<PrintedReceipt>> {
  const ready = await probeNativePrinter(family);
  if (!ready.ok) return ready;
  try {
    await nativeDevice(family)?.printLines(receipt.lines.map((line) => line.replace(CONTROL, "")));
    return { ok: true, data: { printer: family.name, orderId: receipt.orderId } };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
