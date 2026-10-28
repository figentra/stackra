/**
 * Stackra file contract:
 * Purpose: `PartitionedOptions`, what `Partitioned({...})` takes: the time field the table is range-partitioned by,
 *          how long one partition spans, how many future partitions are kept ready, and how long a partition is kept.
 * Boundary: a type only. Read by @stackra/database's `maintainPartitions` through the trait registry; the migration
 *           partitions the table with the blueprint's `t.partitionBy(column)`. Values are the model author's
 *           configuration, never computed.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps db12, cdc6, sc4 (native declarative partitioning, no extension); ADR 0134
 *                     (holds and retention); ADR 0305 (rules 10 to 13).
 */
import type { Duration } from "@stackra/contracts";

/** The partitioning of a model's table. */
export interface PartitionedOptions {
  /** The `Date` field the table is range-partitioned by (`createdAt`, `occurredAt`); it is part of the primary key. */
  readonly by: string;

  /** The span of one partition. */
  readonly interval: "day" | "week" | "month" | "year";

  /** How many partitions after the current one stay created ahead; 2 when absent. */
  readonly premake?: number;

  /** How long a partition is kept after its span ends; kept for ever when absent. */
  readonly retain?: Duration;
}
