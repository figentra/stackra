/**
 * Stackra file contract:
 * Purpose: `chartTableOf`, a chart's numbers as written text (`ChartTable`): the web's data table and the source of
 *          native's spoken text. A cartesian or radar chart gives one column per series; a pie or radial chart
 *          (`valueKey` set) gives one row per slice, named by its series' label.
 * Boundary: pure. A missing or non-numeric value is an empty cell, never a zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0192 (digits); ADR 0060 (Arabic); STA-1371.
 */
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import type { ChartTable } from "#contracts/types/chart-table.type";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";

/** What `chartTableOf` reads. */
interface ChartTableInput {
  readonly data: readonly ChartDatum[];
  readonly series: readonly ChartSeries[];
  /** The key of each row's category (`xKey`, or `nameKey` for a pie). */
  readonly categoryKey: string;
  /** A pie's or radial chart's value key; a cartesian chart has none. */
  readonly valueKey?: string | undefined;
  readonly locale: string;
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  readonly categoryFormat?: Intl.DateTimeFormatOptions | undefined;
  /** The headers of the category column and, for a pie, the value column, in the reader's language. */
  readonly words: { readonly category: string; readonly value: string };
}

/** The chart's data as a table of written text. */
export function chartTableOf(input: ChartTableInput): ChartTable {
  const { data, series, categoryKey, valueKey, locale, valueFormat, categoryFormat, words } = input;
  const cell = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? formatChartNumber(value, locale, valueFormat)
      : "";
  if (valueKey !== undefined)
    return {
      head: [words.category, words.value],
      rows: data.map((row) => {
        const name = row[categoryKey];
        const label = series.find((item) => item.key === name)?.label;
        return [label ?? formatChartCategory(name, locale, categoryFormat), cell(row[valueKey])];
      }),
    };
  return {
    head: [words.category, ...series.map((item) => item.label)],
    rows: data.map((row) => [
      formatChartCategory(row[categoryKey], locale, categoryFormat),
      ...series.map((item) => cell(row[item.key])),
    ]),
  };
}
