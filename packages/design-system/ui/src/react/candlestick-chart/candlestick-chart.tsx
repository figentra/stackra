/**
 * Stackra file contract:
 * Purpose: the web `CandlestickChart` on Recharts: one candle per period, a wick from low to high and a body from open
 *          to close (a rise hollow in success, a fall filled in danger, so the direction never rests on colour), with
 *          volume bars along the bottom quarter, the quiet grid and price axis, a tooltip of the open, high, low,
 *          close and volume, and the data table.
 * Boundary: no style of its own. The periods run right to left in Arabic and the price axis sits on the reading start.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11; STA-1371.
 */
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from "recharts";

import type { CandleDatum } from "#contracts/types/candle-datum.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import type { CandlestickChartProps } from "#react/candlestick-chart/candlestick-chart.props";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { useUiText } from "#react/hooks/use-ui-text";

/** A row as Recharts reads it: the candle and its low-to-high range. */
type CandleRow = CandleDatum & { readonly range: readonly [number, number] };

/** The shape Recharts hands a custom bar. */
interface BarShape {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly payload?: CandleRow;
}

/** One candle drawn in the range bar's box: the wick through the middle and the body from open to close. */
function Candle({ x = 0, y = 0, width = 0, height = 0, payload }: BarShape): ReactElement | null {
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const span = high - low;
  const at = (price: number) => (span === 0 ? y : y + ((high - price) / span) * height);
  const isRise = close >= open;
  const color = paintOf(isRise ? "success" : "danger");
  const body = Math.max(width * 0.64, 3);
  const top = at(Math.max(open, close));
  const centre = x + width / 2;
  return (
    <g>
      <line x1={centre} x2={centre} y1={y} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect
        x={centre - body / 2}
        y={top}
        width={body}
        height={Math.max(at(Math.min(open, close)) - top, 1.5)}
        rx={1.5}
        fill={isRise ? CHART_PAINT.surface : color}
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  );
}

/** Candles of open, high, low and close, with volume. */
export function CandlestickChart({
  data,
  label,
  xFormat,
  valueFormat,
  showVolume,
  height = 280,
  showTooltip = true,
  className,
}: CandlestickChartProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion() === true;
  const hasVolume = showVolume ?? data.some((row) => typeof row.volume === "number");
  const rows: CandleRow[] = data.map((row) => ({ ...row, range: [row.low, row.high] }));
  const price = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const count = (figure: number) => formatChartNumber(figure, locale, { notation: "compact" });
  const period = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const K = UI_KEYS.ui.chart;
  const table = {
    head: [
      words.category,
      t(K.open),
      t(K.high),
      t(K.low),
      t(K.close),
      ...(hasVolume ? [t(K.volume)] : []),
    ],
    rows: data.map((row) => [
      period(row.date),
      price(row.open),
      price(row.high),
      price(row.low),
      price(row.close),
      ...(hasVolume ? [typeof row.volume === "number" ? count(row.volume) : ""] : []),
    ]),
  };
  const maxVolume = Math.max(1, ...data.map((row) => row.volume ?? 0));
  const side = isRtl ? ("right" as const) : ("left" as const);
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <ComposedChart
        data={rows}
        responsive
        style={{ width: "100%", height }}
        margin={{ top: 8, left: 12, right: 12 }}
        barCategoryGap="20%"
        // The volume bar and the candle share each period's slot instead of standing side by side.
        barGap="-100%"
        role="img"
        aria-label={label}
      >
        <CartesianGrid {...CHART_PAINT.grid} vertical={false} yAxisId="price" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tick={CHART_PAINT.tick}
          tickFormatter={period}
          reversed={isRtl}
        />
        <YAxis
          yAxisId="price"
          domain={["auto", "auto"]}
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
        {/* Volume reads on its own scale, kept to the bottom quarter so it never covers the candles. */}
        <YAxis yAxisId="volume" hide domain={[0, maxVolume * 4]} />
        {showTooltip ? (
          <Tooltip
            cursor={CHART_PAINT.cursorBand}
            // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for the tooltip, not a component type
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as CandleRow | undefined;
              if (!active || !row) return null;
              const color = paintOf(row.close >= row.open ? "success" : "danger");
              return (
                <ChartTooltip
                  active
                  label={row.date}
                  formatLabel={period}
                  payload={[
                    { name: t(K.open), value: price(row.open), color },
                    { name: t(K.high), value: price(row.high), color },
                    { name: t(K.low), value: price(row.low), color },
                    { name: t(K.close), value: price(row.close), color },
                    ...(hasVolume && typeof row.volume === "number"
                      ? [{ name: t(K.volume), value: count(row.volume), color: paintOf("muted") }]
                      : []),
                  ]}
                />
              );
            }}
          />
        ) : null}
        {hasVolume ? (
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill={paintOf("muted")}
            fillOpacity={0.22}
            radius={2}
            isAnimationActive={!isReduced}
          />
        ) : null}
        <Bar
          yAxisId="price"
          dataKey="range"
          // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback Recharts calls for each bar, not a component type
          shape={(shape: unknown) => <Candle {...(shape as BarShape)} />}
          isAnimationActive={!isReduced}
        />
      </ComposedChart>
    </ChartFrame>
  );
}
