/**
 * Stackra file contract:
 * Purpose: the native `RadarChart`: one spoke per row clockwise from the top over a four-step polygon grid, one
 *          filled shape per series in its theme colour with a dot at each value, the spoke names around it, and the
 *          legend.
 * Boundary: drawn with Skia paths (Victory Native has no radar); the spoke names are Text over the canvas, so they
 *           shape Arabic. Never mirrored. Static, so Reduce Motion has nothing to stop; no press readout: the spoken
 *           value reads every number.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { Canvas, Circle, Path, Skia } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { RadarChartProps } from "#native/radar-chart/radar-chart.props";
import { Text } from "#native/text/text";

/** The grid's rings, and the room left round the plot for the spoke names. */
const STEPS = 4;
const LABEL_ROOM = 34;
const LABEL_WIDTH = 72;

/** Series as shapes over spokes. */
export function RadarChart(props: RadarChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, height = 260 } = props;
  const { locale, words } = useChartLocale();
  const paint = useChartPaint(
    series.map((item, index) => chartColorOf(item, index, props.palette)),
  );
  const { width, onLayout } = useCanvasSize();
  const table = chartTableOf({
    data,
    series,
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  const centre = { x: width / 2, y: height / 2 };
  const radius = Math.max(0, Math.min(width, height) / 2 - LABEL_ROOM);
  const max = Math.max(
    1,
    ...data.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)),
  );
  const at = (index: number, share: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(1, data.length);
    return {
      x: centre.x + Math.cos(angle) * radius * share,
      y: centre.y + Math.sin(angle) * radius * share,
    };
  };
  const polygon = (share: (index: number) => number) => {
    const path = Skia.Path.Make();
    data.forEach((_, index) => {
      const point = at(index, share(index));
      if (index === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.close();
    return path;
  };
  // oxlint-disable-next-line react/capitalized-calls -- Skia.Path.Make is Skia's path factory, a namespace method, not a component
  const spokes = Skia.Path.Make();
  data.forEach((_, index) => {
    const point = at(index, 1);
    spokes.moveTo(centre.x, centre.y);
    spokes.lineTo(point.x, point.y);
  });
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <View style={{ height }} onLayout={onLayout}>
        {width > 0 ? (
          <Canvas style={{ width, height }}>
            {Array.from({ length: STEPS }, (_, step) => (
              <Path
                key={step}
                path={polygon(() => (step + 1) / STEPS)}
                color={paint.grid}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={1}
              />
            ))}
            <Path
              path={spokes}
              color={paint.grid}
              // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
              style="stroke"
              strokeWidth={1}
            />
            {series.map((item, index) => {
              const shape = polygon((row) => (Number(data[row]?.[item.key]) || 0) / max);
              const color = paint.series[index] ?? "";
              return [
                <Path
                  key={`${item.key}-fill`}
                  path={shape}
                  color={color}
                  opacity={series.length > 1 ? 0.25 : 0.5}
                />,
                <Path
                  key={`${item.key}-edge`}
                  path={shape}
                  color={color}
                  // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                  style="stroke"
                  strokeWidth={2}
                />,
                ...data.map((row, rowIndex) => {
                  const point = at(rowIndex, (Number(row[item.key]) || 0) / max);
                  return (
                    <Circle
                      key={`${item.key}-${String(row[xKey])}`}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      color={color}
                    />
                  );
                }),
              ];
            })}
          </Canvas>
        ) : null}
        {width > 0
          ? data.map((row, index) => {
              const point = at(index, 1 + 18 / Math.max(1, radius));
              return (
                <View
                  key={String(row[xKey])}
                  pointerEvents="none"
                  className="absolute items-center"
                  style={{ left: point.x - LABEL_WIDTH / 2, top: point.y - 8, width: LABEL_WIDTH }}
                >
                  <Text type="caption" tone="muted" numberOfLines={1} className="text-xs">
                    {formatChartCategory(row[xKey], locale, xFormat)}
                  </Text>
                </View>
              );
            })
          : null}
      </View>
    </ChartFrame>
  );
}
