/**
 * Stackra file contract:
 * Purpose: unit tests of `ParquetWarehouseSinkDriver`: a batch is streamed as one Parquet file under its Hive layout
 *          key with the Parquet media type, and the key is returned.
 * Boundary: test only; the disk is a recording fake of `FileSystem.writeStream`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments).
 */
import type { FileSystem } from "@stackra/filesystem/contracts";
import { RowChangeKind } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import { WarehouseSink } from "#contracts/ports/warehouse-sink.port";
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import { ParquetWarehouseSinkDriver } from "#core/drivers/parquet-warehouse-sink.driver";

/** One recorded `writeStream` call, with the stream read out. */
interface Written {
  readonly path: string;
  readonly bytes: Buffer;
  readonly options: unknown;
}

/** A disk that records each `writeStream` call with every argument. */
function diskOf(written: Written[]): FileSystem {
  return {
    async writeStream(path: string, contents: AsyncIterable<Uint8Array>, options: unknown) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of contents) chunks.push(chunk);
      written.push({ path, bytes: Buffer.concat(chunks), options });
    },
  } as unknown as FileSystem;
}

const BATCH: WarehouseBatch = {
  model: "Order",
  day: "2026-10-29",
  records: [
    {
      position: "9",
      change: {
        model: "Order",
        id: "ord_1",
        kind: RowChangeKind.Created,
        fields: ["total"],
        after: { total: 5 },
      },
      meta: {},
      occurredAt: new Date("2026-10-29T10:00:00.000Z"),
    },
  ],
};

describe(ParquetWarehouseSinkDriver, () => {
  it("is a WarehouseSink", () => {
    expect(new ParquetWarehouseSinkDriver(diskOf([]))).toBeInstanceOf(WarehouseSink);
  });

  it("streams the batch as a Parquet file under its partition key", async () => {
    const written: Written[] = [];
    const key = await new ParquetWarehouseSinkDriver(diskOf(written)).write(BATCH, {
      prefix: "warehouse",
      rowGroupRows: 100,
    });
    expect(key).toBe("warehouse/scope=_platform/model=Order/dt=2026-10-29/9-9.parquet");
    expect(written).toHaveLength(1);
    expect(written[0]?.path).toBe(key);
    expect(written[0]?.options).toEqual({ contentType: "application/vnd.apache.parquet" });
    expect(written[0]?.bytes.subarray(0, 4).toString()).toBe("PAR1");
    expect(written[0]?.bytes.includes(Buffer.from("ord_1"))).toBe(true);
  });
});
