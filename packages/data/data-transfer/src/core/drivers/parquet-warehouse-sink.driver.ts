/**
 * Stackra file contract:
 * Purpose: `ParquetWarehouseSinkDriver`, the `parquet` driver of `WarehouseSink`: each batch becomes one Parquet file
 *          in the Hive layout `scope=/model=/dt=` on a `FileSystem` disk (S3, R2 or GCS in production), so Athena,
 *          BigQuery external tables, DuckDB or Spark read a scope's data as partitions.
 * Boundary: streams the file to the disk through `writeStream`, which never leaves a partial file. The key depends
 *           only on the batch (`warehousePath`), so a redelivered batch replaces its file. Which disk is the caller's
 *           binding; this driver reads no setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5) and ADR 0190 (decision 3), both amended 2026-10-29 (STA-1430); ADR 0142
 *                     (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import type { FileSystem } from "@stackra/filesystem/contracts";

import { WarehouseSink } from "#contracts/ports/warehouse-sink.port";
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import type { WarehouseWriteOptions } from "#contracts/types/warehouse-write-options.type";
import { ParquetWriterDriver } from "#core/drivers/parquet-writer.driver";
import { warehousePath } from "#core/functions/warehouse-path.function";
import { warehouseSheet } from "#core/functions/warehouse-sheet.function";

/**
 * Writes warehouse batches as Parquet files.
 *
 * @example
 * const key = await new ParquetWarehouseSinkDriver(files).write(batch, { prefix: "warehouse" });
 */
export class ParquetWarehouseSinkDriver extends Driver(WarehouseSink) {
  /** The disk the files go to. */
  private readonly files: FileSystem;

  /** The file format. */
  private readonly parquet = new ParquetWriterDriver();

  /**
   * @param files - the disk the files go to.
   */
  constructor(files: FileSystem) {
    super();
    this.files = files;
  }

  /** Implements `WarehouseSink.write`, documented there; returns the file key. */
  async write(batch: WarehouseBatch, options: WarehouseWriteOptions): Promise<string> {
    const path = warehousePath(options.prefix, batch);
    await this.files.writeStream(
      path,
      this.parquet.write(
        [warehouseSheet(batch)],
        options.rowGroupRows === undefined ? {} : { rowGroupRows: options.rowGroupRows },
      ),
      { contentType: this.parquet.mediaType },
    );
    return path;
  }
}
