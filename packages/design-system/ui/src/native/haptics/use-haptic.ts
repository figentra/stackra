/**
 * Stackra file contract:
 * Purpose: `useHaptic()`, the app-wide haptics switch as React state (for a settings toggle) beside `play`; the
 *          switch also follows `DesignSystemProvider`'s `haptics` prop.
 * Boundary: reads and sets `haptics`; plays nothing itself.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3).
 */
import { useSyncExternalStore } from "react";

import type { HapticKind } from "#native/haptics/haptic-kind.type";
import { haptics } from "#native/haptics/haptics";

/**
 * The haptics switch and player.
 * @returns whether haptics are on, the setter, and `play`
 */
export function useHaptic(): {
  isEnabled: boolean;
  setEnabled: (next: boolean) => void;
  play: (kind: HapticKind) => void;
} {
  const isEnabled = useSyncExternalStore(haptics.subscribe, haptics.isEnabled, haptics.isEnabled);
  return { isEnabled, setEnabled: haptics.setEnabled, play: haptics.play };
}
