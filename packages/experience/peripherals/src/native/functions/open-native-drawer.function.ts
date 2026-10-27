/**
 * Stackra file contract:
 * Purpose: `openNativeDrawer`, which pulses the cash drawer wired to a POS terminal family's drawer port, after
 *          checking the printer that drives it is ready.
 * Boundary: internal; not exported from the entry. A kick is one-way: success means the SDK took the pulse, not that
 *           the drawer opened. A failed call refuses with capability `print`, as every drawer here does.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decision 4); ADR 0458, ADR 0459, ADR 0460; ADR 0253 (decision 4).
 */
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { refuse } from "#core/functions/refuse.function";
import { nativeDevice } from "#native/functions/native-device.function";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";

/**
 * Opens the family's drawer.
 *
 * @example
 * const opened = await openNativeDrawer(POS_DEVICE_FAMILIES.sunmi);
 */
export async function openNativeDrawer(family: PosDeviceFamily): Promise<CapabilityResult> {
  const ready = await probeNativePrinter(family);
  if (!ready.ok) return ready;
  try {
    await nativeDevice(family)?.openDrawer();
    return { ok: true, data: undefined };
  } catch {
    return refuse(Capability.Print, "unavailable");
  }
}
