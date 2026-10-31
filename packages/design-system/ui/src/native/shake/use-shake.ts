/**
 * Stackra file contract:
 * Purpose: `useShake()`, a horizontal "no" shake for a native field: an animated style to put on a wrapper and a
 *          `shake()` that plays it on the UI thread. MoneyField (over-limit) and PasswordField (wrong PIN) use it.
 * Boundary: plays nothing while the system asks for reduced motion. The shake is symmetric, so it reads the same in RTL.
 * Runtime: react-native
 * Governing contract: gap inventory rows 2 and 3 (owner decision 2026-10-28, "P1 + P2 core"); WCAG 2.2 SC 2.3.3.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Shake } from "#native/shake/shake.type";

/** One leg of the shake, in ms: half the theme's instant step. */
const LEG = { duration: motionTiming(STACKRA_THEME, "instant").durationMs / 2 } as const;

/** The style of the shaking wrapper and the function that plays the shake. */
export function useShake(): Shake {
  const offset = useSharedValue(0);
  const isReduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const shake = () => {
    if (isReduced) return;
    offset.set(
      withSequence(
        withTiming(-10, LEG),
        withTiming(10, LEG),
        withTiming(-6, LEG),
        withTiming(6, LEG),
        withTiming(0, LEG),
      ),
    );
  };
  return { style, shake } as const;
}
