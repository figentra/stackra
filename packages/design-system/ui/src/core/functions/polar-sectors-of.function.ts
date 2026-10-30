/**
 * Stackra file contract:
 * Purpose: `polarSectorsOf`, the slices of a polar area (Nightingale rose) chart: each row an equal angle clockwise
 *          from the top, split evenly between the series, each slice's radius its value over the largest value.
 * Boundary: pure; a missing, negative or non-numeric value draws no slice (share 0) and stays undefined.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same geometry on web and native); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import type { PolarSector } from "#core/types/polar-sector.type";

/** A cell's number, or undefined when it is not a finite one at or above zero. */
const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/**
 * The slices of a polar area chart, row by row then series by series.
 * @example polarSectorsOf([{ m: "Jan", a: 2 }, { m: "Feb", a: 4 }], [{ key: "a", label: "A" }])[0]; // { row: 0, series: 0, start: 0, end: Math.PI, share: 0.5, value: 2 }
 */
export function polarSectorsOf(
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
): readonly PolarSector[] {
  const max = Math.max(
    0,
    ...data.flatMap((row) => series.map((item) => numberOf(row[item.key]) ?? 0)),
  );
  const step = (Math.PI * 2) / Math.max(1, data.length);
  const slot = step / Math.max(1, series.length);
  return data.flatMap((row, rowIndex) =>
    series.map((item, seriesIndex) => {
      const value = numberOf(row[item.key]);
      const start = rowIndex * step + seriesIndex * slot;
      return {
        row: rowIndex,
        series: seriesIndex,
        start,
        end: start + slot,
        share: max > 0 && value !== undefined ? value / max : 0,
        value,
      };
    }),
  );
}
