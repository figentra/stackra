/**
 * Stackra file contract:
 * Purpose: the web `AreaChart` on Recharts: one area per series, each edge in the series' theme colour over a fade
 *          to clear, overlapping or stacked, with the shared grid, axes, tooltip, legend and data table.
 * Boundary: no style of its own: colours are `var(--chart-<n>)` presentation attributes. Recharts animates only
 *           without `prefers-reduced-motion`; the plot is an `img` named by `label`, focusable, and arrow keys move
 *           the tooltip from row to row.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import { type ReactElement, useId } from "react";
import { Area, AreaChart as RechartsAreaChart } from "recharts";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import type { AreaChartProps } from "#react/area-chart/area-chart.props";
import { activeDotOf } from "#react/chart/active-dot-of.function";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useCartesianChart } from "#react/chart/use-cartesian-chart";

/** Overlapping or stacked areas over a category axis. */
export function AreaChart(props: AreaChartProps): ReactElement {
  const { data, series, label, height = 240, curve = "monotone" } = props;
  const { locale, isRtl, hidden, compared, brushLabel, frame } = useCartesianChart(props);
  const id = useId().replaceAll(/[^\w-]/g, "");
  const colorOf = (index: number) => paintOf(chartColorOf(series[index], index, props.palette));
  return (
    <ChartFrame {...frame}>
      <RechartsAreaChart
        {...(props.stacked && props.isNormalized ? { stackOffset: "expand" as const } : {})}
        data={[...data]}
        responsive
        style={{ width: "100%", height: height + (props.showBrush ? 32 : 0) }}
        margin={{ top: 8, left: 12, right: 12 }}
        // A brush puts sliders in the figure, so it is a group then, not an image (axe nested-interactive).
        role={props.showBrush ? "group" : "img"}
        aria-label={label}
      >
        <defs>
          {series.map((item, index) => (
            <linearGradient key={item.key} id={`${id}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorOf(index)} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colorOf(index)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {cartesianParts({ ...props, brushLabel, locale, isRtl })}
        {compared.map((twin) => (
          <Area
            key={`previous-${twin.key}`}
            dataKey={twin.key}
            name={twin.label}
            type={curve}
            stroke={colorOf(twin.index)}
            strokeWidth={1.5}
            strokeOpacity={0.7}
            strokeDasharray="5 4"
            fill="none"
            activeDot={false}
            hide={hidden.includes(twin.series.key)}
          />
        ))}
        {series.map((item, index) => (
          <Area
            key={item.key}
            dataKey={item.key}
            name={item.label}
            type={curve}
            stroke={colorOf(index)}
            strokeWidth={2}
            fill={`url(#${id}-${index})`}
            activeDot={activeDotOf(colorOf(index))}
            {...(props.stacked ? { stackId: "stack" } : {})}
            connectNulls={false}
            hide={hidden.includes(item.key)}
          />
        ))}
      </RechartsAreaChart>
    </ChartFrame>
  );
}
