/**
 * Stackra file contract:
 * Purpose: `heatmapGridOf`, a heatmap's rows as a grid: the column and row categories in first-seen order, each
 *          cell's value (null for a gap), and the smallest and largest values the shades span.
 * Boundary: pure. A repeated cell keeps its last value.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { HeatmapGrid } from "#core/types/heatmap-grid.type";

/**
 * The grid of `data`.
 * @example heatmapGridOf([{ d: "Mon", h: "9", n: 3 }], "h", "d", "n"); // { columns: ["9"], rows: ["Mon"], cells: [[3]], min: 3, max: 3 }
 */
export function heatmapGridOf(
  data: readonly ChartDatum[],
  xKey: string,
  yKey: string,
  valueKey: string,
): HeatmapGrid {
  const columns: string[] = [];
  const rows: string[] = [];
  for (const row of data) {
    const x = String(row[xKey] ?? "");
    const y = String(row[yKey] ?? "");
    if (!columns.includes(x)) columns.push(x);
    if (!rows.includes(y)) rows.push(y);
  }
  const cells = rows.map(() => columns.map((): number | null => null));
  const values: number[] = [];
  for (const row of data) {
    const value = row[valueKey];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const line = cells[rows.indexOf(String(row[yKey] ?? ""))];
    if (line) line[columns.indexOf(String(row[xKey] ?? ""))] = value;
    values.push(value);
  }
  return {
    columns,
    rows,
    cells,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
  };
}
