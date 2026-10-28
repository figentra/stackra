/**
 * Stackra file contract:
 * Purpose: the `WarehouseSink` port: writes one partition of retained row changes (`WarehouseBatch`) to a warehouse or
 *          a lake, so a scope's data reaches its BI tools through the change feed instead of a database connection.
 * Boundary: an abstract class that is its own token, keyed `data-transfer.WarehouseSink`. A driver per target: `parquet`
 *           (a Hive layout `scope=/model=/dt=` on a `FileSystem` disk, S3, R2 or GCS) here; BigQuery and ClickHouse
 *           drivers are Pro (ADR 0461). Delivery is at least once: writing the same batch again replaces the same
 *           file, and a reader dedupes rows on `_position`. Which models are exported is the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5) and ADR 0190 (decision 3), both amended 2026-10-29 (STA-1430); ADR 0142
 *                     (drivers behind ports); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import type { WarehouseWriteOptions } from "#contracts/types/warehouse-write-options.type";

/**
 * Writes change batches to a warehouse.
 *
 * @example
 * const key = await sink.write(batch, { prefix: "warehouse" });
 */
export abstract class WarehouseSink extends Port {
  /** Type-only port key, so `DriverName<WarehouseSink>` narrows to this port's drivers. */
  declare readonly "~key": "data-transfer.WarehouseSink";

  /**
   * Writes `batch`, replacing what an earlier write of the same batch left.
   *
   * @returns where it was written (a file key for a file driver, a table for a database driver).
   */
  abstract write(batch: WarehouseBatch, options: WarehouseWriteOptions): Promise<string>;
}
