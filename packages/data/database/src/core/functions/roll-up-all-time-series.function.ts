/**
 * Stackra file contract:
 * Purpose: `rollUpAllTimeSeries(now)`, the rollup upkeep of every registered `TimeSeries`: runs `rollUpTimeSeries` for
 *          each in turn and answers one report per series.
 * Boundary: reads the series `registerTimeSeries` recorded; runs on the connected `Database` as `rollUpTimeSeries` does,
 *           in the caller's scope. The rollup job of @stackra/data-maintenance calls it and audits the reports; this
 *           package declares no job.
 * Runtime: node
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0462 (decision 1: jobs live in an add-on above iam).
 */
import { TIME_SERIES_SOURCES } from "#core/constants/time-series-sources.constant";
import { rollUpTimeSeries } from "#core/functions/roll-up-time-series.function";
import type { RollupReport } from "#core/types/rollup-report.type";

/**
 * Keeps every time series' rollups current.
 *
 * @example
 * const reports = await rollUpAllTimeSeries(new Date());
 */
export async function rollUpAllTimeSeries(now: Date): Promise<readonly RollupReport[]> {
  const reports: RollupReport[] = [];
  for (const series of TIME_SERIES_SOURCES.keys())
    reports.push(await rollUpTimeSeries(series, now));
  return reports;
}
