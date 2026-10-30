/**
 * Stackra file contract:
 * Purpose: the web `HistogramChart` on Recharts: raw values counted into equal bins (`histogramBinsOf`), one touching
 *          column per bin labelled by its edges ("10–20"), with the shared quiet grid, axes, tooltip and data table.
 * Boundary: no style of its own: the colour is a `var(--chart-ramp-1)` presentation attribute. The bins run right to
 *           left in Arabic like every category axis; animation follows the motion setting.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.3.3; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { Bar, BarChart as RechartsBarChart } from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { histogramBinsOf } from "#core/functions/histogram-bins-of.function";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { HistogramChartProps } from "#react/histogram-chart/histogram-chart.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** Counts of values in equal bins. */
export function HistogramChart(props: HistogramChartProps): ReactElement {
  const { values, label, valueFormat, color = "chart-ramp-1", height = 240 } = props;
  const { locale, isRtl } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const edge = (value: number) =>
    formatChartNumber(value, locale, { maximumFractionDigits: 1, ...valueFormat });
  const rows = histogramBinsOf(values, { binCount: props.binCount, binWidth: props.binWidth }).map(
    (bin) => ({
      bin: `${edge(bin.from)}–${edge(bin.to)}`,
      count: bin.count,
    }),
  );
  const table = {
    head: [t(K.bin), t(K.count)],
    rows: rows.map((row) => [row.bin, formatChartNumber(row.count, locale)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={props.className}>
      <RechartsBarChart
        data={rows}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        barCategoryGap={1}
        role="img"
        aria-label={label}
      >
        {cartesianParts({
          xKey: "bin",
          showValueAxis: props.showValueAxis,
          showTooltip: props.showTooltip,
          locale,
          isRtl,
          isBandCursor: true,
        })}
        <Bar
          dataKey="count"
          name={t(K.count)}
          fill={paintOf(color)}
          radius={[2, 2, 0, 0]}
          isAnimationActive={!isReduced}
        />
      </RechartsBarChart>
    </ChartFrame>
  );
}
