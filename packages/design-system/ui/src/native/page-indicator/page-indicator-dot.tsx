/**
 * Stackra file contract:
 * Purpose: `PageIndicatorDot`, one dot of the native `PageIndicator`: 8 points wide, easing to 20 when current, on the
 *          UI thread; it jumps under Reduce Motion.
 * Boundary: drawing only; the press and the name are the indicator's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { type ReactElement, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/** The dot stretching or shrinking: the theme's moderate step. */
const MODERATE = motionTiming(STACKRA_THEME, "moderate");

/** Widths in points. */
const DOT = 8;
const CURRENT = 20;

/** One dot of the page indicator, stretched when its page is current. */
export function PageIndicatorDot({ isCurrent }: { readonly isCurrent: boolean }): ReactElement {
  const isReduced = useReducedMotion();
  const width = useSharedValue(isCurrent ? CURRENT : DOT);
  useEffect(() => {
    const next = isCurrent ? CURRENT : DOT;
    width.set(isReduced ? next : withTiming(next, { duration: MODERATE.durationMs }));
  }, [isCurrent, isReduced, width]);
  const style = useAnimatedStyle(() => ({ width: width.get() }));
  return (
    <Animated.View
      style={style}
      className={[
        "h-2 rounded-[var(--radius-pill)]",
        isCurrent ? "bg-foreground" : "bg-default",
      ].join(" ")}
    />
  );
}
