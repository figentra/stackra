/**
 * Stackra file contract:
 * Purpose: the native `ProgressCircle`, the adapted form HeroUI Native documents it has no component for, drawn as the
 *          brand's dot loader on the same contract as the web circle: a 3×3 cell filled in floor order to the value,
 *          the leading dot in the emphasis colour, or, with no value, the build looping as the Spinner's does. It is
 *          one accessible `progressbar` with its range, value and text (`accessibilityValue`), and an indeterminate one
 *          is also `busy`.
 * Boundary: the dots are drawn here under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02). Reduced
 *          motion (the system's or the provider's) shows an indeterminate cell full, dimmed and at rest. Needs the
 *          native DesignSystemProvider for the locale and the direction.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          ADR 0312; .agents/specs/sta-2017-dot-loader/spec.md (FR-004, FR-006, FR-007); WCAG 2.2 SC 2.3.3 and 4.1.2.
 */
import { useThemeColor } from "heroui-native";
import type { ReactElement } from "react";
import { View } from "react-native";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { progressStateOf } from "#core/functions/progress-state-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { useMotion } from "#native/design-system-provider/use-motion";
import { DotGrid } from "#native/dot-loader/dot-grid";
import { useDotLoader } from "#native/hooks/use-dot-loader";
import type { ProgressCircleProps } from "#native/progress-circle/progress-circle.props";

export function ProgressCircle({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  style,
  ...rest
}: ProgressCircleProps): ReactElement {
  const { locale } = useDesignSystem();
  const { percentage, accessibilityValue } = progressStateOf({
    value,
    minValue,
    maxValue,
    valueLabel,
    locale,
  });
  const isIndeterminate = percentage === undefined;
  const motion = useMotion();
  const isRunning = isIndeterminate && motion === "full";
  const building = useDotLoader(9, isRunning);
  const filled = isIndeterminate ? building : dotLoaderFilled(percentage, 0, 100, 9);
  // shortcut: the leading dot takes the tone's colour until @stackra/tokens ships the native core colour (STA-2015).
  const color = useThemeColor(PROGRESS_FILL_ROLE[tone]);
  const { dot, gap } = DOT_LOADER.circle[size] ?? DOT_LOADER.circle.md;

  return (
    <View
      {...rest}
      style={[isIndeterminate && !isRunning ? { opacity: DOT_LOADER.reducedOpacity } : null, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: isIndeterminate }}
      {...(accessibilityValue ? { accessibilityValue } : {})}
    >
      <DotGrid
        cols={3}
        rows={3}
        dot={dot}
        gap={gap}
        lit={filled}
        emphasisAt={isIndeterminate ? 8 : filled - 1}
        color={color}
        emphasis={color}
      />
    </View>
  );
}
