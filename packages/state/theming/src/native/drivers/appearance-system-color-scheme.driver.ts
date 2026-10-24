/**
 * Stackra file contract:
 * Purpose: `AppearanceSystemColorSchemeDriver`, the `appearance` driver of `SystemColorScheme`: the device's colour
 *          preference through React Native's `Appearance`, and its change events.
 * Boundary: device only (gen lists it for the native target). `Appearance` reports an app-level override while one is
 *           set; the design system provider clears it (`unspecified`) while the chosen scheme is `system`, which is the
 *           only time `ColorSchemeService` asks, so the answer is the device's. Anything but `dark` reads as `light`.
 * Runtime: react-native
 * Governing contract: ADR 0060 (light and dark); ADR 0294 (decisions 15 and 17); ADR 0302 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";
import { Appearance } from "react-native";

import { SystemColorScheme } from "#contracts/index";

/** The device's colour preference. */
export class AppearanceSystemColorSchemeDriver extends Driver(SystemColorScheme) {
  /** `dark` while the device prefers dark, `light` otherwise. */
  current(): ResolvedColorScheme {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }

  /**
   * Calls `listener` on every appearance change.
   *
   * @returns removes the listener.
   */
  subscribe(listener: () => void): () => void {
    const subscription = Appearance.addChangeListener(() => listener());
    return () => subscription.remove();
  }
}
