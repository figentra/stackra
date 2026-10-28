/**
 * Stackra file contract:
 * Purpose: `ReportMetric`, the metric class a measure is bound to, which tells a display how to format it: a count, a
 *          plain number, money (kept per currency by the mixed-currency guard), a percent or a duration.
 * Boundary: an `Enum.of` value plus the type of the same name. The panel's metric schemas (`CountMetric`,
 *           `MoneyMetric`, ...) map one to one onto these codes; the panel owns their drawing.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: each measure names its metric class); ADR 0307 (rule 16: metrics).
 */
import { Enum } from "@stackra/contracts";

/** What kind of number a measure yields. */
export const ReportMetric = Enum.of({
  /** A count of rows or values. */
  Count: "count",
  /** A plain number. */
  Number: "number",
  /** A money amount; the field is a `Money` field, and amounts are never added across currencies. */
  Money: "money",
  /** A ratio shown as a percent. */
  Percent: "percent",
  /** A length of time in milliseconds. */
  Duration: "duration",
});

/** One of the codes above. */
export type ReportMetric = Enum.Value<typeof ReportMetric>;
