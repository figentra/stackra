/**
 * Stackra file contract:
 * Purpose: the native `ProgressBar`, the adapted form HeroUI Native documents it has no component for, drawn as the
 *          brand's dot loader on the same contract as the web bar: a row of dots filled from the inline start to the
 *          value, the leading dot in the emphasis colour, or, with no value, the build running along the row. It is
 *          one accessible `progressbar` with its range, value and text (`accessibilityValue`), and an indeterminate one
 *          is also `busy`.
 * Boundary: the dots are drawn here under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02). Reduced
 *          motion (the system's or the provider's) shows an indeterminate row lit and dimmed, at rest. Needs the native
 *          DesignSystemProvider for the locale and the direction (the dots fill from the right in Arabic).
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          ADR 0312; .agents/specs/sta-2017-dot-loader/spec.md (FR-003, FR-006, FR-007); WCAG 2.2 SC 2.3.3 and 4.1.2.
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
import { Text } from "#native/text/text";
import type { ProgressBarProps } from "#native/progress-bar/progress-bar.props";

export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  isLabelVisible = false,
  isValueVisible = false,
  style,
  ...rest
}: ProgressBarProps): ReactElement {
  const { locale } = useDesignSystem();
  const { percentage, valueText, accessibilityValue } = progressStateOf({
    value,
    minValue,
    maxValue,
    valueLabel,
    locale,
  });
  const isIndeterminate = percentage === undefined;
  const motion = useMotion();
  const isRunning = isIndeterminate && motion === "full";
  const count = DOT_LOADER.barDots[size] ?? DOT_LOADER.barDots.md;
  const building = useDotLoader(count, isRunning);
  const filled = isIndeterminate ? building : dotLoaderFilled(percentage, 0, 100, count);
  // shortcut: the leading dot takes the tone's colour until @stackra/tokens ships the native core colour (STA-2015).
  const color = useThemeColor(PROGRESS_FILL_ROLE[tone]);

  return (
    <View
      {...rest}
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: isIndeterminate }}
      {...(accessibilityValue ? { accessibilityValue } : {})}
    >
      {isLabelVisible || (isValueVisible && valueText !== undefined) ? (
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {isLabelVisible ? <Text type="small">{label}</Text> : null}
          {isValueVisible && valueText !== undefined ? (
            <Text type="small" style={{ marginStart: "auto" }}>
              {valueText}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={isIndeterminate && !isRunning ? { opacity: DOT_LOADER.reducedOpacity } : null}>
        <DotGrid
          cols={count}
          rows={1}
          dot={DOT_LOADER.barDot[size] ?? DOT_LOADER.barDot.md}
          lit={filled}
          emphasisAt={filled - 1}
          color={color}
          emphasis={color}
        />
      </View>
    </View>
  );
}
