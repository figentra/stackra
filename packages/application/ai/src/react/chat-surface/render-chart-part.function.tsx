/**
 * Stackra file contract:
 * Purpose: `renderChartPart`, the default renderer of a `data-tamo-chart` part: the @stackra/ui chart of its kind
 *          (`BarChart`, `LineChart`, `AreaChart`, `PieChart`, `DonutChart`, `ScatterChart`) over its rows, with the x
 *          field as the category and its series in legend order. A pie or donut plots the first series, one slice per
 *          row named by its x value; a scatter plots the first series against the x field.
 * Boundary: pure over the part's data, read defensively: an unknown kind, no x field, no series or no rows list draws
 *           nothing. The chart carries its numbers as a captioned data table too, named by the series' labels.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import type { ChartDatum, ChartSeries } from "@stackra/ui/contracts";
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  PieChart,
  ScatterChart,
} from "@stackra/ui/react";
import type { ReactNode } from "react";

import { TamoChartKind } from "#contracts/enums/tamo-chart-kind.enum";

/** The value as an object's fields, else undefined. */
const fieldsIn = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;

/** The part's series that carry a string field and label, as chart series. */
const seriesOf = (value: unknown): ChartSeries[] =>
  Array.isArray(value)
    ? value.flatMap((entry: unknown) => {
        const series = fieldsIn(entry);
        return typeof series?.["field"] === "string" && typeof series["label"] === "string"
          ? [{ key: series["field"], label: series["label"] }]
          : [];
      })
    : [];

/**
 * A chart part as the chart of its kind, or null when a required field is missing.
 *
 * @example
 * renderChartPart({ kind: "bar", x: "month", series: [{ field: "sales", label: "Sales" }], rows })
 */
export function renderChartPart(data: unknown): ReactNode {
  const fields = fieldsIn(data);
  const kind = fields?.["kind"];
  const x = fields?.["x"];
  const series = seriesOf(fields?.["series"]);
  const entries: unknown = fields?.["rows"];
  const first = series[0];
  if (typeof x !== "string" || first === undefined || !Array.isArray(entries)) return null;
  const rows = entries.flatMap((entry: unknown) => {
    const row = fieldsIn(entry);
    return row === undefined ? [] : [row as ChartDatum];
  });
  const label = series.map((item) => item.label).join(", ");
  if (kind === TamoChartKind.Bar)
    return <BarChart data={rows} series={series} xKey={x} label={label} />;
  if (kind === TamoChartKind.Line)
    return <LineChart data={rows} series={series} xKey={x} label={label} />;
  if (kind === TamoChartKind.Area)
    return <AreaChart data={rows} series={series} xKey={x} label={label} />;
  if (kind === TamoChartKind.Scatter)
    return (
      <ScatterChart
        data={rows}
        series={[first]}
        xKey={x}
        yKey={first.key}
        xLabel={x}
        yLabel={first.label}
        label={label}
      />
    );
  if (kind !== TamoChartKind.Pie && kind !== TamoChartKind.Donut) return null;
  // a pie's series are its slices: one per row, named by its x value
  const slices = rows.map((row) => String(row[x] ?? ""));
  const pie = {
    data: rows.map((row, index) => ({ ...row, [x]: slices[index] })),
    series: [...new Set(slices)].map((slice) => ({ key: slice, label: slice })),
    nameKey: x,
    valueKey: first.key,
    label: first.label,
  };
  return kind === TamoChartKind.Pie ? <PieChart {...pie} /> : <DonutChart {...pie} />;
}
