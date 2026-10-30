/**
 * Stackra file contract:
 * Purpose: the native `RadialBarChart`: one ring per row, the first outermost, filled clockwise from the top to its
 *          value out of `maxValue` over a track, in its series' colour (the accent ramp by default) over a track of the muted colour at 15%, with an optional total and word in the
 *          middle.
 * Boundary: drawn with Skia arcs (Victory Native has no radial bar); never mirrored. The arcs sweep in once, and
 *           stand drawn at once under Reduce Motion. No press readout: the spoken value reads every number.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { type ReactElement, useEffect } from "react";
import { View } from "react-native";
import { useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { RingCentre } from "#native/chart/ring-centre";
import { sliceColorsOf } from "#native/chart/slice-colors-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { RadialBarChartProps } from "#native/radial-bar-chart/radial-bar-chart.props";

/** Rings filled to their values. */
export function RadialBarChart(props: RadialBarChartProps): ReactElement {
  const { data, series, label, nameKey, valueKey, valueFormat, height = 240 } = props;
  const { locale, words } = useChartLocale();
  const paint = useChartPaint(sliceColorsOf(data, series, nameKey, props.palette));
  const { width, onLayout } = useCanvasSize();
  const isReduced = useReducedMotion();
  const progress = useSharedValue(isReduced ? 1 : 0);
  useEffect(() => {
    progress.set(isReduced ? 1 : withTiming(1, { duration: 600 }));
  }, [isReduced, progress]);
  const table = chartTableOf({
    data,
    series,
    categoryKey: nameKey,
    valueKey,
    locale,
    valueFormat,
    words,
  });
  const values = data.map((row) => (typeof row[valueKey] === "number" ? row[valueKey] : 0));
  const total = values.reduce((sum, figure) => sum + figure, 0);
  const max = props.maxValue ?? Math.max(1, ...values);
  const outer = Math.max(0, Math.min(width, height) / 2 - 4);
  const inner = outer * (props.centerLabel ? 0.62 : 0.3);
  const band = (outer - inner) / Math.max(1, data.length);
  const thickness = Math.min(band * 0.72, 18);
  const ring = (index: number, share: number) => {
    const radius = outer - band * (index + 0.5);
    const path = Skia.Path.Make();
    const box = Skia.XYWHRect(width / 2 - radius, height / 2 - radius, radius * 2, radius * 2);
    path.addArc(box, -90, Math.min(1, Math.max(0, share)) * 359.99);
    return path;
  };
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={(props.showLegend ?? false) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <View style={{ height }} onLayout={onLayout}>
        {width > 0 ? (
          <Canvas style={{ width, height }}>
            {values.map((figure, index) => [
              <Path
                key={`track-${String(data[index]?.[nameKey])}`}
                path={ring(index, 1)}
                color={paint.grid}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={thickness}
              />,
              <Path
                key={`bar-${String(data[index]?.[nameKey])}`}
                path={ring(index, figure / max)}
                color={paint.series[index] ?? ""}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={thickness}
                strokeCap="round"
                end={progress}
              />,
            ])}
          </Canvas>
        ) : null}
        {props.centerLabel ? (
          <RingCentre
            value={formatChartNumber(total, locale, valueFormat)}
            word={props.centerLabel}
          />
        ) : null}
      </View>
    </ChartFrame>
  );
}
