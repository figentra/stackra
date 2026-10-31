/**
 * Stackra file contract:
 * Purpose: `ChartFrame`, the figure every web chart draws in: the plot (an `img` named by the chart's label), the
 *          legend, and the same numbers as a data table that only assistive technology reads.
 * Boundary: layout and the table only; the plot is the caller's. No colour of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { ChartLegend } from "#react/chart-legend/chart-legend";
import type { ChartFrameProps } from "#react/chart/chart-frame.props";

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** A plot with its legend and its data table. */
export function ChartFrame({
  label,
  table,
  legend,
  palette,
  onToggle,
  hiddenKeys,
  showComparison,
  notes = NONE,
  className,
  children,
}: ChartFrameProps): ReactElement {
  return (
    <figure data-slot="chart" className={cn("m-0 flex w-full min-w-0 flex-col gap-3", className)}>
      {children}
      {legend.length > 0 ? (
        <ChartLegend
          series={legend}
          palette={palette}
          onToggle={onToggle}
          hiddenKeys={hiddenKeys}
          showComparison={showComparison}
        />
      ) : null}
      <table className="sr-only" data-slot="chart-table">
        <caption>{label}</caption>
        <thead>
          <tr>
            {table.head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join("\u001F")}>
              {row.map((cell, column) =>
                column === 0 ? (
                  <th key={table.head[column]} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={table.head[column]}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {notes.length > 0 ? (
        <ul className="sr-only">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
