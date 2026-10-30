/**
 * Stackra file contract:
 * Purpose: `themeTransition`, the app's theme transition setting: the Uniwind Pro preset a colour scheme change draws
 *          (default: a circle from the tapped point), the point the next change starts from, and Fade in its place
 *          while the system's Reduce Motion is on. `useThemeTransition` reads the preset in a component.
 * Boundary: state only; the design-system provider hands `take()` to `Uniwind.setTheme`. shortcut: the preset lives in
 *           memory and resets on launch, like the theme knobs, because the app has no storage dependency yet; persist
 *           it through `@stackra/storage` once the app takes it (ADR 0256).
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0310 (decision 11, Uniwind Pro); WCAG 2.2 SC 2.3.3.
 */
import { AccessibilityInfo } from "react-native";
import { ThemeTransitionPreset, type Uniwind } from "uniwind";

type ThemeTransition = NonNullable<Parameters<typeof Uniwind.setTheme>[1]>;

let preset = ThemeTransitionPreset.CircleFromOrigin;
let origin: ThemeTransition["origin"];
let isReduceMotion = false;
const listeners = new Set<() => void>();

void AccessibilityInfo.isReduceMotionEnabled().then((isOn) => (isReduceMotion = isOn));
AccessibilityInfo.addEventListener("reduceMotionChanged", (isOn) => (isReduceMotion = isOn));

/** The app's one theme transition setting. */
export const themeTransition = {
  getSnapshot: () => preset,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  setPreset(next: ThemeTransitionPreset) {
    preset = next;
    for (const listener of listeners) listener();
  },
  /** Where the next transition starts: the point the user tapped, in window points. */
  setOrigin(next: ThemeTransition["origin"]) {
    origin = next;
  },
  /** The transition for a theme change now, Fade under Reduce Motion; the tapped point is used once. */
  take(): ThemeTransition {
    const from = origin;
    origin = undefined;
    const isMoving = preset !== ThemeTransitionPreset.None;
    return {
      preset: isReduceMotion && isMoving ? ThemeTransitionPreset.Fade : preset,
      ...(from ? { origin: from } : {}),
    };
  },
};
