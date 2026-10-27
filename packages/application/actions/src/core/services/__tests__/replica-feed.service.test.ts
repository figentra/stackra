/**
 * Stackra file contract:
 * Purpose: unit tests of `ReplicaFeed`: the first refresh is a full fill within the window and limit with the head's
 *          cursor; a later refresh returns only the rows changed and the ids removed since the cursor, collapsed to the
 *          latest per id across pages, with a monotonic cursor; a cursor of another partition, a malformed one or one
 *          above the head fills again; a sliced replica keeps its slices apart and needs its slice; the registered key
 *          names the partition; a query without a replica is refused; a cascading change stamped above a reader's node
 *          reaches it on an incremental refresh (lot recall, ADR 0456 decision 3).
 * Boundary: test only; over the memory replica log.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decision 3 and its enforcement); ADR 0456 (decision 3).
 */
import { ActorKind, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Query } from "#core/bases/query.base";
import { MemoryReplicaLogDriver } from "#core/drivers/memory-replica-log.driver";
import { registerActions } from "#core/functions/register-actions.function";
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import { ReplicaFeed } from "#core/services/replica-feed.service";
import type { ReplicaBounds } from "#core/types/replica-bounds.type";

class Sale {}

class LegalEntity {}

class RecentSalesQuery extends Query({
  key: "sale.recent",
  actors: [ActorKind.User],
  replica: { of: Sale, window: "30d", limit: 2 },
}) {
  async handle(): Promise<unknown> {
    return [];
  }
}

class EntitySalesQuery extends Query({
  key: "sale.by_entity",
  actors: [ActorKind.User],
  replica: { of: LegalEntity, window: "7d", limit: 100, scope: "legalEntityId" },
}) {
  async handle(): Promise<unknown> {
    return [];
  }
}

class PlainQuery extends Query({
  key: "sale.get",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<unknown> {
    return {};
  }
}

const AT = new Date("2026-10-25T09:00:00.000Z");
const EU: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const TILL: ScopeRef = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
  path: "platform.acme.shop_eu.till_1",
};

/** A replica row of `id` carrying `total`. */
const rowOf = (id: string, total = 0): ReplicaRow => ({ id, at: AT, data: { total } });

/** A fill that records its bounds and returns `rows`. */
function fillOf(rows: readonly ReplicaRow[]) {
  const seen: ReplicaBounds[] = [];
  return {
    seen,
    fill: async (bounds: ReplicaBounds) => {
      seen.push(bounds);
      return rows;
    },
  };
}

