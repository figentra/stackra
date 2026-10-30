/**
 * Stackra file contract:
 * Purpose: the web `WaffleChart`: parts of a whole as a grid of squares (10 by 10 by default), each part a run of
 *          squares in its series' theme colour handed out by `waffleCellsOf`, filled row by row from the reading
 *          start; under it a legend of each part's name, value and share, and the same numbers as the data table.
 * Boundary: an SVG of rects with presentation attributes, named by the chart's label; squares are mirrored in
 *           right-to-left (they read like text). An empty whole draws the track. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11; STA-1371 (wave D,
 *          owner approval 2026-10-30).
 */
import type { ReactElement } from "react";

import { WAVE_D_CHART_KEYS } from "#core/constants/wave-d-chart-keys.constant";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { waffleCellsOf } from "#core/functions/waffle-cells-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { sliceRowsOf } from "#react/chart/slice-rows-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import type { WaffleChartProps } from "#react/waffle-chart/waffle-chart.props";

/** A square's side and the gap after it, in viewBox units. */
const CELL = 10;
const GAP = 2;

/** Parts of a whole as squares. */
export function WaffleChart({
  data,
  series,
  label,
  nameKey,
  valueKey,
  valueFormat,
  palette = "categorical",
  columns = 10,
  rows = 10,
  showLegend = true,
  className,
}: WaffleChartProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const values = data.map((row) => (typeof row[valueKey] === "number" ? row[valueKey] : 0));
  const total = values.reduce((sum, figure) => sum + Math.max(0, figure), 0);
  const counts = waffleCellsOf(values, columns * rows);
  const parts = sliceRowsOf(data, series, nameKey, palette);
  const shareOf = (figure: number) =>
    formatChartNumber(total > 0 ? Math.max(0, figure) / total : 0, locale, {
      style: "percent",
      maximumFractionDigits: 1,
    });
  const base = chartTableOf({
    data,
    series,
    categoryKey: nameKey,
    valueKey,
    locale,
    valueFormat,
    words,
  });
  const table = {
    head: [...base.head, t(WAVE_D_CHART_KEYS.ui.waffle_chart.share)],
    rows: base.rows.map((row, index) => [...row, shareOf(values[index] ?? 0)]),
  };
  // Each square's part, in fill order; -1 is an empty square.
  const owners = counts.flatMap((count, part) => Array.from({ length: count }, () => part));
  const pitch = CELL + GAP;
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${columns * pitch - GAP} ${rows * pitch - GAP}`}
        className="mx-auto block h-auto w-full"
        style={{ maxWidth: columns * 24 }}
      >
        {Array.from({ length: columns * rows }, (_, index) => {
          const column = index % columns;
          const owner = owners[index] ?? -1;
          const fill = parts[owner]?.["fill"];
          return (
            <rect
              key={index}
              x={(isRtl ? columns - 1 - column : column) * pitch}
              y={Math.floor(index / columns) * pitch}
              width={CELL}
              height={CELL}
              {...(typeof fill === "string" ? { fill } : CHART_PAINT.track)}
            />
          );
        })}
      </svg>
      {showLegend ? (
        <ul
          aria-hidden="true"
          className="m-0 flex list-none flex-wrap justify-center gap-x-5 gap-y-1.5 p-0 text-xs"
        >
          {parts.map((part, index) => (
            <li key={String(part["name"])} className="flex items-center gap-1.5">
              <svg viewBox="0 0 8 8" className="size-2 shrink-0" aria-hidden="true">
                <rect width="8" height="8" fill={String(part["fill"])} />
              </svg>
              <span className="text-muted">{String(part["name"])}</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatChartNumber(values[index] ?? 0, locale, valueFormat)}
              </span>
              <span className="text-muted tabular-nums">{shareOf(values[index] ?? 0)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </ChartFrame>
  );
}
