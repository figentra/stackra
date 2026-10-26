/**
 * Stackra file contract:
 * Purpose: the after-commit guarantee for a listener on its own service's integration event (STA-1267): recording the
 *          event, writing it to the outbox and the in-process drain of the commit run nothing; the listener runs once,
 *          in process, only when the relay hands the committed row to the service's own inbox (`drainOutbox()`), and a
 *          rolled-back unit of work never runs it.
 * Boundary: test only; the unit of work is played by hand (`recordEvent`, `takeRecordedEvents`, an `OutboxFake`
 *           write), as in the drainOutbox tests. The broker transport is out of scope: see README "When a listener
 *           runs".
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0078 (decisions 2 to 4); ADR 0142 (decision 1); ADR 0269
 *                     (decision 3).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { EventOutbox } from "#contracts/index";
import {
  IntegrationEvent,
  Listener,
  recordEvent,
  registerListeners,
  takeRecordedEvents,
} from "#core/index";
import "#testing/index";
import { drainEvents } from "#testing/functions/drain-events.function";
import { drainOutbox } from "#testing/functions/drain-outbox.function";
import { OutboxFake } from "#testing/outbox.fake";

class BookingCreated extends IntegrationEvent({ name: "booking.created" }) {
  bookingId!: string;
}

registerSchemas([[BookingCreated, z.object({ bookingId: z.string() })]]);

/** A listener of the same service on its own integration event. */
class HoldSlotListener extends Listener {
  readonly bookings: string[] = [];

  async handle(event: BookingCreated): Promise<void> {
    this.bookings.push(event.bookingId);
  }
}

class SchedulingModule extends Module {}

registerListeners([[BookingCreated, HoldSlotListener]]);
registerWiring({
  member: "scheduling",
  root: SchedulingModule,
  bindings: [{ module: "scheduling", provide: HoldSlotListener, deps: [] }],
});

/** Plays the unit of work up to the commit: takes what `booking` recorded and writes it to the outbox. */
async function flush(booking: object, outbox: OutboxFake, id: string): Promise<void> {
  await outbox.write(
    takeRecordedEvents(booking).map((event) => ({ event, meta: { id, occurredAt: new Date(0) } })),
  );
}

describe("own integration events run after commit", () => {
  it("runs nothing before the relay and the listener once after it", async () => {
    const outbox = new OutboxFake();
    const app = await createTestingModule(SchedulingModule).override(EventOutbox, outbox).compile();
    const listener = app.get(HoldSlotListener);
    const booking = {};

    recordEvent(booking, BookingCreated.create({ bookingId: "bkg_1" }));
    expect(listener.bookings).toEqual([]);

    await flush(booking, outbox, "evt_bkg_1");
    expect(await drainEvents()).toEqual([]);
    expect(listener.bookings).toEqual([]);

    const deliveries = await drainOutbox();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.error).toBeUndefined();
    expect(listener.bookings).toEqual(["bkg_1"]);
  });

  it("runs once when the relay publishes the committed row twice", async () => {
    const outbox = new OutboxFake();
    const app = await createTestingModule(SchedulingModule).override(EventOutbox, outbox).compile();
    const event = BookingCreated.create({ bookingId: "bkg_2" });
    const row = { event, meta: { id: "evt_bkg_2", occurredAt: new Date(0) } };

    await outbox.write([row]);
    await drainOutbox();
    await outbox.write([row]);
    await drainOutbox();

    expect(app.get(HoldSlotListener).bookings).toEqual(["bkg_2"]);
  });

  it("never runs the listener of a rolled-back unit of work", async () => {
    const outbox = new OutboxFake();
    const app = await createTestingModule(SchedulingModule).override(EventOutbox, outbox).compile();
    const booking = {};
    recordEvent(booking, BookingCreated.create({ bookingId: "bkg_3" }));

    takeRecordedEvents(booking); // the rollback: the outbox rows go with the transaction

    expect(await drainEvents()).toEqual([]);
    expect(await drainOutbox()).toEqual([]);
    expect(app.get(HoldSlotListener).bookings).toEqual([]);
  });
});
