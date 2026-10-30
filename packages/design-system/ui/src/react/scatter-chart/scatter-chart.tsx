/**
 * Stackra file contract:
 * Purpose: the web `ScatterChart` on Recharts: points placed by two numbers, one colour per series (group), sized by a
 *          third number for a bubble chart, with the quiet grid and axes, a tooltip naming all three numbers, toggles
 *          in the legend, reference lines and bands, and the points as a data table.
 * Boundary: no style of its own: colours are theme presentation attributes. The horizontal axis runs right to left
 *           in Arabic and the vertical axis sits on the reading start. Recharts animates only without reduced motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.3.3; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartReferenceTextOf } from "#core/functions/chart-reference-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useSeriesToggle } from "#react/chart/use-series-toggle";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ScatterChartProps } from "#react/scatter-chart/scatter-chart.props";

/** The smallest and largest bubble areas, in square pixels. */
const BUBBLE: [number, number] = [40, 520];

/** A tooltip figure in its format, or nothing when the point has none. */
const written = (value: unknown, format: (figure: number) => string) =>
  typeof value === "number" ? format(value) : "";

/** Points by two numbers, sized by a third when given. */
export function ScatterChart(props: ScatterChartProps): ReactElement {
  const {
    data,
    series,
    label,
    xKey,
    yKey,
    sizeKey,
    groupKey,
    xLabel,
    yLabel,
    height = 280,
  } = props;
  const { locale, isRtl } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const { hidden, toggle } = useSeriesToggle();
  const x = (figure: number) => formatChartNumber(figure, locale, props.xFormat);
  const y = (figure: number) => formatChartNumber(figure, locale, props.valueFormat);
  const tick = (format: Intl.NumberFormatOptions | undefined) => (figure: unknown) =>
    typeof figure === "number"
      ? formatChartNumber(figure, locale, { notation: "compact", ...format })
      : String(figure);
  const groupOf = (row: (typeof data)[number]) =>
    groupKey === undefined ? series[0]?.key : String(row[groupKey] ?? "");
  const sizeLabel = props.sizeLabel ?? "";
  const table = {
    head: [t(UI_KEYS.ui.chart.group), xLabel, yLabel, ...(sizeKey ? [sizeLabel] : [])],
    rows: data.map((row) => [
      series.find((item) => item.key === groupOf(row))?.label ?? "",
      typeof row[xKey] === "number" ? x(row[xKey]) : "",
      typeof row[yKey] === "number" ? y(row[yKey]) : "",
      ...(sizeKey ? [typeof row[sizeKey] === "number" ? y(row[sizeKey]) : ""] : []),
    ]),
  };
  const side = isRtl ? ("right" as const) : ("left" as const);
  const sideTick = isRtl ? { ...CHART_PAINT.tick, textAnchor: "end" as const } : CHART_PAINT.tick;
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      className={props.className}
      onToggle={toggle}
      hiddenKeys={hidden}
      notes={(props.references ?? []).map((item) =>
        chartReferenceTextOf(item, locale, props.valueFormat),
      )}
    >
      <RechartsScatterChart
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12, bottom: 4 }}
        role="img"
        aria-label={label}
      >
        <CartesianGrid {...CHART_PAINT.grid} vertical={false} />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xLabel}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={CHART_PAINT.tick}
          tickFormatter={tick(props.xFormat)}
          reversed={isRtl}
          domain={["auto", "auto"]}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yLabel}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={sideTick}
          tickFormatter={tick(props.valueFormat)}
          orientation={side}
          width="auto"
          domain={["auto", "auto"]}
        />
        {sizeKey ? (
          <ZAxis
            type="number"
            dataKey={sizeKey}
            name={sizeLabel}
            range={BUBBLE}
            domain={["dataMin", "dataMax"]}
          />
        ) : (
          <ZAxis range={[60, 60]} />
        )}
        {(props.references ?? []).map((reference) =>
          reference.value !== undefined ? (
            <ReferenceLine
              key={`line:${reference.value}`}
              y={reference.value}
              stroke={paintOf(reference.color ?? "muted")}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              {...(reference.label
                ? {
                    label: {
                      value: reference.label,
                      position: isRtl ? "insideTopLeft" : "insideTopRight",
                      fill: paintOf(reference.color ?? "muted"),
                      fontSize: 10,
                    },
                  }
                : {})}
            />
          ) : reference.from === undefined || reference.to === undefined ? null : (
            <ReferenceArea
              key={`area:${reference.from}:${reference.to}`}
              y1={reference.from}
              y2={reference.to}
              fill={paintOf(reference.color ?? "muted")}
              fillOpacity={0.08}
              ifOverflow="extendDomain"
            />
          ),
        )}
        {props.showTooltip === false ? null : (
          <Tooltip
            cursor={CHART_PAINT.cursorLine}
            // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for the tooltip, not a component type
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as Record<string, unknown> | undefined;
              if (!active || !point) return null;
              const group = series.findIndex((item) => item.key === groupOf(point as never));
              const color = paintOf(chartColorOf(series[group], Math.max(group, 0), props.palette));
              const items = [
                { name: xLabel, value: written(point[xKey], x), color },
                { name: yLabel, value: written(point[yKey], y), color },
                ...(sizeKey ? [{ name: sizeLabel, value: written(point[sizeKey], y), color }] : []),
              ];
              return (
                <ChartTooltip
                  active
                  label={series[group]?.label ?? ""}
                  formatLabel={(name) => String(name)}
                  payload={items}
                />
              );
            }}
          />
        )}
        {series.map((item, index) => (
          <Scatter
            key={item.key}
            name={item.label}
            data={data.filter((row) => groupOf(row) === item.key) as Record<string, unknown>[]}
            fill={paintOf(chartColorOf(item, index, props.palette))}
            fillOpacity={sizeKey ? 0.85 : 0.95}
            stroke={CHART_PAINT.surface}
            strokeWidth={1}
            isAnimationActive={!isReduced}
            hide={hidden.includes(item.key)}
          />
        ))}
      </RechartsScatterChart>
    </ChartFrame>
  );
}
