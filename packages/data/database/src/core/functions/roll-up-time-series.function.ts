/**
 * Stackra file contract:
 * Purpose: `rollUpTimeSeries(series, now)`, one run of a `TimeSeries`' upkeep: for each rollup grain it recomputes the
 *          buckets from the one `lateness` before `now` (one grain by default) from the source rows, replacing those
 *          bucket rows of `ts_<key>_<grain>`, then removes the buckets older than the grain's `retain`.
 * Boundary: runs on the connected `Database` in one transaction, as the caller: inside a scoped job run the source's
 *           and the rollup's row-level security show that scope's rows only, so each scope's buckets are rebuilt by
 *           its own run. Buckets are UTC (`date_trunc(grain, time, 'UTC')`; a week starts on Monday). Rollups read the
 *           source table itself, with no ORM filter: a source is an append-only stream. A bucket older than the window
 *           is never rewritten, so a rollup outlives the raw rows a shorter partition retention drops. No legal-hold
 *           check on pruning: a rollup row is an aggregate, not a record a hold names.
 * Runtime: node
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0160 (raw SQL with a reason; native Postgres only).
 */
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { TIME_SERIES_SOURCES } from "#core/constants/time-series-sources.constant";
import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import { columnOf } from "#core/functions/column-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { rollupTable } from "#core/functions/rollup-table.function";
import { Database } from "#core/ports/database.port";
import type { RollupReport } from "#core/types/rollup-report.type";
import type { TimeSeriesClass } from "#core/types/time-series-class.type";
import type { TimeSeriesOptions } from "#core/types/time-series-options.type";

/** One bucket's span, as a Postgres interval: the default lateness. */
const SPAN: Readonly<Record<MetricGrain, string>> = {
  [MetricGrain.Hour]: "1 hour",
  [MetricGrain.Day]: "1 day",
  [MetricGrain.Week]: "1 week",
  [MetricGrain.Month]: "1 month",
  [MetricGrain.Quarter]: "3 months",
};

/** `name` in snake_case: a measure's column. */
function snake(name: string): string {
  return name.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** The SQL of one measure over the source columns. */
function measureSql(aggregate: Aggregate, column: string | undefined): string {
  if (aggregate === Aggregate.Count) return "count(*)";
  const quoted = quoteIdentifier(column ?? "");
  return aggregate === Aggregate.Distinct ? `count(distinct ${quoted})` : `${aggregate}(${quoted})`;
}

/**
 * Keeps `series`' rollup tables current.
 *
 * @throws TypeError when the class is not a registered `TimeSeries`, or a field is not a single-column field.
 * @example
 * const report = await rollUpTimeSeries(MeterReadingSeries, new Date());
 */
export async function rollUpTimeSeries(series: TimeSeriesClass, now: Date): Promise<RollupReport> {
  const record = kindOf(series);
  const model = TIME_SERIES_SOURCES.get(series);
  if (record?.kind !== "time_series" || model === undefined)
    throw new TypeError(`${series.name} is not a registered TimeSeries (registerTimeSeries)`);
  const options = record.options as unknown as TimeSeriesOptions;
  const database = Database.current();
  return database.transaction(async () => {
    const em = database.em();
    const meta = em.getMetadata(model);
    const schema = meta.schema ?? "public";
    const source = `${quoteIdentifier(schema)}.${quoteIdentifier(meta.tableName)}`;
    const time = quoteIdentifier(columnOf(meta, options.time));
    const dimensions = options.dimensions.map((field) => quoteIdentifier(columnOf(meta, field)));
    const measures = Object.entries(options.measures);
    const columns = [
      '"bucket"',
      ...dimensions,
      ...measures.map(([name]) => quoteIdentifier(snake(name))),
    ].join(", ");
    const values = [
      ...dimensions,
      ...measures.map(([, measure]) =>
        measureSql(
          measure.aggregate,
          measure.field === undefined ? undefined : columnOf(meta, measure.field),
        ),
      ),
    ].join(", ");
    const groups = ["1", ...dimensions].join(", ");
    const tables: RollupReport["tables"][number][] = [];
    for (const grain of options.rollups) {
      const name = rollupTable(options.key, grain);
      const target = `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`;
      const lateness =
        options.lateness === undefined
          ? `interval '${SPAN[grain]}'`
          : `${Duration.toMilliseconds(options.lateness)} * interval '1 millisecond'`;
      // raw-sql: the window's first bucket; the grain is a MetricGrain value and the lateness a computed number
      const [window] = await em.execute<{ since: Date }[]>(
        `select date_trunc(?, ?::timestamptz - ${lateness}, 'UTC') as since`,
        [grain, now.toISOString()],
      );
      const since = window?.since ?? now;
      // raw-sql: replace the window's buckets; identifiers are quoted from the declaration and the metadata
      await em.execute(`delete from ${target} where "bucket" >= ?`, [since]);
      const [inserted] = await em.execute<{ count: number }[]>(
        `with written as (insert into ${target} (${columns}) select date_trunc(?, ${time}, 'UTC'), ${values} from ${source} where ${time} >= ? group by ${groups} returning 1) select count(*)::int as count from written`,
        [grain, since],
      );
      let pruned = 0;
      const retain = options.retain?.[grain];
      if (retain !== undefined) {
        const cutoff = new Date(now.getTime() - Duration.toMilliseconds(retain));
        // raw-sql: the grain's retention, a bound instant
        const [removed] = await em.execute<{ count: number }[]>(
          `with removed as (delete from ${target} where "bucket" < ? returning 1) select count(*)::int as count from removed`,
          [cutoff],
        );
        pruned = removed?.count ?? 0;
      }
      tables.push({ table: `${schema}.${name}`, written: inserted?.count ?? 0, pruned });
    }
    return { series: options.key, tables };
  });
}
