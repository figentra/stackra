/**
 * Stackra file contract:
 * Purpose: unit tests of `ChangeFeedService`: `replay` moves a cursor to an instant (or the log's start) and clears its
 *          stall; `resume` keeps the position and clears the stall; `backfill` hands every row of a model in keyset
 *          batches as created changes, through `consumeMany` or `consume`, and refuses a bad batch size.
 * Boundary: test only; the memory change feed, a fixed clock and a stand-in entity manager that pages fixed ids.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/index";
import type { RowChange } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { ChangeFeedService } from "#node/services/change-feed.service";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class Product {}

class IndexConsumer {
  readonly seen: RowChange[] = [];

  async consume(change: RowChange): Promise<void> {
    this.seen.push(change);
  }
}

/** A database whose entity manager pages the ids `prd_1` to `prd_5` by primary key. */
function databaseOf() {
  const ids = ["prd_1", "prd_2", "prd_3", "prd_4", "prd_5"];
  const em = {
    getMetadata: () => ({ primaryKeys: ["id"] }),
    find: async (_model: unknown, where: { id?: { $gt: string } }, options: { limit: number }) =>
      ids
        .filter((id) => where.id === undefined || id > where.id.$gt)
        .slice(0, options.limit)
        .map((id) => ({ id })),
  };
  return { em: () => em } as unknown as Database;
}

describe(ChangeFeedService, () => {
  it("replays a consumer from an instant or the log's start, clearing its stall", async () => {
    const feed = new MemoryChangeFeedDriver();
    const service = new ChangeFeedService(feed, databaseOf(), clock);
    await feed.append([
      {
        change: { model: "Product", id: "prd_1", kind: RowChangeKind.Created, fields: [] },
        meta: {},
        occurredAt: NOON,
      },
    ]);
    await feed.save({
      consumer: "IndexConsumer",
      position: "9",
      attempts: 10,
      availableAt: NOON,
      stalledAt: NOON,
    });
    await service.replay(IndexConsumer, NOON);
    const cursor = await feed.cursor("IndexConsumer");
    expect(cursor).toEqual({
      consumer: "IndexConsumer",
      position: await feed.positionAt(NOON),
      attempts: 0,
      availableAt: NOON,
    });
    await service.replay(IndexConsumer);
    await expect(feed.cursor("IndexConsumer")).resolves.toEqual({
      consumer: "IndexConsumer",
      attempts: 0,
      availableAt: NOON,
    });
  });

  it("resumes a stalled consumer from where it stopped", async () => {
    const feed = new MemoryChangeFeedDriver();
    const service = new ChangeFeedService(feed, databaseOf(), clock);
    await service.resume(IndexConsumer);
    await expect(feed.cursor("IndexConsumer")).resolves.toBeUndefined();
    await feed.save({
      consumer: "IndexConsumer",
      position: "3",
      attempts: 10,
      availableAt: NOON,
      stalledAt: NOON,
    });
    await service.resume(IndexConsumer);
    await expect(feed.cursor("IndexConsumer")).resolves.toEqual({
      consumer: "IndexConsumer",
      position: "3",
      attempts: 0,
      availableAt: NOON,
    });
  });

  it("backfills every row in keyset batches as created changes", async () => {
    const service = new ChangeFeedService(new MemoryChangeFeedDriver(), databaseOf(), clock);
    const consumer = new IndexConsumer();
    await expect(service.backfill(consumer, Product, { batch: 2 })).resolves.toBe(5);
    expect(consumer.seen.map((change) => change.id)).toEqual([
      "prd_1",
      "prd_2",
      "prd_3",
      "prd_4",
      "prd_5",
    ]);
    expect(consumer.seen[0]).toEqual({
      model: "Product",
      id: "prd_1",
      kind: "created",
      fields: [],
    });
    const batches: (readonly RowChange[])[] = [];
    await service.backfill(
      {
        consume: async () => undefined,
        consumeMany: async (changes) => void batches.push(changes),
      },
      Product,
      { batch: 3 },
    );
    expect(batches.map((changes) => changes.length)).toEqual([3, 2]);
    await expect(service.backfill(consumer, Product, { batch: 0 })).rejects.toThrow(TypeError);
  });
});
