/**
 * Stackra file contract:
 * Purpose: `nativeDevice`, which reads a POS terminal family's Expo module from the app's modules registry at call
 *          time, so the `./native` drivers load with no native package and refuse where the module is absent.
 * Boundary: internal; not exported from the entry. It only looks the module up: it calls nothing on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decisions 3 and 4); ADR 0430 (decision 1: the registry lookup of the `external`
 *                     customer display).
 */
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";
import type { PosDeviceNativeModule } from "#native/types/pos-device-native-module.type";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The family's module, or `undefined` in a build that does not link it (web, desktop, another family).
 *
 * @example
 * const module = nativeDevice(POS_DEVICE_FAMILIES.sunmi);
 * if (module === undefined) return refuse(PlatformCapability.Print, "unavailable");
 */
export function nativeDevice(family: PosDeviceFamily): PosDeviceNativeModule | undefined {
  return (globalThis as ExpoGlobal).expo?.modules?.[family.module] as
    | PosDeviceNativeModule
    | undefined;
}
