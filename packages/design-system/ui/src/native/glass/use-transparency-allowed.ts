/**
 * Stackra file contract:
 * Purpose: `useTransparencyAllowed()`: whether the device lets a material be translucent: false while Reduce
 *          Transparency or Darker System Colours (iOS Increase Contrast) is on, and false until the settings first
 *          answer, so a user who asked for less transparency never sees glass flash on the first frame. One
 *          subscription to the settings is shared by every mounted control, so they all switch together.
 * Boundary: reads the accessibility settings only; Android reports neither setting, so it is allowed there once the
 *           queries answer. `useGlassMaterial` (Liquid Glass) and `useMaterialRole` (Liquid Glass, blur or solid) read it.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 4 and 7 as amended 2026-10-31).
 */
import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/** The iOS settings that make the material solid. */
const SOLID_SETTING_EVENTS = ["reduceTransparencyChanged", "darkerSystemColorsChanged"] as const;

/** What the settings last said: `unknown` until they first answer, which draws solid. */
type Settings = "unknown" | "solid" | "clear";

const listeners = new Set<() => void>();
let subscriptions: { remove: () => void }[] = [];
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

/** Whether the device's settings allow a translucent material now. */
export function useTransparencyAllowed(): boolean {
  return useSyncExternalStore(subscribe, readSettings) === "clear";
}
