/**
 * Stackra file contract:
 * Purpose: `cardTerminalModule`, which reads the `StackraCardTerminal` Expo module from the app's modules registry at
 *          call time, so the drivers load with no native package and refuse where the module is not linked.
 * Boundary: internal; not exported from the entry. It only looks the module up: it calls nothing on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0442 (decision 4: the registry lookup of the till drivers).
 */
import type { CardTerminalNativeModule } from "#contracts/types/card-terminal-native-module.type";
import { STRIPE_TERMINAL } from "#native/constants/stripe-terminal.constant";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The module, or `undefined` in a build that does not link it (web, desktop, an app without the package).
 *
 * @example
 * const module = cardTerminalModule();
 * if (module === undefined) return refuse(PlatformCapability.CardTerminal, "unavailable");
 */
export function cardTerminalModule(): CardTerminalNativeModule | undefined {
  return (globalThis as ExpoGlobal).expo?.modules?.[STRIPE_TERMINAL.module] as
    | CardTerminalNativeModule
    | undefined;
}
