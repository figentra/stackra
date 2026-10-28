/**
 * Stackra file contract:
 * Purpose: `MeasureKind`, the closed set of measures a report declares: `count`, `countDistinct`, `sum`, `avg`, `min`,
 *          `max`, and `formula` (arithmetic over other measures of the same report).
 * Boundary: an `Enum.of` value plus the type of the same name. Nothing outside this set can be measured (ADR 0470
 *           decision 2). Merging it with `@stackra/database`'s `Aggregate` is stackra-391.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: measures); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** How a measure turns a group's rows into one value. */
export const MeasureKind = Enum.of({
  /** How many rows; takes no field. */
  Count: "count",
  /** How many distinct values of a field. */
  CountDistinct: "countDistinct",
  /** The sum of a numeric or money field. */
  Sum: "sum",
  /** The average of a numeric or money field. */
  Avg: "avg",
  /** The smallest value of a field. */
  Min: "min",
  /** The largest value of a field. */
  Max: "max",
  /** Arithmetic over other measures of the report (`paid / count`); takes no field. */
  Formula: "formula",
});

/** One of the kinds above. */
export type MeasureKind = Enum.Value<typeof MeasureKind>;
