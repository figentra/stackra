/**
 * Stackra file contract:
 * Purpose: unit tests of the `EventPublisher` port: it is a `Port` whose class is its token, keyed
 *          `outbox.EventPublisher`, and a driver subclass receives each envelope.
 * Boundary: test only; a recording in-test driver stands in for a transport.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (decision 1).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EventPublisher } from "#contracts/ports/event-publisher.port";
import type { EventEnvelope } from "#contracts/types/event-envelope.type";

/** A transport that keeps what it is given. */
class RecordingEventPublisher extends Driver(EventPublisher) {
  readonly published: EventEnvelope[] = [];

  async publish(envelope: EventEnvelope): Promise<void> {
    this.published.push(envelope);
  }
}

describe("EventPublisher", () => {
  it("is a port a driver implements", async () => {
    const driver = new RecordingEventPublisher();
    const envelope: EventEnvelope = {
      id: "evt_1",
      type: "orders.order.paid.v1",
      occurredAt: "2026-10-25T12:00:00.000Z",
      meta: {},
      data: { orderId: "ord_1" },
    };
    expect(driver).toBeInstanceOf(EventPublisher);
    expect(driver).toBeInstanceOf(Port);
    await driver.publish(envelope);
    expect(driver.published).toEqual([envelope]);
  });

  it("is keyed outbox.EventPublisher", () => {
    expectTypeOf<EventPublisher["~key"]>().toEqualTypeOf<"outbox.EventPublisher">();
  });
});
