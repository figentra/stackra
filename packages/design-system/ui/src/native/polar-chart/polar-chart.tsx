/**
 * Stackra file contract:
 * Purpose: the native `PolarChart`, a polar area (Nightingale rose) chart: one equal-angle sector per row clockwise
 *          from the top, its radius the value against the largest, split into one slice per series in its theme
 *          colour, over four grid rings and the spokes, with the sector names round the edge and the legend.
 * Boundary: Skia paths from the shared `arcPathOf` and `polarSectorsOf`, as the sunburst draws; the names are Text over
 *           the canvas, so they shape Arabic (never Skia text). Never mirrored. Static, so Reduce Motion has nothing to
 *           stop; no press readout, as on the radar: the spoken value reads every number.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Canvas, Circle, Path } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { arcPathOf } from "#core/functions/arc-path-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { polarSectorsOf } from "#core/functions/polar-sectors-of.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { PolarChartProps } from "#native/polar-chart/polar-chart.props";
import { Text } from "#native/text/text";

/** The grid's rings, and the room left round the plot for the sector names. */
const STEPS = 4;
const LABEL_ROOM = 30;
const LABEL_WIDTH = 72;

/** Sectors whose radius is their value. */
export function PolarChart(props: PolarChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, height = 280 } = props;
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
  const outer = Math.max(0, Math.min(width, height) / 2 - LABEL_ROOM);
  const step = (Math.PI * 2) / Math.max(1, data.length);
  const pointAt = (angle: number, radius: number) => ({
    x: centre.x + Math.sin(angle) * radius,
    y: centre.y - Math.cos(angle) * radius,
  });
  const spokes = data
    .map((_, index) => {
      const edge = pointAt(index * step, outer);
      return `M ${centre.x} ${centre.y} L ${edge.x} ${edge.y}`;
    })
    .join(" ");
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
            {Array.from({ length: STEPS }, (_, ring) => (
              <Circle
                key={ring}
                cx={centre.x}
                cy={centre.y}
                r={(outer * (ring + 1)) / STEPS}
                color={paint.grid}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={1}
              />
            ))}
            {data.length > 1 ? (
              <Path
                path={spokes}
                color={paint.grid}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={1}
              />
            ) : null}
            {polarSectorsOf(data, series).map((sector) => {
              if (sector.share <= 0) return null;
              const path = arcPathOf(
                centre.x,
                centre.y,
                0,
                outer * sector.share,
                sector.start,
                sector.end,
              );
              return [
                <Path
                  key={`fill-${sector.row}-${sector.series}`}
                  path={path}
                  color={paint.series[sector.series] ?? ""}
                />,
                <Path
                  key={`gap-${sector.row}-${sector.series}`}
                  path={path}
                  color={paint.surface}
                  // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                  style="stroke"
                  strokeWidth={1.5}
                />,
              ];
            })}
          </Canvas>
        ) : null}
        {width > 0
          ? data.map((row, index) => {
              const at = pointAt((index + 0.5) * step, outer + 16);
              return (
                <View
                  key={String(row[xKey])}
                  pointerEvents="none"
                  className="absolute items-center"
                  style={{ left: at.x - LABEL_WIDTH / 2, top: at.y - 8, width: LABEL_WIDTH }}
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
