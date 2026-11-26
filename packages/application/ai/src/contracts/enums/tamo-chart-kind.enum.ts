/**
 * Stackra file contract:
 * Purpose: `TamoChartKind`, the closed list of charts a `TamoChartPart` asks for: bar, line, area, pie, donut and
 *          scatter.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231); the host's chart renderer maps each to a chart.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import { Enum } from "@stackra/contracts";

/** The chart a chart part is drawn as. */
export const TamoChartKind = Enum.of({
  /** Bars per category. */
  Bar: "bar",
  /** A line over the x field. */
  Line: "line",
  /** A filled line over the x field. */
  Area: "area",
  /** Shares of a whole. */
  Pie: "pie",
  /** Shares of a whole, with a hole. */
  Donut: "donut",
  /** Points by two values. */
  Scatter: "scatter",
});

/** One of the codes above. */
export type TamoChartKind = Enum.Value<typeof TamoChartKind>;
