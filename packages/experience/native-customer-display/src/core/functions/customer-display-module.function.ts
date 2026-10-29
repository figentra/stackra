/**
 * Stackra file contract:
 * Purpose: `customerDisplayModule`, the module binding: it reads the `StackraCustomerDisplay` Expo module from the
 *          app's modules registry at call time, so the driver loads with no native package and refuses where it is
 *          absent.
 * Boundary: internal; not exported from the entry. It only looks the module up: it calls nothing on it. The name must
 *           equal the `Name("StackraCustomerDisplay")` of `ios/` and `android/`.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0430 (decision 1: the registry lookup).
 */
import type { CustomerDisplayNativeModule } from "#core/types/customer-display-native-module.type";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The module, or `undefined` in a build that does not link it (web, desktop, a test without the stand-in).
 *
 * @example
 * const module = customerDisplayModule();
 * if (module === undefined) return REFUSED;
 */
export function customerDisplayModule(): CustomerDisplayNativeModule | undefined {
  return (globalThis as ExpoGlobal).expo?.modules?.["StackraCustomerDisplay"] as
    | CustomerDisplayNativeModule
    | undefined;
}
