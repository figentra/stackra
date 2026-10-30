/**
 * Stackra file contract:
 * Purpose: the web `LineChart` on Recharts: one line per series in its theme colour, dots optional, with the shared
 *          grid, axes, tooltip, legend and data table.
 * Boundary: no style of its own: colours are `var(--chart-<n>)` presentation attributes. Recharts animates only
 *           without `prefers-reduced-motion`; the plot is an `img` named by `label`, focusable, and arrow keys move
 *           the tooltip from row to row. A gap in the data breaks the line. The legend hides and shows series; the
 *           previous period draws dashed; references and a brush come from the shared parts.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";
import { Line, LineChart as RechartsLineChart } from "recharts";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { activeDotOf } from "#react/chart/active-dot-of.function";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useCartesianChart } from "#react/chart/use-cartesian-chart";
import type { LineChartProps } from "#react/line-chart/line-chart.props";

/** Lines over a category axis. */
export function LineChart(props: LineChartProps): ReactElement {
  const { data, series, label, height = 240, curve = "monotone" } = props;
  const { locale, isRtl, hidden, compared, brushLabel, frame } = useCartesianChart(props);
  const colorOf = (index: number) => paintOf(chartColorOf(series[index], index, props.palette));
  return (
    <ChartFrame {...frame}>
      <RechartsLineChart
        data={[...data]}
        responsive
        style={{ width: "100%", height: height + (props.showBrush ? 32 : 0) }}
        margin={{ top: 8, left: 12, right: 12 }}
        // A brush puts sliders in the figure, so it is a group then, not an image (axe nested-interactive).
        role={props.showBrush ? "group" : "img"}
        aria-label={label}
      >
        {cartesianParts({ ...props, brushLabel, locale, isRtl, indicator: "line" })}
        {compared.map((twin) => (
          <Line
            key={`previous-${twin.key}`}
            dataKey={twin.key}
            name={twin.label}
            type={curve}
            stroke={colorOf(twin.index)}
            strokeWidth={1.5}
            strokeOpacity={0.7}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            hide={hidden.includes(twin.series.key)}
          />
        ))}
        {series.map((item, index) => {
          const color = colorOf(index);
          return (
            <Line
              key={item.key}
              dataKey={item.key}
              name={item.label}
              type={curve}
              stroke={color}
              strokeWidth={2}
              dot={props.showDots ? { fill: color, r: 3 } : false}
              activeDot={activeDotOf(color)}
              hide={hidden.includes(item.key)}
            />
          );
        })}
      </RechartsLineChart>
    </ChartFrame>
  );
}
