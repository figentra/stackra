/**
 * Stackra file contract:
 * Purpose: `renderKpiPart`, the default renderer of a `data-tamo-kpi` part: one figure as a @stackra/ui `Kpi`, several
 *          as `Stat`s in a `KpiGroup`. A `number` figure is drawn by the Stat (locale digits, the previous period's
 *          line, the trend); a `money` (in its currency), `percent` or `duration` figure is written first and shows
 *          its trend against the previous figure.
 * Boundary: pure over the part's data, read defensively: a metric without a string label and a finite number value is
 *           skipped, and a part with none draws nothing. Percentages are fractions (0.12 is 12%), money is in major
 *           units and durations are seconds, as @stackra/ui's value components read them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import { Kpi, KpiGroup, Stat } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { TamoMetricFormat } from "#contracts/enums/tamo-metric-format.enum";

/** One figure as a Stat draws it. */
interface Figure {
  readonly label: string;
  readonly value: number | string;
  readonly previousValue?: number | undefined;
  readonly trend?: number | undefined;
}

/** The value as an object's fields, else undefined. */
const fieldsIn = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;

/** The value when it is a finite number, else undefined. */
const numberIn = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** A duration in seconds in its largest whole unit: "2.5 hours", "40 minutes", "12 seconds". */
const durationOf = (seconds: number): string => {
  const [unit, size] =
    Math.abs(seconds) >= 3600
      ? (["hour", 3600] as const)
      : Math.abs(seconds) >= 60
        ? (["minute", 60] as const)
        : (["second", 1] as const);
  // shortcut: the runtime's default locale (this package reads no DesignSystemProvider); pass one in for Arabic digits.
  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit,
    unitDisplay: "long",
    maximumFractionDigits: 1,
  }).format(seconds / size);
};

/** The figure written by its format, or undefined for a plain number (the Stat writes it). */
const writtenOf = (value: number, format: unknown, currency: unknown): string | undefined => {
  if (format === TamoMetricFormat.Money && typeof currency === "string")
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  if (format === TamoMetricFormat.Percent)
    return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(
      value,
    );
  if (format === TamoMetricFormat.Duration) return durationOf(value);
  return undefined;
};

/** One metric as a figure, or undefined when it has no label or value. */
const statOf = (entry: unknown): Figure | undefined => {
  const metric = fieldsIn(entry);
  const label = metric?.["label"];
  const value = numberIn(metric?.["value"]);
  if (typeof label !== "string" || value === undefined) return undefined;
  const previous = numberIn(metric?.["previous"]);
  let written: string | undefined;
  try {
    written = writtenOf(value, metric?.["format"], metric?.["currency"]);
  } catch {
    // an unknown currency code; the figure is drawn as a plain number
    written = undefined;
  }
  if (written === undefined) return { label, value, previousValue: previous };
  return {
    label,
    value: written,
    trend:
      previous === undefined || previous === 0
        ? undefined
        : (value - previous) / Math.abs(previous),
  };
};

/**
 * A KPI part as a Kpi or a KpiGroup of Stats, or null when no metric is drawable.
 *
 * @example
 * renderKpiPart({ metrics: [{ label: "Revenue", value: 1200, previous: 1000, format: "money", currency: "SAR" }] })
 */
export function renderKpiPart(data: unknown): ReactNode {
  const metrics: unknown = fieldsIn(data)?.["metrics"];
  if (!Array.isArray(metrics)) return null;
  const stats = metrics.flatMap((entry: unknown) => {
    const stat = statOf(entry);
    return stat === undefined ? [] : [stat];
  });
  const [only] = stats;
  if (only === undefined) return null;
  if (stats.length === 1) return <Kpi {...only} />;
  return (
    // the part names no band, so its figures' labels name it
    <KpiGroup label={stats.map((stat) => stat.label).join(", ")}>
      {stats.map((stat) => (
        <Stat key={stat.label} {...stat} />
      ))}
    </KpiGroup>
  );
}
