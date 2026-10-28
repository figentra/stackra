/**
 * Stackra file contract:
 * Purpose: `AccessibilityInfoSystemAccessibilityDriver`, the `accessibility-info` driver of `SystemAccessibility`: the
 *          device's Reduce Motion, Bold Text, Darker Colors / high-contrast text and text size (Dynamic Type on iOS,
 *          font scale on Android) through React Native's `AccessibilityInfo` and `PixelRatio`, and their changes.
 * Boundary: device only (gen lists it for the native target). `AccessibilityInfo` answers asynchronously, so the
 *           booleans read `false` until the first answer lands right after the first subscription; the font scale is
 *           read synchronously from the start. A setting a platform lacks (Bold Text on Android, high-contrast text
 *           on iOS) answers `false`. A text-size change arrives as a `Dimensions` change. A failed read keeps the last
 *           answer. Reads only: Expo and React Native APIs, no hand-written native code (ADR 0478).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0294 (decision 15).
 */
import { Driver } from "@stackra/container";
import { AccessibilityInfo, Dimensions, PixelRatio } from "react-native";

import { DEFAULT_ACCESSIBILITY_SETTINGS, SystemAccessibility } from "#contracts/index";
import type { AccessibilitySettings } from "#contracts/index";

/** The `AccessibilityInfo` events after which the settings are read again. */
const SETTING_EVENTS = [
  "reduceMotionChanged",
  "boldTextChanged",
  "highTextContrastChanged",
  "darkerSystemColorsChanged",
] as const;

/** The device's accessibility settings. */
export class AccessibilityInfoSystemAccessibilityDriver extends Driver(SystemAccessibility) {
  private settings: AccessibilitySettings = Object.freeze({
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
    fontScale: PixelRatio.getFontScale(),
  });

  private readonly listeners = new Set<() => void>();

  private subscriptions: { remove: () => void }[] = [];

  /** Reads every setting again and notifies subscribers when one changed. */
  private readonly refresh = (): void => {
    void Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isBoldTextEnabled(),
      AccessibilityInfo.isHighTextContrastEnabled(),
      AccessibilityInfo.isDarkerSystemColorsEnabled(),
    ])
      .then(([reduceMotion, boldText, highTextContrast, darkerColors]) =>
        this.update({
          reduceMotion,
          boldText,
          highContrast: highTextContrast || darkerColors,
          fontScale: PixelRatio.getFontScale(),
        }),
      )
      // A failed read keeps the last answer; the next change event reads again.
      .catch(() => undefined);
  };

  /** The settings last read: the same object until one changes. */
  current(): AccessibilitySettings {
    return this.settings;
  }

  /**
   * Calls `listener` whenever a setting changes; the first subscription starts watching the device and reads it.
   *
   * @returns removes the listener; the last removal stops watching.
   */
  subscribe(listener: () => void): () => void {
    const entry = () => listener();
    if (this.listeners.size === 0) {
      this.subscriptions = [
        ...SETTING_EVENTS.map((event) => AccessibilityInfo.addEventListener(event, this.refresh)),
        Dimensions.addEventListener("change", this.refresh),
      ];
      this.refresh();
    }
    this.listeners.add(entry);
    return () => {
      if (!this.listeners.delete(entry) || this.listeners.size > 0) return;
      for (const subscription of this.subscriptions.splice(0)) subscription.remove();
    };
  }

  /** Replaces the snapshot and notifies subscribers when `next` differs from it. */
  private update(next: AccessibilitySettings): void {
    const keys = Object.keys(next) as (keyof AccessibilitySettings)[];
    if (keys.every((key) => next[key] === this.settings[key])) return;
    this.settings = Object.freeze(next);
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  }
}
