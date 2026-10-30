/**
 * Stackra file contract:
 * Purpose: the web `ComposedChart` on Recharts: some series as columns (grouped or stacked, rounded data ends) and the
 *          rest as dashed monotone lines over them (an uncoloured line in `chart-4`, `composedSeriesOf`), with the shared quiet grid, axes, band cursor, tooltip, legend and data
 *          table (revenue as columns, margin as a line). Columns are lit softly from the top (flat in a flat brand).
 * Boundary: a new chart beside the others; it reuses the shared parts and changes none. Colours are `var(--chart-*)`
 *           presentation attributes; Recharts animates only without `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); chart style spec (2026-10-28);
 *          WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { type ReactElement, useId } from "react";
import { Bar, Cell, ComposedChart as RechartsComposedChart, Line } from "recharts";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { composedSeriesOf } from "#core/functions/composed-series-of.function";
import { activeDotOf } from "#react/chart/active-dot-of.function";
import { axisOf } from "#react/chart/axis-of.function";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { MarkGradient } from "#react/chart/mark-gradient";
import { paintOf } from "#react/chart/paint-of.function";
import { useCartesianChart } from "#react/chart/use-cartesian-chart";
import type { ComposedChartProps } from "#react/composed-chart/composed-chart.props";

/** The corner radius of a column's data end. */
const RADIUS = 4;

/** Columns and lines over one category axis. */
export function ComposedChart(props: ComposedChartProps): ReactElement {
  const { data, label, height = 240 } = props;
  const lineKeys = new Set(props.lineKeys ?? props.series.slice(-1).map((item) => item.key));
  const series = composedSeriesOf(props.series, lineKeys);
  const { locale, isRtl, hidden, brushLabel, frame } = useCartesianChart({
    ...props,
    series,
    showComparison: false,
  });
  const isStacked = props.stacked === true;
  const bars = series.filter((item) => !lineKeys.has(item.key));
  const id = useId().replaceAll(/[^\w-]/g, "");
  return (
    <ChartFrame {...frame}>
      <RechartsComposedChart
        {...(props.syncId === undefined ? {} : { syncId: props.syncId })}
        data={[...data]}
        responsive
        style={{ width: "100%", height: height + (props.showBrush ? 32 : 0) }}
        margin={{ top: 8, left: 12, right: 12 }}
        barGap={4}
        // A brush puts sliders in the figure, so it is a group then, not an image (axe nested-interactive).
        role={props.showBrush ? "group" : "img"}
        aria-label={label}
      >
        <defs>
          {bars.map((item) => (
            <MarkGradient
              key={item.key}
              id={`${id}-${item.key}`}
              color={paintOf(chartColorOf(item, series.indexOf(item), props.palette))}
            />
          ))}
        </defs>
        {cartesianParts({ ...props, brushLabel, locale, isRtl, isBandCursor: true })}
        {series.map((item, index) => {
          const color = paintOf(chartColorOf(item, index, props.palette));
          const isHidden = hidden.includes(item.key);
          if (lineKeys.has(item.key))
            return (
              <Line
                key={item.key}
                dataKey={item.key}
                name={item.label}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                // Dashed, so a line reads as an overlay on the columns and not as one more of them.
                strokeDasharray="6 4"
                dot={false}
                activeDot={activeDotOf(color)}
                {...axisOf(item.key, props.secondaryKeys)}
                hide={isHidden}
              />
            );
          const position = bars.indexOf(item);
          const isEnd = !isStacked || position === bars.length - 1;
          return (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={color}
              radius={isEnd ? [RADIUS, RADIUS, 0, 0] : 0}
              maxBarSize={40}
              {...(isStacked ? { stackId: "stack" } : {})}
              {...axisOf(item.key, props.secondaryKeys)}
              hide={isHidden}
            >
              {data.map((_, row) => (
                // oxlint-disable-next-line react/no-array-index-key -- one cell per row, in the rows' fixed order
                <Cell key={row} fill={`url(#${id}-${item.key})`} />
              ))}
            </Bar>
          );
        })}
      </RechartsComposedChart>
    </ChartFrame>
  );
}
