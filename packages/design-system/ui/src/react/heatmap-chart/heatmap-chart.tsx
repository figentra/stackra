/**
 * Stackra file contract:
 * Purpose: the web `HeatmapChart`: a grid of cells, one per column and row category, shaded in five steps of one
 *          colour from the smallest value to the largest; pointing at a cell writes its row, column and value above
 *          the grid; the "Less … More" scale sits under it and the values are a data table.
 * Boundary: HTML laid out with CSS grid, so columns run right to left in Arabic on their own; the shades are
 *           `color-mix()` of theme colours.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { heatLevelOf } from "#core/functions/heat-level-of.function";
import { heatmapGridOf } from "#core/functions/heatmap-grid-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { HeatScale } from "#react/chart/heat-scale";
import { heatShadeOf } from "#react/chart/heat-shade-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { HeatmapChartProps } from "#react/heatmap-chart/heatmap-chart.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** A grid of shaded cells. */
export function HeatmapChart({
  data,
  xKey,
  yKey,
  valueKey,
  label,
  valueFormat,
  color = "chart-ramp-1",
  showLegend = true,
  className,
}: HeatmapChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const grid = heatmapGridOf(data, xKey, yKey, valueKey);
  const [pointed, setPointed] = useState<readonly [number, number] | null>(null);
  const value = (figure: number | null | undefined) =>
    typeof figure === "number" ? formatChartNumber(figure, locale, valueFormat) : "";
  const readout = pointed
    ? t(UI_KEYS.ui.chart.cell, {
        row: grid.rows[pointed[0]] ?? "",
        column: grid.columns[pointed[1]] ?? "",
        value: value(grid.cells[pointed[0]]?.[pointed[1]]) || "–",
      })
    : "";
  const table = {
    head: [words.category, ...grid.columns],
    rows: grid.rows.map((row, index) => [row, ...(grid.cells[index] ?? []).map(value)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div role="img" aria-label={label} className="flex flex-col gap-2">
        <p aria-hidden="true" className="m-0 min-h-4 text-xs text-muted tabular-nums">
          {readout}
        </p>
        <div
          className="grid items-center gap-1"
          style={{ gridTemplateColumns: `auto repeat(${grid.columns.length}, minmax(0, 1fr))` }}
          onPointerLeave={() => setPointed(null)}
        >
          <span />
          {grid.columns.map((column) => (
            <span
              key={column}
              aria-hidden="true"
              className="truncate text-center text-[10px] text-muted"
            >
              {column}
            </span>
          ))}
          {grid.rows.map((row, rowIndex) => [
            <span
              key={`row-${row}`}
              aria-hidden="true"
              className="truncate pe-1 text-[10px] text-muted"
            >
              {row}
            </span>,
            ...grid.columns.map((column, columnIndex) => {
              const cell = grid.cells[rowIndex]?.[columnIndex];
              const isPointed = pointed?.[0] === rowIndex && pointed[1] === columnIndex;
              return (
                <span
                  key={`${row}-${column}`}
                  aria-hidden="true"
                  onPointerEnter={() => setPointed([rowIndex, columnIndex])}
                  className={cn(
                    "h-6 rounded-[var(--radius-control-inner)] outline-offset-1",
                    isPointed && "outline-2 outline-foreground",
                  )}
                  style={{
                    backgroundColor: heatShadeOf(heatLevelOf(cell, grid.min, grid.max), color),
                  }}
                />
              );
            }),
          ])}
        </div>
        {showLegend ? <HeatScale color={color} /> : null}
      </div>
    </ChartFrame>
  );
}
