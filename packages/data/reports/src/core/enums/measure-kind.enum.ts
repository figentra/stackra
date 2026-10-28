/**
 * Stackra file contract:
 * Purpose: `MeasureKind`, the closed set of measures a report declares: `count`, `countDistinct`, `sum`, `avg`, `min`,
 *          `max`, and `formula` (arithmetic over other measures of the same report).
 * Boundary: an `Enum.of` value plus the type of the same name. Nothing outside this set can be measured (ADR 0470
 *           decision 2). The aggregate kinds take their codes from `@stackra/database`'s `Aggregate`, the one
 *           aggregate enum (the panel re-exports it); `countDistinct` keeps the name ADR 0470 decision 2 and gen's
 *           report vocabulary use for `Aggregate.Distinct`, and `formula` is the report's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: measures); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";
import { Aggregate } from "@stackra/database";

/** How a measure turns a group's rows into one value. */
export const MeasureKind = Enum.of({
  /** How many rows; takes no field. */
  Count: Aggregate.Count,
  /** How many distinct values of a field. */
  CountDistinct: "countDistinct",
  /** The sum of a numeric or money field. */
  Sum: Aggregate.Sum,
  /** The average of a numeric or money field. */
  Avg: Aggregate.Avg,
  /** The smallest value of a field. */
  Min: Aggregate.Min,
  /** The largest value of a field. */
  Max: Aggregate.Max,
  /** Arithmetic over other measures of the report (`paid / count`); takes no field. */
  Formula: "formula",
});

/** One of the kinds above. */
export type MeasureKind = Enum.Value<typeof MeasureKind>;
