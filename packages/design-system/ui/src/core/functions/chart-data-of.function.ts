/**
 * Stackra file contract:
 * Purpose: `chartDataOf`, a cartesian chart's rows as a widget's raw `WidgetData`: the category column, one column per
 *          series and, when comparing, one per series' previous period. A `WidgetFrame` around the chart reads it for
 *          "View as table" and the CSV download.
 * Boundary: pure. A missing or non-numeric value is `null`, never a zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); ADR 0302 (decision 3); STA-1371.
 */
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import type { WidgetData } from "#contracts/types/widget-data.type";

/** What `chartDataOf` reads. */
interface ChartDataInput {
  readonly data: readonly ChartDatum[];
  readonly series: readonly ChartSeries[];
  /** The key of each row's category. */
  readonly categoryKey: string;
  /** The category column's header, in the reader's language. */
  readonly categoryLabel: string;
  /** The header of a series' previous-period column; no such columns when left out. */
  readonly compareLabelOf?: ((series: ChartSeries) => string) | undefined;
  /** Carried to the widget's table view. */
  readonly categoryFormat?: Intl.DateTimeFormatOptions | undefined;
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
}

/** A finite number as it is; anything else a gap. */
const cell = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * The raw table of a chart's rows.
 * @example chartDataOf({ data: [{ m: "Jan", a: 1 }], series: [{ key: "a", label: "A" }], categoryKey: "m", categoryLabel: "Month" });
 * // { head: ["Month", "A"], rows: [["Jan", 1]] }
 */
export function chartDataOf(input: ChartDataInput): WidgetData {
  const { data, series, categoryKey, categoryLabel, compareLabelOf } = input;
  const compared = compareLabelOf ? series.filter((item) => item.compareKey !== undefined) : [];
  return {
    ...(input.categoryFormat ? { categoryFormat: input.categoryFormat } : {}),
    ...(input.valueFormat ? { valueFormat: input.valueFormat } : {}),
    head: [
      categoryLabel,
      ...series.map((item) => item.label),
      ...compared.map((item) => compareLabelOf?.(item) ?? item.label),
    ],
    rows: data.map((row) => [
      row[categoryKey] ?? null,
      ...series.map((item) => cell(row[item.key])),
      ...compared.map((item) => cell(row[item.compareKey ?? ""])),
    ]),
  };
}
