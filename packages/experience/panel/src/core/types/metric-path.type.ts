/**
 * Stackra file contract:
 * Purpose: `MetricPath<O>`, the top-level keys of an output typed as a metric class (`MoneyMetric`, `CountMetric`): what a
 *          KPI binds to.
 * Boundary: a type only; structural, so any shape with a nullable `value` and `previous` counts. Gen fails
 *           `metric_path_not_metric` on any other key.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: a KPI binds to a field typed as a metric class).
 */

/** The keys of `O` holding a metric. */
export type MetricPath<O> = {
  [K in keyof O & string]: NonNullable<O[K]> extends {
    readonly value: number | null;
    readonly previous: number | null;
  }
    ? K
    : never;
}[keyof O & string];
