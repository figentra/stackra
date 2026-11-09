/**
 * Stackra file contract:
 * Purpose: `FilterKind`, the control a table filter draws when the spec names one instead of the one its operator and
 *          type imply (the SDUI `tableFilters` case's `kind`).
 * Boundary: an enum (`Enum.of`) read by `FilterSpec.kind` (a recorded filter's `control`) and the web list renderer,
 *           which maps each code onto a `FilterBar` column type.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2); ADR 0294 (decision 16: Enum); ADR 0504.
 */
import { Enum } from "@stackra/contracts";

/**
 * The controls a table filter can be drawn with.
 *
 * @example
 * Filter.from("status", { control: FilterKind.MultiChoice });
 */
export const FilterKind = Enum.of({
  /** Free text. */
  Text: "text",
  /** A number. */
  Number: "number",
  /** A calendar day. */
  Date: "date",
  /** Two calendar days. */
  DateRange: "date-range",
  /** Yes or no. */
  Boolean: "boolean",
  /** One of the choices. */
  Choice: "choice",
  /** Any of the choices. */
  MultiChoice: "multi-choice",
  /** A principal. */
  Principal: "principal",
  /** A `TimeRange` code. */
  TimeRange: "time-range",
});

/** One of the codes above. */
export type FilterKind = Enum.Value<typeof FilterKind>;
