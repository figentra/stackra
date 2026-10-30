/**
 * Stackra file contract:
 * Purpose: the web `BarChart` on Recharts: columns (`vertical`, the default) or bars (`horizontal`), one per series
 *          side by side, or stacked, in the series' theme colours, with the shared grid, axes, tooltip, legend and
 *          data table. Only a stack's outer ends are rounded.
 * Boundary: no style of its own: colours are `var(--chart-<n>)` presentation attributes. Horizontal bars grow from
 *           the reading start (the right in Arabic). Recharts animates only without `prefers-reduced-motion`; the
 *           plot is an `img` named by `label`, focusable, and arrow keys move the tooltip from row to row.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";
import { Bar, BarChart as RechartsBarChart } from "recharts";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import type { BarChartProps } from "#react/bar-chart/bar-chart.props";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useCartesianChart } from "#react/chart/use-cartesian-chart";
import { useChartLocale } from "#react/chart/use-chart-locale";

/** The corner radius of a bar's free end. */
const RADIUS = 4;

/**
 * The corners of a bar (top-left, top-right, bottom-right, bottom-left): all four alone; in a stack only the first
 * series' base and the last one's end, the end being the top of a column or the reading end of a bar.
 */
function cornersOf(
  index: number,
  count: number,
  isStacked: boolean,
  isHorizontal: boolean,
  isRtl: boolean,
): [number, number, number, number] {
  const r = RADIUS;
  if (!isStacked) return [r, r, r, r];
  const isBase = index === 0;
  const isEnd = index === count - 1;
  if (!isHorizontal) return [isEnd ? r : 0, isEnd ? r : 0, isBase ? r : 0, isBase ? r : 0];
  const [start, end] = isRtl ? [isEnd, isBase] : [isBase, isEnd];
  return [start ? r : 0, end ? r : 0, end ? r : 0, start ? r : 0];
}

/** Columns or bars over a category axis. */
export function BarChart(props: BarChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, height = 240 } = props;
  const isHorizontal = props.orientation === "horizontal";
  const isStacked = props.stacked === true;
  const { locale: tag } = useChartLocale();
  const rows = sortChartItems(
    data,
    props.sort,
    (row) => series.reduce((sum, item) => sum + (Number(row[item.key]) || 0), 0),
    (row) => formatChartCategory(row[xKey], tag, xFormat),
    tag,
  );
  const { locale, isRtl, hidden, compared, frame } = useCartesianChart(props, rows);
  const colorOf = (index: number) => paintOf(chartColorOf(series[index], index, props.palette));
  return (
    <ChartFrame {...frame}>
      <RechartsBarChart
        {...(props.stacked && props.isNormalized ? { stackOffset: "expand" as const } : {})}
        data={rows}
        layout={isHorizontal ? "vertical" : "horizontal"}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        barGap={4}
        // A brush puts sliders in the figure, so it is a group then, not an image (axe nested-interactive).
        role={props.showBrush ? "group" : "img"}
        aria-label={label}
      >
        {cartesianParts({
          ...props,
          showBrush: false,
          locale,
          isRtl,
          isHorizontal,
          isBandCursor: true,
        })}
        {compared.map((twin) => (
          <Bar
            key={`previous-${twin.key}`}
            dataKey={twin.key}
            name={twin.label}
            fill={colorOf(twin.index)}
            fillOpacity={0.12}
            stroke={colorOf(twin.index)}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            radius={RADIUS}
            {...(isStacked ? { stackId: "previous" } : {})}
            maxBarSize={48}
            hide={hidden.includes(twin.series.key)}
          />
        ))}
        {series.map((item, index) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.label}
            fill={colorOf(index)}
            radius={cornersOf(index, series.length, isStacked, isHorizontal, isRtl)}
            {...(isStacked ? { stackId: "stack" } : {})}
            maxBarSize={48}
            hide={hidden.includes(item.key)}
          />
        ))}
      </RechartsBarChart>
    </ChartFrame>
  );
}
