/**
 * Stackra file contract:
 * Purpose: the native `SplitView`: on a tablet the list pane (at the reading start, `primaryWidth` wide, a hairline at
 *          its end) beside the detail pane; on a phone one pane at a time, `isSecondaryShown` choosing which, the new
 *          one fading in.
 * Boundary: the size class comes from `#native/use-breakpoint/use-breakpoint`; the row follows the reading direction,
 *           so the list sits on the right in Arabic. Navigation between the panes on a phone is the app's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn, useThemeColor } from "heroui-native";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { ReactElement } from "react";

import type { SplitViewProps } from "#native/split-view/split-view.props";
import { useBreakpoint } from "#native/use-breakpoint/use-breakpoint";

const BASE = motionTiming(STACKRA_THEME, "base");

/** A list and its detail, side by side when they fit and one at a time on a phone. */
export function SplitView({
  primary,
  secondary,
  isSecondaryShown = false,
  primaryLabel,
  secondaryLabel,
  primaryWidth = 320,
  className,
  ...rest
}: SplitViewProps): ReactElement {
  const { sizeClass } = useBreakpoint();
  const separator = useThemeColor("separator");

  if (sizeClass === "phone") {
    const isSecondary = isSecondaryShown;
    return (
      <View {...rest} className={cn("flex-1", className) ?? ""}>
        <Animated.View
          key={isSecondary ? "secondary" : "primary"}
          entering={FadeIn.duration(BASE.durationMs).reduceMotion(ReduceMotion.System)}
          accessibilityLabel={isSecondary ? secondaryLabel : primaryLabel}
          className="flex-1"
        >
          {isSecondary ? secondary : primary}
        </Animated.View>
      </View>
    );
  }
  return (
    <View {...rest} className={cn("flex-1 flex-row", className) ?? ""}>
      <View
        accessibilityLabel={primaryLabel}
        style={{
          width: primaryWidth,
          borderEndWidth: StyleSheet.hairlineWidth,
          borderColor: separator,
        }}
      >
        {primary}
      </View>
      <View accessibilityLabel={secondaryLabel} className="flex-1">
        {secondary}
      </View>
    </View>
  );
}
