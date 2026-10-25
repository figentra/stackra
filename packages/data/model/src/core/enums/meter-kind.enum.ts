/**
 * Stackra file contract:
 * Purpose: `MeterKind`, how a meter turns a model's rows into usage: a count of rows, the sum, maximum or last value of
 *          a field, or the number of distinct values of a field.
 * Boundary: an `Enum.of` value plus the type of the same name; the code is what the usage event carries. Aggregation
 *           and quotas are the usage service's (ADR 0216 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 2: U1).
 */
import { Enum } from "@stackra/contracts";

/** The meter kinds. */
export const MeterKind = Enum.of({
  /** How many rows. */
  Count: "count",
  /** The sum of a numeric field. */
  Sum: "sum",
  /** The largest value of a numeric field. */
  Max: "max",
  /** The latest value of a field. */
  Last: "last",
  /** How many distinct values a field takes. */
  Unique: "unique",
});

/** One of the codes above. */
export type MeterKind = Enum.Value<typeof MeterKind>;
