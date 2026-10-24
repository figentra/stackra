/**
 * Stackra file contract:
 * Purpose: unit tests of `publishedEvents`: the bus's dispatched events then the outbox fake's written ones, each
 *          occurrence once; `ofType` picks a class and its subclasses; the snapshot is frozen.
 * Boundary: test only; builds a harness by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import type { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent, EventBus } from "#core/index";
import { publishedEvents } from "#testing/functions/published-events.function";
import { OutboxFake } from "#testing/outbox.fake";
import type { EventsHarness } from "#testing/types/events-harness.type";

const clock = { now: () => new Date(0) } as Clock;

class StockChanged extends DomainEvent {}

class StockLow extends StockChanged {}

class OrderPaid extends DomainEvent {}

describe(publishedEvents, () => {
  it("lists dispatched then written events once each, with ofType", async () => {
    const harness: EventsHarness = {
      bus: new EventBus(clock),
      outbox: new OutboxFake(),
      inbox: [],
      seen: new Set(),
    };
    const low = new StockLow();
    const paid = new OrderPaid();
    const record = harness.bus.dispatch(low);
    await harness.outbox.write([
      record,
      { event: paid, meta: { id: "evt_paid", occurredAt: new Date(0) } },
    ]);

    const published = publishedEvents(harness);

    expect([...published]).toEqual([low, paid]);
    expect(published.ofType(StockChanged)).toEqual([low]);
    expect(published.ofType(OrderPaid)).toEqual([paid]);
    expect(Object.isFrozen(published)).toBe(true);
  });
});
