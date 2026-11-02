/**
 * Stackra file contract:
 * Purpose: the native `RouteProgress`: a row of 2 pt dots across the top while a screen loads, lit forward from the
 *          leading edge (the right in Arabic) as the trickle grows, the brand's dot loader, filling and fading out when
 *          the load ends; the fade runs on the UI thread. A `progressbar` with a name and a busy state; reduced motion holds it still.
 * Boundary: draws nothing while idle; touches pass through. `isFixed` has no viewport on native: the bar is absolute
 *           at the top of its parent either way (the app layout or the header). The name defaults to `ui`.
 * Runtime: react-native
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0302 (decision 3);
 *          .agents/specs/sta-2017-dot-loader/spec.md (FR-005).
 */
import { useThemeColor } from "heroui-native";
import { useEffect, type ReactElement } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { THEME_PX } from "#core/constants/theme-px.constant";
import { ROUTE_PROGRESS_TIMING } from "#core/constants/route-progress-timing.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { useMotion } from "#native/design-system-provider/use-motion";
import { DotGrid } from "#native/dot-loader/dot-grid";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useRouteProgress } from "#react/route-progress/use-route-progress";
import type { RouteProgressProps } from "#native/route-progress/route-progress.props";

/** The bar's height, in points. */
const HEIGHT = 2;

/** The dots across the top edge, spread over the width. */
const ROUTE_DOTS = 96;

/** The thin loading bar across the top of the screen. */
export function RouteProgress({
  isLoading,
  label,
  isFixed: _isFixed,
}: RouteProgressProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useMotion() !== "full";
  const color = useThemeColor("accent");
  const { value, isVisible } = useRouteProgress(isLoading, isReduced);
  const opacity = useSharedValue(isLoading ? 1 : 0);

  useEffect(() => {
    const target = isLoading ? 1 : 0;
    opacity.set(
      isReduced ? target : withTiming(target, { duration: ROUTE_PROGRESS_TIMING.fadeMs }),
    );
  }, [isLoading, isReduced, opacity]);

  const trackStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  if (!isVisible) return null;
  const lit = dotLoaderFilled(value, 0, 1, ROUTE_DOTS);
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
      <DotGrid
        cols={ROUTE_DOTS}
        rows={1}
        dot={HEIGHT}
        lit={lit}
        emphasisAt={lit - 1}
        color={color}
        emphasis={color}
      />
    </Animated.View>
  );
}
