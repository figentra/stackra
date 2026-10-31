/**
 * Stackra file contract:
 * Purpose: `haptics`, the one place a native control plays touch feedback: a light impact for a press, a selection
 *          tick for a changed choice, a rigid stop at a bound and a notification for an outcome, through
 *          `expo-haptics`, each kind as the pattern the theme's haptic token names (ADR 0501). On by default; the app turns it off for everyone with `haptics.setEnabled(false)`, and
 *          `useHaptic()` re-renders on the change.
 * Boundary: plays and remembers the switch; never throws. `expo-haptics` is an optional peer, loaded on the first
 *           play: in an app (or a test) without it, or on a device with no haptic engine, nothing plays.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0320 (the showcase stage); ADR 0501 (haptic tokens).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import type { HapticPattern } from "@stackra/tokens/contracts";
import type * as ExpoHaptics from "expo-haptics";

import type { HapticKind } from "#native/haptics/haptic-kind.type";

/** How each `expo-haptics` pattern of the theme's haptic tokens is played. */
const PLAY: Readonly<
  Record<HapticPattern, (engine: typeof ExpoHaptics) => Promise<void> | undefined>
> = {
  selection: (engine) => engine.selectionAsync(),
  "impact-light": (engine) => engine.impactAsync(engine.ImpactFeedbackStyle.Light),
  "impact-medium": (engine) => engine.impactAsync(engine.ImpactFeedbackStyle.Medium),
  "impact-heavy": (engine) => engine.impactAsync(engine.ImpactFeedbackStyle.Heavy),
  "impact-rigid": (engine) => engine.impactAsync(engine.ImpactFeedbackStyle.Rigid),
  "impact-soft": (engine) => engine.impactAsync(engine.ImpactFeedbackStyle.Soft),
  "notification-success": (engine) =>
    engine.notificationAsync(engine.NotificationFeedbackType.Success),
  "notification-warning": (engine) =>
    engine.notificationAsync(engine.NotificationFeedbackType.Warning),
  "notification-error": (engine) => engine.notificationAsync(engine.NotificationFeedbackType.Error),
  none: () => undefined,
};

const listeners = new Set<() => void>();
let isOn = true;
// `undefined` until the first play, `null` when the peer is missing.
let engine: typeof ExpoHaptics | null | undefined;

/** The haptic engine, or `null` where `expo-haptics` is not installed. */
function loadEngine(): typeof ExpoHaptics | null {
  if (engine === undefined) {
    try {
      // oxlint-disable-next-line typescript/no-require-imports -- required on first use, not imported, so an app without the optional peer still runs
      engine = require("expo-haptics") as typeof ExpoHaptics;
    } catch {
      engine = null;
    }
  }
  return engine;
}

/** Plays touch feedback and holds the app-wide switch. */
export const haptics = Object.freeze({
  /** Plays `kind`, unless haptics are off or cannot play here. */
  play(kind: HapticKind): void {
    if (!isOn) return;
    const loaded = loadEngine();
    if (loaded === null) return;
    try {
      // shortcut: the stackra theme's haptic tokens; a brand's own reach native when the theme store carries them.
      const pattern = STACKRA_THEME.haptics[kind] ?? "none";
      PLAY[pattern](loaded)?.catch(() => undefined);
    } catch {
      // A native module that is not linked throws before it returns a promise.
    }
  },
  /** Whether haptics play; `true` until the app turns them off. */
  isEnabled(): boolean {
    return isOn;
  },
  /** Turns haptics on or off for every control. */
  setEnabled(next: boolean): void {
    if (next === isOn) return;
    isOn = next;
    for (const listener of listeners) listener();
  },
  /** Calls `listener` when the switch changes; returns the unsubscribe. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
});
