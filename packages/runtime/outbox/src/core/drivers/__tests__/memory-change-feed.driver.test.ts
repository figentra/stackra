/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryChangeFeedDriver`: appended entries get growing positions and are stored as JSON;
 *          `claim` lists the positions (no owner: memory keeps none) of the given models after a position up to a
 *          limit, and `load` returns those entries in log order; `positionAt` steps back one from the first entry at an
 *          instant (or takes the last one); cursors round-trip; `maintain` drops entries older than the window, so
 *          `expired` claims none after it, and `remove` deletes the given positions.
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

  it("claims the given models after a position, in order, up to a limit, and loads them", async () => {
    const feed = await feedOf();
    const all = await feed.claim(undefined, ["Product"], 10);
    expect(all.every((claim) => claim.ownerId === undefined)).toBe(true);
    expect((all[0]?.position ?? "") < (all[1]?.position ?? "")).toBe(true);
    const loaded = await feed.load([all[1]?.position ?? "", all[0]?.position ?? ""]);
    expect(loaded.map((entry) => entry.change.id)).toEqual(["prd_1", "prd_2"]);
    const after = await feed.claim(all[0]?.position, ["Product", "Order"], 1);
    expect((await feed.load(after.map((claim) => claim.position))).map((e) => e.change.id)).toEqual(
      ["ord_1"],
    );
  });

  it("positions just before the first entry at an instant, or after the last one", async () => {
    const feed = await feedOf();
    const position = await feed.positionAt(NOON);
    const replayed = await feed.claim(position, ["Product", "Order"], 10);
    expect(
      (await feed.load(replayed.map((claim) => claim.position))).map((e) => e.change.id),
    ).toEqual(["ord_1", "prd_2"]);
    const later = await feed.positionAt(new Date(NOON.getTime() + 1));
    await expect(feed.claim(later, ["Product"], 10)).resolves.toEqual([]);
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
    await expect(feed.expired(NOON, 10)).resolves.toEqual([]);
  });

  it("claims expired entries before maintenance and removes the given positions", async () => {
    const feed = await feedOf();
    const expired = await feed.expired(NOON, 10);
    expect(expired).toHaveLength(1);
    await feed.remove(expired.map((claim) => claim.position));
    expect(feed.stored().map((entry) => entry.change.id)).toEqual(["ord_1", "prd_2"]);
  });
});
