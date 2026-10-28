/**
 * Stackra file contract:
 * Purpose: `RollupReport`, what one `rollUpTimeSeries` run did to each rollup table of a series.
 * Boundary: a type only; the job sums it and writes it to the audit entry.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321).
 */

/**
 * One series' run.
 *
 * @example
 * const report: RollupReport = { series: "meter_readings", tables: [{ table: "metering.ts_meter_readings_hour", written: 48, pruned: 0 }] };
 */
export interface RollupReport {
  /** The series key. */
  readonly series: string;

  /** Each rollup table, with the bucket rows written again and the expired rows removed. */
  readonly tables: readonly {
    /** The table, schema-qualified. */
    readonly table: string;

    /** Bucket rows written for the recomputed window. */
    readonly written: number;

    /** Rows removed for being older than the grain's retention. */
    readonly pruned: number;
  }[];
}
