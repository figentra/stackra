/**
 * Stackra file contract:
 * Purpose: the web `WaterfallChart` on Recharts: a bridge from a start total to an end total, each step a bar floating
 *          from the running total by its change, rises in success and falls in danger, totals in the accent, with the
 *          quiet grid and value axis, a tooltip giving the change and the running total, and the data table.
 * Boundary: no style of its own; the bars are Recharts range bars. The categories run right to left in Arabic and the
 *           value axis sits on the reading start. A change is also written with its sign, so it never rests on colour.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { WATERFALL_COLOR } from "#core/constants/waterfall-color.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { waterfallRowsOf } from "#core/functions/waterfall-rows-of.function";
import type { WaterfallRow } from "#core/types/waterfall-row.type";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { useUiText } from "#react/hooks/use-ui-text";
import type { WaterfallChartProps } from "#react/waterfall-chart/waterfall-chart.props";

/** A bridge from one total to the next. */
export function WaterfallChart({
  start,
  steps,
  endLabel,
  label,
  valueFormat,
  height = 240,
  showTooltip = true,
  className,
}: WaterfallChartProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const rows = waterfallRowsOf(start, steps, endLabel);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const signed = (figure: number) =>
    formatChartNumber(figure, locale, { ...valueFormat, signDisplay: "exceptZero" });
  const table = {
    head: [words.category, t(UI_KEYS.ui.chart.change), t(UI_KEYS.ui.chart.total)],
    rows: rows.map((row) => [
      row.label,
      row.kind === "total" ? "" : signed(row.value),
      value(row.total),
    ]),
  };
  const side = isRtl ? ("right" as const) : ("left" as const);
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <BarChart
        data={rows}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        role="img"
        aria-label={label}
      >
        <CartesianGrid {...CHART_PAINT.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={CHART_PAINT.tick}
          interval={0}
          reversed={isRtl}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={isRtl ? { ...CHART_PAINT.tick, textAnchor: "end" } : CHART_PAINT.tick}
          tickFormatter={(figure: number) =>
            formatChartNumber(figure, locale, { notation: "compact", ...valueFormat })
          }
          orientation={side}
          width="auto"
        />
        {showTooltip ? (
          <Tooltip
            cursor={CHART_PAINT.cursorBand}
            // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for the tooltip, not a component type
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as WaterfallRow | undefined;
              if (!active || !row) return null;
              const color = paintOf(WATERFALL_COLOR[row.kind]);
              return (
                <ChartTooltip
                  active
                  label={row.label}
                  formatLabel={String}
                  payload={[
                    ...(row.kind === "total"
                      ? []
                      : [{ name: t(UI_KEYS.ui.chart.change), value: signed(row.value), color }]),
                    { name: t(UI_KEYS.ui.chart.total), value: value(row.total), color },
                  ]}
                />
              );
            }}
          />
        ) : null}
        <Bar
          dataKey={(row: WaterfallRow) => [row.low, row.high]}
          radius={4}
          maxBarSize={48}
          isAnimationActive={!isReduced}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={paintOf(WATERFALL_COLOR[row.kind])} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
