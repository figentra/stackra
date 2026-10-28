/**
 * Stackra file contract:
 * Purpose: `probeNativePrinter`, which asks a POS terminal family's built-in printer for its status and answers ready
 *          only on one of the family's `printerReady` codes; the drawer, wired to the same printer, shares it.
 * Boundary: internal; not exported from the entry. Every other outcome (no module, another status, a rejected call)
 *           refuses with capability `print`, never a thrown error at the till. The status number is not put in the
 *           refusal: the two refusal codes are the whole set (ADR 0250 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decision 4); ADR 0458, ADR 0459, ADR 0460; ADR 0250 (decision 3).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { refuse } from "#core/functions/refuse.function";
import { nativeDevice } from "#native/functions/native-device.function";
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";

/**
 * Whether the family's built-in printer is ready now.
 *
 * @example
 * const ready = await probeNativePrinter(POS_DEVICE_FAMILIES.pax);
 */
export async function probeNativePrinter(family: PosDeviceFamily): Promise<CapabilityResult> {
  const module = nativeDevice(family);
  if (module === undefined) return refuse(PlatformCapability.Print, "unavailable");
  try {
    const status = await module.printerStatus();
    if (!family.printerReady.includes(status)) return refuse(PlatformCapability.Print, "unavailable");
    return { ok: true, data: undefined };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
