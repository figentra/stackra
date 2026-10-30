/**
 * Stackra file contract:
 * Purpose: the web `BoxPlotChart` on Recharts: one vertical box per group over a category axis, from its lower to
 *          upper quartile with the median across it, Tukey whiskers to the furthest values within 1.5 IQR and each
 *          outlier as a ring; the shared quiet grid and axes, a summary tooltip and the data table.
 * Boundary: no style of its own: colours are `var(--…)` presentation attributes. Each group is drawn by one range bar
 *           over its whole extent, whose shape places the quartiles on the same linear scale. Groups run right to left
 *           in Arabic; animation follows the motion setting.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.3.3; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { Bar, BarChart as RechartsBarChart, Tooltip } from "recharts";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { boxStatsOf } from "#core/functions/box-stats-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import type { BoxStats } from "#core/types/box-stats.type";
import type { BoxPlotChartProps } from "#react/box-plot-chart/box-plot-chart.props";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { cartesianParts } from "#react/chart/cartesian-parts";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { useUiText } from "#react/hooks/use-ui-text";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** The widest a box is drawn, in pixels. */
const BOX_WIDTH = 48;

/** One drawn group. */
interface BoxRow {
  readonly name: string;
  readonly extent: readonly [number, number];
  readonly stats: BoxStats;
  readonly color: string;
}

/** The SVG of one box, placed by Recharts' range bar over the group's whole extent. */
function BoxShape(props: {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly payload?: BoxRow;
}): ReactElement | null {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const [low, high] = payload.extent;
  const at = (value: number) =>
    high === low ? y + height / 2 : y + ((high - value) / (high - low)) * height;
  const box = Math.min(width, BOX_WIDTH);
  const left = x + (width - box) / 2;
  const middle = x + width / 2;
  const { stats, color } = payload;
  return (
    <g>
      <line
        x1={middle}
        x2={middle}
        y1={at(stats.high)}
        y2={at(stats.q3)}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={middle}
        x2={middle}
        y1={at(stats.q1)}
        y2={at(stats.low)}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={middle - box / 4}
        x2={middle + box / 4}
        y1={at(stats.high)}
        y2={at(stats.high)}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={middle - box / 4}
        x2={middle + box / 4}
        y1={at(stats.low)}
        y2={at(stats.low)}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={left}
        y={at(stats.q3)}
        width={box}
        height={Math.max(1, at(stats.q1) - at(stats.q3))}
        rx={3}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={left}
        x2={left + box}
        y1={at(stats.median)}
        y2={at(stats.median)}
        stroke={color}
        strokeWidth={2.5}
      />
      {stats.outliers.map((value, index) => (
        <circle
          // oxlint-disable-next-line react/no-array-index-key -- outlier values may repeat; the dots are a static paint list
          key={index}
          cx={middle}
          cy={at(value)}
          r={3}
          fill={CHART_PAINT.surface}
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

/** One box per group. */
export function BoxPlotChart(props: BoxPlotChartProps): ReactElement {
  const { groups, label, valueFormat, palette, height = 240 } = props;
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const rows = groups.flatMap((group, index): BoxRow[] => {
    const stats = boxStatsOf(group.values);
    return stats
      ? [
          {
            name: group.label,
            extent: [stats.min, stats.max],
            stats,
            color: paintOf(chartColorOf(group, index, palette)),
          },
        ]
      : [];
  });
  const parts = [t(K.minimum), t(K.lower_quartile), t(K.median), t(K.upper_quartile), t(K.maximum)];
  const table = {
    head: [words.category, ...parts, t(K.outliers)],
    rows: rows.map(({ name, stats }) => [
      name,
      ...[stats.min, stats.q1, stats.median, stats.q3, stats.max].map(value),
      stats.outliers.map(value).join(isRtl ? "، " : ", "),
    ]),
  };
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={[]}
      palette={palette}
      className={props.className}
    >
      <RechartsBarChart
        data={rows}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        role="img"
        aria-label={label}
      >
        {cartesianParts({
          xKey: "name",
          valueFormat,
          showValueAxis: props.showValueAxis ?? true,
          showTooltip: false,
          locale,
          isRtl,
        })}
        {props.showTooltip === false ? null : (
          <Tooltip
            cursor={CHART_PAINT.cursorBand}
            // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for the tooltip, not a component type
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as BoxRow | undefined;
              if (!row) return null;
              const { stats } = row;
              return (
                <ChartTooltip
                  active={active}
                  label={row.name}
                  formatLabel={String}
                  formatValue={value}
                  payload={[stats.max, stats.q3, stats.median, stats.q1, stats.min].map(
                    (figure, index) => ({
                      name: parts[4 - index],
                      value: figure,
                      color: row.color,
                    }),
                  )}
                />
              );
            }}
          />
        )}
        <Bar dataKey="extent" shape={BoxShape} isAnimationActive={!isReduced} />
      </RechartsBarChart>
    </ChartFrame>
  );
}
