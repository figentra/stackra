/**
 * Stackra file contract:
 * Purpose: unit tests of `WarehouseChangeSink`: `sync` exports the next page of the named models from its own cursor in
 *          partition batches and moves the cursor, does nothing on an empty log, keeps the cursor when a write fails,
 *          refuses bad options, and `replay` moves the cursor back.
 * Boundary: test only; the change log is the outbox's memory driver and the sink a recording fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments); ADR 0078 and ADR 0221
 *                     (2026-10-28 amendment).
 */
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { MemoryChangeFeedDriver } from "@stackra/outbox";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { RowChange } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import { WarehouseSink } from "#contracts/ports/warehouse-sink.port";
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import type { WarehouseWriteOptions } from "#contracts/types/warehouse-write-options.type";
import { WarehouseChangeSink } from "#core/services/warehouse-change-sink.service";

const NOW = new Date("2026-10-29T12:00:00.000Z");
const ACME: ScopeRef = { id: "scp_acme" as ScopeRef["id"], path: "platform.acme" };

/** A clock fixed at `NOW`. */
class FixedClock extends Driver(Clock) {
  now(): Date {
    return new Date(NOW);
  }
}

/** A sink that records every write with every argument, failing when `fail` is set. */
class RecordingSink extends Driver(WarehouseSink) {
  /** The recorded calls. */
  readonly calls: [WarehouseBatch, WarehouseWriteOptions][] = [];

  /** Whether the next write throws. */
  fail = false;

  write(batch: WarehouseBatch, options: WarehouseWriteOptions): Promise<string> {
    this.calls.push([batch, options]);
    if (this.fail) return Promise.reject(new Error("disk down"));
    return Promise.resolve(`${batch.model}/${batch.day}`);
  }
}

/** A created change of `model` row `id`. */
function change(model: string, id: string): RowChange {
  return { model, id, kind: RowChangeKind.Created, fields: [] };
}

/** A change log with two Order changes in Acme on two days and a Product change. */
async function setup() {
  const feed = new MemoryChangeFeedDriver();
  await feed.append([
    {
      change: change("Order", "ord_1"),
      meta: {},
      occurredAt: new Date("2026-10-28T10:00:00.000Z"),
      scope: ACME,
    },
    { change: change("Product", "prd_1"), meta: {}, occurredAt: NOW, scope: ACME },
    { change: change("Order", "ord_2"), meta: {}, occurredAt: NOW, scope: ACME },
  ]);
  const sink = new RecordingSink();
  return { feed, sink, service: new WarehouseChangeSink(feed, sink, new FixedClock()) };
}

describe(WarehouseChangeSink, () => {
  it("exports the next page in partitions and moves its cursor", async () => {
    const { feed, sink, service } = await setup();
    const report = await service.sync({
      models: ["Order"],
      limit: 10,
      prefix: "w",
      rowGroupRows: 50,
    });
    expect(report).toEqual({ records: 2, files: ["Order/2026-10-28", "Order/2026-10-29"] });
    expect(sink.calls.map(([batch, options]) => [batch.day, batch.scope?.id, options])).toEqual([
      ["2026-10-28", "scp_acme", { prefix: "w", rowGroupRows: 50 }],
      ["2026-10-29", "scp_acme", { prefix: "w", rowGroupRows: 50 }],
    ]);
    const cursor = await feed.cursor("WarehouseChangeSink");
    expect(cursor?.position).toBe(sink.calls[1]?.[0].records[0]?.position);
    expect(cursor?.availableAt).toEqual(NOW);
    await expect(service.sync({ models: ["Order"], limit: 10, prefix: "w" })).resolves.toEqual({
      records: 0,
      files: [],
    });
  });

  it("keeps its cursor when a write fails", async () => {
    const { feed, sink, service } = await setup();
    sink.fail = true;
    await expect(service.sync({ models: ["Order"], limit: 10, prefix: "w" })).rejects.toThrow(
      "disk down",
    );
    await expect(feed.cursor("WarehouseChangeSink")).resolves.toBeUndefined();
  });

  it("re-exports after a replay", async () => {
    const { sink, service } = await setup();
    await service.sync({ models: ["Order", "Product"], limit: 10, prefix: "w" });
    await service.replay(NOW);
    const report = await service.sync({ models: ["Order", "Product"], limit: 10, prefix: "w" });
    expect(report.records).toBe(2);
    await service.replay();
    expect((await service.sync({ models: ["Order"], limit: 1, prefix: "w" })).records).toBe(1);
    expect(sink.calls.at(-1)?.[1]).toEqual({ prefix: "w" });
  });

  it("refuses bad options", async () => {
    const { service } = await setup();
    await expect(service.sync({ models: [], limit: 1, prefix: "w" })).rejects.toThrow(TypeError);
    await expect(service.sync({ models: ["Order"], limit: 0, prefix: "w" })).rejects.toThrow(
      TypeError,
    );
  });
});
