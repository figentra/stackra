/**
 * Stackra file contract:
 * Purpose: unit tests of `drainOutbox`: it relays what the app wrote to its `OutboxFake` and what the inbox received,
 *          runs each occurrence's listeners once (a redelivered id runs none), settles a chain where a listener writes
 *          to the outbox again, keeps failures in the result, and refuses an outbox that is not the fake.
 * Boundary: test only; the outbox is written by hand where the unit of work would write it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decisions 2 and 4).
 */
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { EventOutbox } from "#contracts/index";
import type { RecordedEvent } from "#contracts/index";
import { IntegrationEvent, Listener, registerListeners } from "#core/index";
import "#testing/index";
import { currentHarness } from "#testing/functions/current-harness.function";
import { deliverRemoteEvent } from "#testing/functions/deliver-remote-event.function";
import { drainOutbox } from "#testing/functions/drain-outbox.function";
import { OutboxFake } from "#testing/outbox.fake";

class OrderPlaced extends IntegrationEvent({ name: "order.placed" }) {
  orderId!: string;
}

class PointsSettled extends IntegrationEvent({ name: "points.settled" }) {
  orderId!: string;
}

registerSchemas([
  [OrderPlaced, z.object({ orderId: z.string() })],
  [PointsSettled, z.object({ orderId: z.string() })],
]);

/** Writes PointsSettled to the outbox, as a listener's unit of work would. */
class SettleListener extends Listener {
  readonly orders: string[] = [];

  async handle(event: OrderPlaced): Promise<void> {
    this.orders.push(event.orderId);
    await currentHarness().outbox.write([
      {
        event: PointsSettled.create({ orderId: event.orderId }),
        meta: { id: `evt_settled_${event.orderId}`, occurredAt: new Date(0) },
      },
    ]);
  }
}

class AuditListener extends Listener {
  readonly settled: string[] = [];

  async handle(event: PointsSettled): Promise<void> {
    this.settled.push(event.orderId);
  }
}

class MemoryEventOutboxDriver extends Driver(EventOutbox) {
  async write(_records: readonly RecordedEvent[]): Promise<void> {}
}

class FixtureModule extends Module {}

registerListeners([
  [OrderPlaced, SettleListener],
  [PointsSettled, AuditListener],
]);
registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [
    { module: "fixture", provide: SettleListener, deps: [] },
    { module: "fixture", provide: AuditListener, deps: [] },
  ],
});

describe(drainOutbox, () => {
  it("relays the outbox and settles the chain it starts", async () => {
    const outbox = new OutboxFake();
    const app = await createTestingModule(FixtureModule).override(EventOutbox, outbox).compile();
    await outbox.write([
      {
        event: OrderPlaced.create({ orderId: "ord_1" }),
        meta: { id: "evt_placed", occurredAt: new Date(0) },
      },
    ]);

    const deliveries = await drainOutbox();

    expect(deliveries).toHaveLength(2);
    expect(app.get(SettleListener).orders).toEqual(["ord_1"]);
    expect(app.get(AuditListener).settled).toEqual(["ord_1"]);
    expect(await drainOutbox()).toEqual([]);
    expect(app.events.published().ofType(PointsSettled)).toHaveLength(1);
  });

  it("runs a redelivered id once and an id-less delivery every time", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    await deliverRemoteEvent(OrderPlaced, { orderId: "ord_1" }, { id: "evt_1" });
    await deliverRemoteEvent(OrderPlaced, { orderId: "ord_1" }, { id: "evt_1" });
    await deliverRemoteEvent(OrderPlaced, { orderId: "ord_2" });
    await deliverRemoteEvent(OrderPlaced, { orderId: "ord_2" });
    await drainOutbox();
    await deliverRemoteEvent(OrderPlaced, { orderId: "ord_1" }, { id: "evt_1" });
    await drainOutbox();

    expect(app.get(SettleListener).orders).toEqual(["ord_1", "ord_2", "ord_2"]);
    expect(app.listeners.calls(SettleListener)).toHaveLength(3);
  });

  it("refuses an outbox that is not the fake", async () => {
    await createTestingModule(FixtureModule)
      .override(EventOutbox, new MemoryEventOutboxDriver())
      .compile();
    await expect(drainOutbox()).rejects.toThrow(/OutboxFake/);
  });

  it("refuses an outbox row that is not an event", async () => {
    const outbox = new OutboxFake();
    await createTestingModule(FixtureModule).override(EventOutbox, outbox).compile();
    await outbox.write([
      { event: { orderId: "ord_1" }, meta: { id: "evt_x", occurredAt: new Date(0) } },
    ]);
    await expect(drainOutbox()).rejects.toThrow(TypeError);
  });
});
