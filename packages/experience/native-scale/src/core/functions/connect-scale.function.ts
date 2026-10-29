/**
 * Stackra file contract:
 * Purpose: `connectScale`, which makes sure the module has the configured scale's link open: it answers the module
 *          when the link is open or opens now, or the refusal: `unavailable` without the module or an address, or
 *          when the scale does not answer, and `permission_denied` when `DevicePermissions` denies or blocks Bluetooth
 *          or the module rejects with `E_PERMISSION`.
 * Boundary: internal; not exported from the entry. It reads `NativeScaleConfig` and opens nothing else; it never
 *           throws for a device failure. Before opening a `ble` or `spp` link it asks @stackra/platform's
 *           `DevicePermissions` for Bluetooth (the module never asks); a `usb` link asks nothing here.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0250 (decision 3).
 */
import type { CapabilityResult, DevicePermissions } from "@stackra/platform/contracts";

import type { NativeScaleConfig } from "#config/native-scale.config";
import { ScaleTransport } from "#core/enums/scale-transport.enum";
import { nativeScaleModule } from "#core/functions/native-scale-module.function";
import { refuse } from "#core/functions/refuse.function";
import type { NativeScaleModule } from "#core/types/native-scale-module.type";

/**
 * The module with its link open, or the refusal.
 *
 * @example
 * const linked = await connectScale(this.config, this.permissions);
 * if (!linked.ok) return linked;
 */
export async function connectScale(
  config: Pick<
    NativeScaleConfig,
    "transport" | "address" | "baudRate" | "bleService" | "bleNotify" | "bleWrite"
  >,
  permissions: DevicePermissions,
): Promise<CapabilityResult<NativeScaleModule>> {
  const module = nativeScaleModule();
  if (module === undefined || config.address === "") return refuse("unavailable");
  try {
    if (!(await module.isConnected())) {
      if (
        config.transport !== ScaleTransport.Usb &&
        (await permissions.request("bluetooth")) !== "granted"
      )
        return refuse("permission_denied");
      await module.connect({
        transport: config.transport,
        address: config.address,
        baudRate: config.baudRate,
        bleService: config.bleService,
        bleNotify: config.bleNotify,
        bleWrite: config.bleWrite,
      });
    }
    return { ok: true, data: module };
  } catch (error) {
    const code = (error as { readonly code?: unknown } | null)?.code;
    return refuse(code === "E_PERMISSION" ? "permission_denied" : "unavailable");
  }
}
