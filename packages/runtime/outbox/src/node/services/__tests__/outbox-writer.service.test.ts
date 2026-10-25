/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxWriterService`: a flush's integration events are written, on the committing entity
 *          manager, with the call's actor and id, in flush order, while any other recorded event is recorded back; a
 *          watched model's row change carries its kind, its fields and the key read at commit, a delete no fields, and
 *          an unwatched model writes none; flushes of one transaction add up, entity managers stay apart, a rollback
 *          drops what was noted, nothing noted sends nothing, and a watched row with no key fails the commit.
 * Boundary: test only; stand-in flush and transaction arguments shaped like the ORM's, a recording entity manager, a
 *           fixed clock and a stand-in context storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decisions 3 and 4); ADR 0294 (decision 27); ADR 0221 (decision 5).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { type Actor, ActorKind, type Clock, Realm } from "@stackra/contracts";
import { DomainEvent, IntegrationEvent, recordEvent, takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { registerChangeConsumers } from "#core/functions/register-change-consumers.function";
import { OutboxWriterService } from "#node/services/outbox-writer.service";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const ACTOR: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {
  orderId!: string;
}

class PointsRedeemed extends DomainEvent {}

class Order {}

class Product {}

class IndexConsumer {
  async consume(): Promise<void> {}
}

registerChangeConsumers([[Product, IndexConsumer]]);

/** A writer whose call storage holds `call`. */
function writerIn(call?: object) {
  const storage = { current: () => call, run: () => undefined } as unknown as ContextStorage;
  return new OutboxWriterService(clock, storage);
}

/** An entity manager that records each statement's rows. */
function recordingEm() {
  const written: Record<string, unknown>[][] = [];
  const em = {
    execute: async (_sql: string, params: readonly unknown[] = []) => {
      written.push(JSON.parse(String(params[0])) as Record<string, unknown>[]);
      return [];
    },
  };
  return { em, written };
}

/** A change set shaped like the ORM's. */
function changeSet(entity: object, type: string, payload: object, key: string | null) {
  return { entity, type, payload, getSerializedPrimaryKey: () => key };
}

/** Flush arguments over `changeSets`. */
function flush(em: object, ...changeSets: ReturnType<typeof changeSet>[]) {
  return { em, uow: { getChangeSets: () => changeSets } };
}

describe(OutboxWriterService, () => {
  it("writes the integration events of a flush with the call's actor and id, and records others back", async () => {
    const writer = writerIn({ actor: ACTOR, callId: "call-1" });
    const { em, written } = recordingEm();
    const order = new Order();
    const paid = new OrderPaid();
    const redeemed = new PointsRedeemed();
    recordEvent(order, paid);
    recordEvent(order, redeemed);
    writer.onFlush(flush(em, changeSet(order, "update", { status: "paid" }, "ord_1")));
    expect(written).toEqual([]);
    await writer.beforeTransactionCommit({ em });
    expect(written).toEqual([
      [
        {
          id: expect.stringMatching(/^evt_/),
          kind: "event",
          type: "order.paid.v1",
          data: {},
          meta: { actor: ACTOR, correlationId: "call-1" },
          occurred_at: NOON.toISOString(),
          available_at: NOON.toISOString(),
        },
      ],
    ]);
    expect(takeRecordedEvents(order)).toEqual([redeemed]);
  });

  it("notes a watched row change with its kind, fields and key, and nothing for an unwatched model", async () => {
    const writer = writerIn();
    const { em, written } = recordingEm();
    let key: string | null = null;
    const created = { entity: new Product(), type: "create", payload: { name: "Mug" } };
    writer.onFlush(
      flush(
        em,
        { ...created, getSerializedPrimaryKey: () => key },
        changeSet(new Product(), "delete_early", { name: "Cup" }, "prd_2"),
        changeSet(new Order(), "update", { status: "paid" }, "ord_1"),
      ),
    );
    key = "prd_1";
    await writer.beforeTransactionCommit({ em });
    const [rows] = written;
    expect(rows?.map((row) => row["data"])).toEqual([
      { model: "Product", id: "prd_1", kind: "created", fields: ["name"] },
      { model: "Product", id: "prd_2", kind: "deleted", fields: [] },
    ]);
    expect(rows?.map((row) => [row["kind"], row["type"], row["meta"]])).toEqual([
      ["change", "Product", {}],
      ["change", "Product", {}],
    ]);
    const ids = rows?.map((row) => String(row["id"])) ?? [];
    expect([...ids].sort()).toEqual(ids);
  });

  it("adds up the flushes of one transaction and keeps entity managers apart", async () => {
    const writer = writerIn();
    const first = recordingEm();
    const second = recordingEm();
    writer.onFlush(flush(first.em, changeSet(new Product(), "update", { name: "A" }, "prd_1")));
    writer.onFlush(flush(second.em, changeSet(new Product(), "update", { name: "B" }, "prd_2")));
    writer.onFlush(flush(first.em, changeSet(new Product(), "update", { name: "C" }, "prd_3")));
    await writer.beforeTransactionCommit({ em: first.em });
    await writer.beforeTransactionCommit({ em: second.em });
    expect(first.written[0]?.map((row) => (row["data"] as { id: string }).id)).toEqual([
      "prd_1",
      "prd_3",
    ]);
    expect(second.written[0]?.map((row) => (row["data"] as { id: string }).id)).toEqual(["prd_2"]);
  });

  it("drops what a rolled-back transaction noted and sends nothing when nothing was noted", async () => {
    const writer = writerIn();
    const { em, written } = recordingEm();
    writer.onFlush(flush(em, changeSet(new Product(), "update", { name: "A" }, "prd_1")));
    writer.afterTransactionRollback({ em });
    await writer.beforeTransactionCommit({ em });
    writer.onFlush(flush(em, changeSet(new Order(), "update", { status: "paid" }, "ord_1")));
    await writer.beforeTransactionCommit({ em });
    expect(written).toEqual([]);
  });

  it("fails the commit for a watched row without a primary key", async () => {
    const writer = writerIn();
    const { em } = recordingEm();
    writer.onFlush(flush(em, changeSet(new Product(), "create", { name: "A" }, null)));
    await expect(writer.beforeTransactionCommit({ em })).rejects.toThrow(/without a primary key/);
  });
});
