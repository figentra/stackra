/**
 * Stackra file contract:
 * Purpose: `Partitioned({ by, interval, premake?, retain? })`, the trait of a model whose table grows without bound
 *          (outbox changes, access log, meter events, audit, projections): its table is range-partitioned by a time
 *          field, the maintenance job keeps future partitions ready and drops expired whole partitions.
 * Boundary: a marker with options: it adds no field (the `by` field is the model's own). The migration declares the
 *           partitioning with `t.partitionBy(column)`; @stackra/database's `maintainPartitions` and its cron job read
 *           the options, and dropping a partition honours legal holds. Native Postgres partitioning, no extension.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps db12, cdc6, sc4; ADR 0134 (holds); ADR 0096 (decision 4); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { PartitionedOptions } from "#core/types/partitioned-options.type";
import type { Trait } from "#core/types/trait.type";

/** The spans a partition may take. */
const INTERVALS = new Set(["day", "week", "month", "year"]);

/**
 * The partitioned trait.
 *
 * @throws TypeError for an unknown interval or a `premake` that is not a whole number from 0 to 24.
 * @example
 * export class AccessLogEntry extends Model.with(
 *   HasPublicId("ale"),
 *   Partitioned({ by: "at", interval: "month", retain: Duration.days(400) }),
 * ) {}
 */
export function Partitioned(options: PartitionedOptions): Trait<object> {
  if (!INTERVALS.has(options.interval))
    throw new TypeError(
      `"${options.interval}" is not a partition interval (day, week, month, year)`,
    );
  const premake = options.premake ?? 2;
  if (!Number.isInteger(premake) || premake < 0 || premake > 24)
    throw new TypeError(`premake is a whole number from 0 to 24, got ${premake}`);
  return createTrait("partitioned", (base) => class extends base {}, { ...options, premake });
}
