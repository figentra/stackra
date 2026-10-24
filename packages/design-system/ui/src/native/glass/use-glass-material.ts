/**
 * Stackra file contract:
 * Purpose: `useGlassMaterial()`, the one decision of which material a native glass control draws: `liquid` (Liquid
 *          Glass, where the platform has it), `glass` (a blur view under the theme's surface fill) or `solid` (no
 *          glass) while the user asks for reduced transparency or more contrast.
 * Boundary: reads the device's accessibility settings and Liquid Glass support; draws nothing. One subscription to
 *          the settings is shared by every mounted control, so they all agree and switch together.
 * Runtime: react-native
 * Governing contract: ADR 0319 (decision 3); ADR 0320 (decision 7, the material modes and their fallbacks).
 */
import type { MaterialMode } from "@stackra/tokens/contracts";
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/** The modes a native control can draw; `frosted` has no native look of its own. */
export type GlassMaterial = Extract<MaterialMode, "liquid" | "glass" | "solid">;

/** The settings that make the material solid; each fires only on its own platform. */
const SOLID_SETTING_EVENTS = [
  "reduceTransparencyChanged",
  "darkerSystemColorsChanged",
  "highTextContrastChanged",
] as const;

const listeners = new Set<() => void>();
let subscriptions: { remove(): void }[] = [];
// Kept between mounts so a later control starts in the last known state; the first starts as glass until the
// settings answer.
let wantsSolid = false;

/** Reads the settings again; each query resolves `false` on the platform that lacks it. */
function refresh(): void {
  void Promise.all([
    AccessibilityInfo.isReduceTransparencyEnabled(),
    AccessibilityInfo.isDarkerSystemColorsEnabled(),
    AccessibilityInfo.isHighTextContrastEnabled(),
  ]).then((settings) => {
    const next = settings.includes(true);
    if (next === wantsSolid) return;
    wantsSolid = next;
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
    if (listeners.size === 0) for (const subscription of subscriptions.splice(0)) subscription.remove();
  };
}

const readWantsSolid = () => wantsSolid;

/**
 * The material a native glass control draws now.
 * @returns `solid` under reduced transparency or more contrast, else `liquid` where Liquid Glass runs, else `glass`
 */
export function useGlassMaterial(): GlassMaterial {
  if (useSyncExternalStore(subscribe, readWantsSolid)) return "solid";
  // Both checks: some iOS 26 betas report Liquid Glass without the API, and GlassView crashes there.
  return isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? "liquid" : "glass";
}
