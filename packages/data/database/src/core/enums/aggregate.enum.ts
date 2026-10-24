/**
 * Stackra file contract:
 * Purpose: `Aggregate`, the aggregate a metrics series buckets: `paid.series(Aggregate.Sum, "total.minor")`.
 * Boundary: an `Enum.of` value plus the type of the same name; the code names the SQL aggregate the metrics reader
 *           writes. Only the aggregates a query uses today.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 16: metrics computed by `CrudService.metrics()`); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** How a bucket's rows become one number. */
export const Aggregate = Enum.of({
  /** How many rows. */
  Count: "count",
  /** The sum of a numeric field. */
  Sum: "sum",
});

/** One of the codes above. */
export type Aggregate = Enum.Value<typeof Aggregate>;
