/**
 * Stackra file contract:
 * Purpose: the web `WaterfallChart` on Recharts: a bridge from a start total to an end total, each step a bar floating
 *          from the running total by its change, joined to the next by a dashed connector at the running total. Rises
 *          and falls are drawn in the success and danger soft steps with a solid outline, totals in the accent lit
 *          softly from the top; the pointed bar stands while the others dim. With the quiet grid and value axis, a
 *          tooltip giving the change and the running total, and the data table.
 * Boundary: no style of its own; the bars are Recharts range bars. The categories run right to left in Arabic and the
 *           value axis sits on the reading start. A change is also written with its sign, so it never rests on colour.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import { type ReactElement, useId } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { WATERFALL_COLOR } from "#core/constants/waterfall-color.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { waterfallRowsOf } from "#core/functions/waterfall-rows-of.function";
import type { WaterfallRow } from "#core/types/waterfall-row.type";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { MarkGradient } from "#react/chart/mark-gradient";
import { MARK_PAINT } from "#react/chart/mark-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { usePointedIndex } from "#react/chart/use-pointed-index";
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
  const id = useId().replaceAll(/[^\w-]/g, "");
  const { pointed, handlers } = usePointedIndex();
  // A total is a lit solid bar; a step is its status colour's soft step (the hover step while pointed) in an outline.
  const fillOf = (row: WaterfallRow, index: number) =>
    row.kind === "total"
      ? `url(#${id}-total)`
      : paintOf(
          `${row.kind === "up" ? "success" : "danger"}-soft${pointed === index ? "-hover" : ""}`,
        );
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <BarChart
        data={rows}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        role="img"
        aria-label={label}
        {...handlers}
      >
        <defs>
          <MarkGradient id={`${id}-total`} color={paintOf(WATERFALL_COLOR.total)} />
        </defs>
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
        {/* Each bar's running total carries on to the next bar: a dashed connector behind the bars. */}
        {rows.slice(1).map((next, index) => {
          const total = rows[index]?.total ?? 0;
          return (
            <ReferenceLine
              key={`connector-${next.key}`}
              segment={[
                { x: rows[index]?.label ?? next.label, y: total },
                { x: next.label, y: total },
              ]}
              stroke={paintOf("muted")}
              strokeOpacity={0.6}
              strokeDasharray="3 3"
            />
          );
        })}
        <Bar
          dataKey={(row: WaterfallRow) => [row.low, row.high]}
          radius={4}
          maxBarSize={48}
          isAnimationActive={!isReduced}
        >
          {rows.map((row, index) => (
            <Cell
              key={row.key}
              fill={fillOf(row, index)}
              stroke={paintOf(WATERFALL_COLOR[row.kind])}
              strokeWidth={row.kind === "total" ? 0 : 1.5}
              opacity={pointed === null || pointed === index ? 1 : MARK_PAINT.dimOpacity}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
