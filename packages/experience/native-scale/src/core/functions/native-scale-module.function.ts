/**
 * Stackra file contract:
 * Purpose: `nativeScaleModule`, which reads the `StackraNativeScale` Expo module from the app's modules registry at
 *          call time, so the drivers load with no native package and refuse where the module is absent (web,
 *          desktop, an app built without this package).
 * Boundary: internal; not exported from the entry. It only looks the module up: it calls nothing on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0442 (decision 4: the registry lookup).
 */
import type { NativeScaleModule } from "#core/types/native-scale-module.type";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The module, or `undefined` in a build that does not link it.
 *
 * @example
 * const module = nativeScaleModule();
 * if (module === undefined) return refuse("unavailable");
 */
export function nativeScaleModule(): NativeScaleModule | undefined {
  return (globalThis as ExpoGlobal).expo?.modules?.["StackraNativeScale"] as
    | NativeScaleModule
    | undefined;
}
