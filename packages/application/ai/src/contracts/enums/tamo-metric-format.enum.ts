/**
 * Stackra file contract:
 * Purpose: `TamoMetricFormat`, how a `TamoKpiMetric` value is formatted: a number, money, a percentage or a
 *          duration.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231); the renderer formats in the viewer's locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import { Enum } from "@stackra/contracts";

/** How a key figure is formatted. */
export const TamoMetricFormat = Enum.of({
  /** A plain number. */
  Number: "number",
  /** An amount in the metric's currency. */
  Money: "money",
  /** A percentage. */
  Percent: "percent",
  /** A length of time. */
  Duration: "duration",
});

/** One of the codes above. */
export type TamoMetricFormat = Enum.Value<typeof TamoMetricFormat>;
