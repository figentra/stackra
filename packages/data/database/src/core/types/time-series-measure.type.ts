/**
 * Stackra file contract:
 * Purpose: `TimeSeriesMeasure<S>`, one measure of a `TimeSeries` rollup: the aggregate and the source field it reads.
 * Boundary: a type only. `count` reads no field; every other aggregate names one numeric (or, for `distinct`, any)
 *           single-column field of the source.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321).
 */
import type { Aggregate } from "#core/enums/aggregate.enum";

/**
 * One rollup measure.
 *
 * @example
 * const kwh: TimeSeriesMeasure<MeterReading> = { aggregate: Aggregate.Sum, field: "kwh" };
 */
export interface TimeSeriesMeasure<S extends object = object> {
  /** How the bucket's rows are folded into the value. */
  readonly aggregate: Aggregate;

  /** The source field read; left out for `count`. */
  readonly field?: keyof S & string;
}
