/**
 * Stackra file contract:
 * Purpose: `useGlassMaterial()`, the one decision of which material a native glass control draws: `liquid` (Liquid
 *          Glass) on iOS 26 and later while the user has neither reduced transparency nor darker system colours on,
 *          and `solid` everywhere else, Android and earlier iOS included. It is `solid` until the settings have
 *          answered, so a user who asked for less transparency never sees glass flash on the first frame.
 * Boundary: reads the device's accessibility settings and Liquid Glass support; draws nothing. One subscription to
 *           the settings is shared by every mounted control, so they all agree and switch together. There is no blur
 *           fallback: the owner chose Liquid Glass or solid (2026-10-24).
 * Runtime: react-native
 * Governing contract: ADR 0319 (decision 3); ADR 0320 (decision 7, the material modes and their fallbacks).
 */
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";
import type { GlassMaterial } from "#native/glass/glass-material.type";

/** The iOS settings that make the material solid. */
const SOLID_SETTING_EVENTS = ["reduceTransparencyChanged", "darkerSystemColorsChanged"] as const;

/** What the settings last said: `unknown` until they first answer, which draws solid. */
type Settings = "unknown" | "solid" | "clear";

const listeners = new Set<() => void>();
let subscriptions: { remove(): void }[] = [];
// Kept between mounts so a later control starts in the last known state.
let settings: Settings = "unknown";

/** Reads the settings again and tells every control when the answer changes. */
function refresh(): void {
  void Promise.all([
    AccessibilityInfo.isReduceTransparencyEnabled(),
    AccessibilityInfo.isDarkerSystemColorsEnabled(),
  ]).then((answers) => {
    const next: Settings = answers.includes(true) ? "solid" : "clear";
    if (next === settings) return;
    settings = next;
    for (const listener of listeners) listener();
  });
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    subscriptions = SOLID_SETTING_EVENTS.map((event) =>
      AccessibilityInfo.addEventListener(event, refresh),
    );
    refresh();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      for (const subscription of subscriptions.splice(0)) subscription.remove();
  };
}

const readSettings = () => settings;

/**
 * Whether Liquid Glass can be drawn. Both checks: some iOS 26 betas report Liquid Glass without the API, and GlassView
 * crashes there. `expo-glass-effect` is an optional peer: in an app that does not link it the check throws, and the
 * control draws solid.
 */
const LIQUID_GLASS = (() => {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
})();

/**
 * The material a native glass control draws now.
 * @returns `liquid` where Liquid Glass runs and the settings allow it, otherwise `solid`
 */
export function useGlassMaterial(): GlassMaterial {
  const current = useSyncExternalStore(subscribe, readSettings);
  return LIQUID_GLASS && current === "clear" ? "liquid" : "solid";
}
