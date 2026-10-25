/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxEventOutboxDriver`: it is @stackra/events' `EventOutbox`; it writes each recorded
 *          integration event as one due message under its wire name, in order, with the metadata beside the payload;
 *          it refuses a domain event and writes nothing then.
 * Boundary: test only; the memory store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decisions 3 and 4); ADR 0141 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { OutboxEventOutboxDriver } from "#core/drivers/outbox-event-outbox.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {
  orderId!: string;
}

class PointsRedeemed extends DomainEvent {}

/** A frozen event of `type` holding `fields`, as `X.create` builds one. */
function eventOf<E extends object>(type: AnyClass<E>, fields: object): E {
  return Object.freeze(Object.assign(Object.create(type.prototype as object) as E, fields));
}

describe(OutboxEventOutboxDriver, () => {
  it("is an EventOutbox", () => {
    expect(new OutboxEventOutboxDriver(new MemoryOutboxDriver())).toBeInstanceOf(EventOutbox);
  });

  it("writes each integration event as one due message, in order", async () => {
    const store = new MemoryOutboxDriver();
    const outbox = new OutboxEventOutboxDriver(store);
    await outbox.write([
      {
        event: eventOf(OrderPaid, { orderId: "ord_1" }),
        meta: { id: "evt_A", occurredAt: NOON, correlationId: "call-1" },
      },
      { event: eventOf(OrderPaid, { orderId: "ord_2" }), meta: { id: "evt_B", occurredAt: NOON } },
    ]);
    expect(store.stored()).toEqual([
      {
        id: "evt_A",
        kind: MessageKind.Event,
        type: "order.paid.v1",
        data: { orderId: "ord_1" },
        meta: { correlationId: "call-1" },
        occurredAt: NOON,
        attempts: 0,
        availableAt: NOON,
      },
      expect.objectContaining({ id: "evt_B", data: { orderId: "ord_2" } }),
    ]);
  });

  it("refuses a domain event and writes nothing", async () => {
    const store = new MemoryOutboxDriver();
    const outbox = new OutboxEventOutboxDriver(store);
    await expect(
      outbox.write([
        { event: eventOf(PointsRedeemed, {}), meta: { id: "evt_A", occurredAt: NOON } },
      ]),
    ).rejects.toThrow(TypeError);
    expect(store.stored()).toEqual([]);
  });
});