describe(ReplicaFeed, () => {
  it("fills first, then sends only the changes since the cursor", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    await feed.record(RecentSalesQuery, [{ id: "sal_0", row: rowOf("sal_0", 1) }], { scope: EU });
    const first = fillOf([rowOf("sal_0"), rowOf("sal_1"), rowOf("sal_2")]);
    const full = await feed.page(RecentSalesQuery, { at: AT }, first.fill);
    expect(full).toEqual({
      rows: [rowOf("sal_0"), rowOf("sal_1")],
      removed: [],
      cursor: full.cursor,
      asOf: AT,
      full: true,
    });
    expect(first.seen).toEqual([{ since: new Date("2026-09-25T09:00:00.000Z"), limit: 2 }]);
    await feed.record(RecentSalesQuery, [{ id: "sal_3", row: rowOf("sal_3", 3) }], { scope: EU });
    const changes = await feed.page(RecentSalesQuery, { cursor: full.cursor, at: AT }, first.fill);
    expect(changes).toEqual({
      rows: [rowOf("sal_3", 3)],
      removed: [],
      cursor: changes.cursor,
      asOf: AT,
      full: false,
    });
    expect(changes.cursor).not.toBe(full.cursor);
    const quiet = await feed.page(RecentSalesQuery, { cursor: changes.cursor, at: AT }, first.fill);
    expect(quiet).toMatchObject({ rows: [], removed: [], full: false });
    expect(first.seen).toHaveLength(1);
  });

  it("collapses the changes since the cursor to the latest per id, across pages", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    const { fill, seen } = fillOf([]);
    const start = await feed.page(RecentSalesQuery, { at: AT }, fill);
    await feed.record(RecentSalesQuery, [
      { id: "sal_1", row: rowOf("sal_1", 1) },
      { id: "sal_2", row: rowOf("sal_2", 2) },
      { id: "sal_1", row: rowOf("sal_1", 10) },
      { id: "sal_2" },
      { id: "sal_3", row: rowOf("sal_3", 3) },
    ]);
    const page = await feed.page(RecentSalesQuery, { cursor: start.cursor, at: AT }, fill);
    expect(page).toMatchObject({
      rows: [rowOf("sal_1", 10), rowOf("sal_3", 3)],
      removed: ["sal_2"],
      cursor: `5.${encodeURIComponent("sale.recent|")}`,
      full: false,
    });
    expect(seen).toHaveLength(1);
  });

  it("fills again for a foreign, malformed or unknown cursor", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    const { fill, seen } = fillOf([]);
    const own = await feed.page(RecentSalesQuery, { at: AT }, fill);
    const theirs = await feed.page(EntitySalesQuery, { at: AT }, fill, "le_1");
    for (const cursor of [theirs.cursor, "garbage", ".sale.recent%7C", "9.sale.recent%7C"])
      expect((await feed.page(RecentSalesQuery, { cursor, at: AT }, fill)).full).toBe(true);
    expect((await feed.page(RecentSalesQuery, { cursor: own.cursor, at: AT }, fill)).full).toBe(
      false,
    );
    expect(seen).toHaveLength(6);
  });

  it("keeps slices apart and reads only within the caller's scope", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    const { fill } = fillOf([]);
    const start = await feed.page(EntitySalesQuery, { at: AT }, fill, "le_1");
    await feed.record(EntitySalesQuery, [{ id: "sal_1", row: rowOf("sal_1") }], {
      slice: "le_1",
      scope: EU,
    });
    await feed.record(EntitySalesQuery, [{ id: "sal_2" }], { slice: "le_2", scope: EU });
    await feed.record(EntitySalesQuery, [{ id: "sal_3" }], { slice: "le_1" });
    const page = await feed.page(
      EntitySalesQuery,
      { cursor: start.cursor, within: EU, at: AT },
      fill,
      "le_1",
    );
    expect(page).toMatchObject({ full: false, rows: [rowOf("sal_1")], removed: [] });
  });

  it("needs a replica, and a slice exactly when the replica is scoped", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    await expect(feed.record(PlainQuery, [])).rejects.toThrow(/declares no replica/);
    await expect(feed.record(EntitySalesQuery, [])).rejects.toThrow(/scoped by legalEntityId/);
    await expect(feed.record(RecentSalesQuery, [], { slice: "le_1" })).rejects.toThrow(
      /takes no slice/,
    );
  });

  it("names the partition by the registered key", async () => {
    registerActions([{ type: RecentSalesQuery, key: "sales.sale.recent@1" }]);
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    const { cursor } = await feed.page(RecentSalesQuery, { at: AT }, fillOf([]).fill);
    expect(cursor).toBe(`0.${encodeURIComponent("sales.sale.recent@1|")}`);
  });

  it("sends a cascading change stamped above the reader's node on an incremental refresh", async () => {
    const feed = new ReplicaFeed(new MemoryReplicaLogDriver());
    const full = await feed.page(RecentSalesQuery, { at: AT, within: TILL }, fillOf([]).fill);
    await feed.record(RecentSalesQuery, [{ id: "lot_1", row: rowOf("lot_1", 1) }], { scope: ACME });
    await feed.record(RecentSalesQuery, [{ id: "lot_2", row: rowOf("lot_2", 2), cascade: true }], {
      scope: EU,
    });
    const next = await feed.page(
      RecentSalesQuery,
      { cursor: full.cursor, at: AT, within: TILL },
      fillOf([]).fill,
    );
    expect(next).toMatchObject({ rows: [rowOf("lot_2", 2)], removed: [], full: false });
  });
});
