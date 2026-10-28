/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryChangeFeedDriver`: appended entries get growing positions and are stored as JSON; `read`
 *          lists the given models after a position up to a limit; `positionAt` steps back one from the first entry at
 *          an instant (or takes the last one); cursors round-trip; `maintain` drops entries older than the window.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ChangeFeed, RowChangeKind } from "#contracts/index";
import type { RowChange } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** A change of `model` row `id`. */
function change(model: string, id: string): RowChange {
  return { model, id, kind: RowChangeKind.Updated, fields: ["name"] };
}

/** A feed holding a Product change a day old, an Order change and a Product change at noon. */
async function feedOf() {
  const feed = new MemoryChangeFeedDriver();
  await feed.append([
    {
      change: change("Product", "prd_1"),
      meta: {},
      occurredAt: new Date(NOON.getTime() - 86_400_000),
    },
    { change: change("Order", "ord_1"), meta: {}, occurredAt: NOON },
    { change: change("Product", "prd_2"), meta: {}, occurredAt: NOON },
  ]);
  return feed;
}

describe(MemoryChangeFeedDriver, () => {
  it("is a ChangeFeed", () => {
    expect(new MemoryChangeFeedDriver()).toBeInstanceOf(ChangeFeed);
  });

  it("reads the given models after a position, in order, up to a limit", async () => {
    const feed = await feedOf();
    const all = await feed.read(undefined, ["Product"], 10);
    expect(all.map((entry) => entry.change.id)).toEqual(["prd_1", "prd_2"]);
    expect(all[0]?.position < (all[1]?.position ?? "")).toBe(true);
    const after = await feed.read(all[0]?.position, ["Product", "Order"], 1);
    expect(after.map((entry) => entry.change.id)).toEqual(["ord_1"]);
  });

  it("positions just before the first entry at an instant, or after the last one", async () => {
    const feed = await feedOf();
    const position = await feed.positionAt(NOON);
    const replayed = await feed.read(position, ["Product", "Order"], 10);
    expect(replayed.map((entry) => entry.change.id)).toEqual(["ord_1", "prd_2"]);
    const later = await feed.positionAt(new Date(NOON.getTime() + 1));
    await expect(feed.read(later, ["Product"], 10)).resolves.toEqual([]);
    await expect(new MemoryChangeFeedDriver().positionAt(NOON)).resolves.toBeUndefined();
  });

  it("keeps one cursor per consumer", async () => {
    const feed = new MemoryChangeFeedDriver();
    await feed.save({ consumer: "IndexConsumer", position: "1", attempts: 0, availableAt: NOON });
    await expect(feed.cursor("IndexConsumer")).resolves.toMatchObject({ position: "1" });
    await expect(feed.cursor("Other")).resolves.toBeUndefined();
  });

  it("drops the entries older than the retention window", async () => {
    const feed = await feedOf();
    await expect(feed.maintain(NOON, Duration.hours(1))).resolves.toEqual({
      created: 0,
      dropped: 1,
    });
    expect(feed.stored().map((entry) => entry.change.id)).toEqual(["ord_1", "prd_2"]);
  });
});
