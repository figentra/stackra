/**
 * Stackra file contract:
 * Purpose: `Shake`: what `useShake` returns: the shaking wrapper's animated style and the function that plays the shake.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); WCAG 2.2 SC 2.3.3; STA-1371.
 */
import type { useAnimatedStyle } from "react-native-reanimated";

/** What `useShake` returns. */
export interface Shake {
  /** The animated style for the shaking wrapper. */
  readonly style: ReturnType<typeof useAnimatedStyle>;
  /** Plays the shake; does nothing under reduced motion. */
  readonly shake: () => void;
}
