/**
 * Stackra file contract:
 * Purpose: `Aggregate`, how a metric turns rows into one number: `paid.value(Aggregate.Avg, "total.minor")`,
 *          `paid.series(Aggregate.Sum, "total.minor", MetricGrain.Week)`.
 * Boundary: an `Enum.of` value plus the type of the same name; each code names the SQL aggregate the metrics reader
 *           writes (`distinct` is `count(distinct ...)`). Every aggregate but `count` needs a field path; `sum`, `avg`,
 *           `min` and `max` read a numeric field and are 0 over no rows. The one aggregate enum of the platform: the
 *           panel re-exports it for saved-view totals and `@stackra/reports` takes its measure codes from it (ADR 0470
 *           consequences).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 16: metrics computed by `CrudService.metrics()`); ADR 0294 (decision 16);
 *                     reporting gaps 4 and 10; ADR 0470 (consequences: the two `Aggregate` enums merge here).
 */
import { Enum } from "@stackra/contracts";

/** How a metric's rows become one number. */
export const Aggregate = Enum.of({
  /** How many rows. */
  Count: "count",
  /** The sum of a numeric field. */
  Sum: "sum",
  /** The average of a numeric field. */
  Avg: "avg",
  /** The smallest value of a numeric field. */
  Min: "min",
  /** The largest value of a numeric field. */
  Max: "max",
  /** How many distinct non-null values a field holds. */
  Distinct: "distinct",
});

/** One of the codes above. */
export type Aggregate = Enum.Value<typeof Aggregate>;
