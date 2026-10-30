/**
 * Stackra file contract:
 * Purpose: the native `GaugeChart`: a value on a three-quarter ring drawn like the native ProgressCircle (react-native-
 *          svg, a muted track and a rounded value arc), a target mark across the ring, and the figure with its word
 *          in the middle in RN Text. It is one `progressbar` whose value reads the figure and the target.
 * Boundary: geometry from the shared `arcPathOf` and `gaugeAngleOf`, so web and native draw the same ring; a gauge is
 *           symmetric, so it is not mirrored in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1 and 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { GAUGE_SWEEP } from "#core/constants/gauge-sweep.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { arcPathOf } from "#core/functions/arc-path-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { gaugeAngleOf } from "#core/functions/gauge-angle-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { GaugeChartProps } from "#native/gauge-chart/gauge-chart.props";
import { Text } from "#native/text/text";

/** The drawing box and the ring's radius and thickness, in its units, as on web. */
const BOX = 200;
const RADIUS = 84;
const STROKE = 14;

/** Degrees to radians, the unit the shared arc helper takes. */
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** A value against a target on a ring. */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  target,
  label,
  centerLabel,
  valueFormat,
  color = "chart-ramp-1",
  size = 200,
  className,
}: GaugeChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const written = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const c = BOX / 2;
  const end = gaugeAngleOf(value, min, max);
  const mark = target === undefined ? undefined : radians(gaugeAngleOf(target, min, max) - 90);
  const reach = [RADIUS - STROKE / 2 - 1, RADIUS + STROKE / 2 + 5] as const;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min,
        max,
        now: value,
        text:
          target === undefined
            ? written(value)
            : t(UI_KEYS.ui.chart.of_target, { value: written(value), target: written(target) }),
      }}
      className={["items-center self-center", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
        <Path
          d={arcPathOf(
            c,
            c,
            RADIUS,
            RADIUS,
            radians(GAUGE_SWEEP.start),
            radians(GAUGE_SWEEP.start + GAUGE_SWEEP.sweep),
          )}
          fill="none"
          stroke={paint.grid}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {end > GAUGE_SWEEP.start ? (
          <Path
            d={arcPathOf(c, c, RADIUS, RADIUS, radians(GAUGE_SWEEP.start), radians(end))}
            fill="none"
            stroke={paint.series[0] ?? paint.muted}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        ) : null}
        {mark === undefined ? null : (
          <Line
            x1={c + reach[0] * Math.cos(mark)}
            y1={c + reach[0] * Math.sin(mark)}
            x2={c + reach[1] * Math.cos(mark)}
            y2={c + reach[1] * Math.sin(mark)}
            stroke={paint.foreground}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="absolute inset-[22%] items-center justify-center"
      >
        <Text className="text-center text-xl font-bold tabular-nums">{written(value)}</Text>
        {centerLabel ? (
          <Text type="caption" tone="muted">
            {centerLabel}
          </Text>
        ) : null}
        {target === undefined ? null : (
          <Text type="caption" tone="muted" className="mt-1 tabular-nums">
            {`${t(UI_KEYS.ui.chart.target)}: ${written(target)}`}
          </Text>
        )}
      </View>
    </View>
  );
}
