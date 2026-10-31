/**
 * Stackra file contract:
 * Purpose: the native `Sparkline` on Victory Native: a word-sized line, area or bar trend with no axes, legend or
 *          readout, for a list row or a stat tile; one `image` named by `label` whose value is its numbers.
 * Boundary: fills its parent's width; oldest value at the reading start (the right in Arabic). Paths ease in only
 *           when Reduce Motion is off.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { LinearGradient, Skia, vec } from "@shopify/react-native-skia";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Area, Bar, CartesianChart, Line } from "victory-native";

import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { SparklineProps } from "#native/sparkline/sparkline.props";

/** The line drawing in: the theme's slow step. */
const SLOW = motionTiming(STACKRA_THEME, "slow");

/** A tiny trend. */
export function Sparkline({
  data,
  label,
  kind = "line",
  color = "accent",
  valueFormat,
  height = 32,
  className,
}: SparklineProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const isReduced = useReducedMotion();
  const [paint = ""] = useChartPaint([color]).series;
  const spoken = data
    .map((figure) => formatChartNumber(figure, locale, valueFormat))
    .join(isArabic(locale) ? "، " : ", ");
  const ordered = data.map((figure, index) => ({ index, figure }));
  const rows = isRtl
    ? // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
      ordered.map((row, index) => ({ ...row, index: data.length - 1 - index })).reverse()
    : ordered;
  const animate = isReduced
    ? {}
    : { animate: { type: "timing", duration: SLOW.durationMs } as const };
  // oxlint-disable-next-line react/capitalized-calls -- Skia.Color is Skia's colour parser, a namespace method, not a component
  const [red = 0, green = 0, blue = 0] = paint ? Skia.Color(paint) : [];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height }}
    >
      <CartesianChart
        data={rows}
        xKey="index"
        yKeys={["figure"]}
        padding={2}
        domainPadding={kind === "bar" ? { left: 4, right: 4 } : 0}
        {...(kind === "line" ? {} : { domain: { y: [0] as [number] } })}
        frame={{ lineWidth: 0 }}
        xAxis={{ lineWidth: 0, tickCount: 0 }}
        yAxis={[{ lineWidth: 0, tickCount: 0 }]}
      >
        {({ points, chartBounds }) =>
          kind === "bar" ? (
            <Bar
              points={points.figure}
              chartBounds={chartBounds}
              color={paint}
              innerPadding={0.25}
              roundedCorners={{ topLeft: 1, topRight: 1 }}
              {...animate}
            />
          ) : (
            <>
              {kind === "area" ? (
                <Area
                  points={points.figure}
                  y0={chartBounds.bottom}
                  curveType="monotoneX"
                  {...animate}
                >
                  <LinearGradient
                    start={vec(0, chartBounds.top)}
                    end={vec(0, chartBounds.bottom)}
                    colors={[
                      Float32Array.of(red, green, blue, 0.35),
                      Float32Array.of(red, green, blue, 0.02),
                    ]}
                  />
                </Area>
              ) : null}
              <Line
                points={points.figure}
                color={paint}
                strokeWidth={1.5}
                curveType="monotoneX"
                {...animate}
              />
            </>
          )
        }
      </CartesianChart>
    </View>
  );
}
