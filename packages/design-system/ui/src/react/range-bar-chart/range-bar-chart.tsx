/**
 * Stackra file contract:
 * Purpose: the web `RangeBarChart` on Recharts: one floating bar per category from its low to its high value,
 *          standing (`vertical`, the default) or lying (`horizontal`), with the shared quiet grid, axes, a low and high
 *          tooltip and the data table. Bars are lit softly from the top (flat in a flat brand); with `emphasis` one
 *          bar carries the colour and the rest its soft tone, and the pointed bar stands while the others dim.
 * Boundary: no style of its own: the colour is a `var(--…)` presentation attribute. Categories run right to left in
 *           Arabic and horizontal bars grow from the reading start; animation follows the motion setting.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.3.3; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import { type ReactElement, useId } from "react";
import { Bar, BarChart as RechartsBarChart, Cell, Tooltip } from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { emphasisIndexOf } from "#core/functions/emphasis-index-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { MarkGradient } from "#react/chart/mark-gradient";
import { MARK_PAINT } from "#react/chart/mark-paint.constant";
import { markToneOf } from "#react/chart/mark-tone-of.function";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { usePointedIndex } from "#react/chart/use-pointed-index";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { useUiText } from "#react/hooks/use-ui-text";
import type { RangeBarChartProps } from "#react/range-bar-chart/range-bar-chart.props";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** A finite number, or null for a gap. */
const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Floating bars from a low to a high value. */
export function RangeBarChart(props: RangeBarChartProps): ReactElement {
  const {
    data,
    xKey,
    fromKey,
    toKey,
    label,
    xFormat,
    valueFormat,
    color = "chart-ramp-1",
    height = 240,
  } = props;
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const isHorizontal = props.orientation === "horizontal";
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const category = (raw: unknown) => formatChartCategory(raw, locale, xFormat);
  const fill = paintOf(color);
  const id = useId().replaceAll(/[^\w-]/g, "");
  const { pointed, handlers } = usePointedIndex();
  const emphasis = props.emphasis ?? "none";
  const emphasised = emphasisIndexOf(emphasis, data.length, pointed);
  const rows = data.map((row) => {
    const from = numberOf(row[fromKey]);
    const to = numberOf(row[toKey]);
    return {
      ...row,
      range: from === null || to === null ? null : [Math.min(from, to), Math.max(from, to)],
    };
  });
  const cell = (raw: unknown) => (numberOf(raw) === null ? "" : value(raw as number));
  const table = {
    head: [words.category, t(K.low), t(K.high)],
    rows: data.map((row) => [category(row[xKey]), cell(row[fromKey]), cell(row[toKey])]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={props.className}>
      <RechartsBarChart
        data={rows}
        layout={isHorizontal ? "vertical" : "horizontal"}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        role="img"
        aria-label={label}
        {...handlers}
      >
        <defs>
          <MarkGradient id={`${id}-on`} color={fill} />
          <MarkGradient id={`${id}-off`} color={markToneOf(fill, false)} />
        </defs>
        {cartesianParts({
          xKey,
          xFormat,
          valueFormat,
          showValueAxis: props.showValueAxis ?? true,
          showTooltip: false,
          locale,
          isRtl,
          isHorizontal,
        })}
        {props.showTooltip === false ? null : (
          <Tooltip
            cursor={CHART_PAINT.cursorBand}
            // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for the tooltip, not a component type
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Record<string, unknown> | undefined;
              if (!row) return null;
              return (
                <ChartTooltip
                  active={active}
                  label={row[xKey]}
                  formatLabel={category}
                  formatValue={value}
                  payload={[
                    { name: t(K.high), value: numberOf(row[toKey]), color: fill },
                    { name: t(K.low), value: numberOf(row[fromKey]), color: fill },
                  ]}
                />
              );
            }}
          />
        )}
        <Bar dataKey="range" fill={fill} radius={4} maxBarSize={40} isAnimationActive={!isReduced}>
          {data.map((row, index) => (
            <Cell
              key={String(row[xKey])}
              fill={`url(#${id}-${emphasis === "none" || index === emphasised ? "on" : "off"})`}
              {...(emphasis === "none" || index === emphasised
                ? {}
                : { stroke: MARK_PAINT.contextEdge, strokeWidth: 1 })}
              fillOpacity={
                emphasis !== "none" || pointed === null || pointed === index
                  ? 1
                  : MARK_PAINT.dimOpacity
              }
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ChartFrame>
  );
}
