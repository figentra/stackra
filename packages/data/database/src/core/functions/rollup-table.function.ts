/**
 * Stackra file contract:
 * Purpose: `rollupTable(key, grain)`, the name of a `TimeSeries` rollup table, `ts_<key>_<grain>`, so a migration
 *          creates the table the rollup job writes.
 * Boundary: pure; the key is checked by `TimeSeries` when the series is declared.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321).
 */
import type { MetricGrain } from "#core/enums/metric-grain.enum";

/**
 * The rollup table of one grain.
 *
 * @example
 * rollupTable("meter_readings", MetricGrain.Hour); // "ts_meter_readings_hour"
 */
export function rollupTable(key: string, grain: MetricGrain): string {
  return `ts_${key}_${grain}`;
}
