/**
 * Stackra file contract:
 * Purpose: the native `RouteProgress`: a 2 pt accent bar across the top while a screen loads, trickling forward from the
 *          leading edge (Yoga mirrors it in Arabic), filling and fading out when the load ends; the fill and fade run on
 *          the UI thread. A `progressbar` with a name and a busy state; reduced motion holds it still.
 * Boundary: draws nothing while idle; touches pass through. `isFixed` has no viewport on native: the bar is absolute
 *           at the top of its parent either way (the app layout or the header). The name defaults to `ui`.
 * Runtime: react-native
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { useThemeColor } from "heroui-native";
import { useEffect, type ReactElement } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { THEME_PX } from "#core/constants/theme-px.constant";
import { ROUTE_PROGRESS_TIMING } from "#core/constants/route-progress-timing.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useRouteProgress } from "#react/route-progress/use-route-progress";
import type { RouteProgressProps } from "#native/route-progress/route-progress.props";

/** The bar's height, in points. */
const HEIGHT = 2;

/** The thin loading bar across the top of the screen. */
export function RouteProgress({
  isLoading,
  label,
  isFixed: _isFixed,
}: RouteProgressProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const color = useThemeColor("accent");
  const { value, isVisible } = useRouteProgress(isLoading, isReduced);
  const fill = useSharedValue(value);
  const opacity = useSharedValue(isLoading ? 1 : 0);

  useEffect(() => {
    fill.set(isReduced ? value : withTiming(value, { duration: ROUTE_PROGRESS_TIMING.trickleMs }));
  }, [value, isReduced, fill]);
  useEffect(() => {
    const target = isLoading ? 1 : 0;
    opacity.set(
      isReduced ? target : withTiming(target, { duration: ROUTE_PROGRESS_TIMING.fadeMs }),
    );
  }, [isLoading, isReduced, opacity]);

  const trackStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  if (!isVisible) return null;
  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t(UI_KEYS.ui.route_progress.label)}
      accessibilityState={{ busy: isLoading }}
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          start: 0,
          end: 0,
          height: HEIGHT,
          zIndex: THEME_PX.zIndex["overlay"],
        },
        trackStyle,
      ]}
    >
      <Animated.View style={[{ height: HEIGHT, backgroundColor: color }, fillStyle]} />
    </Animated.View>
  );
}
