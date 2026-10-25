/**
 * Stackra file contract:
 * Purpose: unit tests of `InboxEventPublisherDriver`: it is an `EventPublisher` that hands each envelope to this
 *          service's inbox, and a rejection of the inbox reaches the relay.
 * Boundary: test only; a stand-in inbox records what it receives.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { EventPublisher } from "#contracts/index";
import type { EventEnvelope } from "#contracts/index";
import { InboxEventPublisherDriver } from "#node/drivers/inbox-event-publisher.driver";
import type { InboxService } from "#node/services/inbox.service";

const ENVELOPE: EventEnvelope = {
  id: "evt_A",
  type: "orders.order.paid.v1",
  occurredAt: "2026-10-25T12:00:00.000Z",
  meta: {},
  data: { orderId: "ord_1" },
};

describe(InboxEventPublisherDriver, () => {
  it("is an EventPublisher that publishes into the inbox", async () => {
    const received: EventEnvelope[] = [];
    const inbox = {
      receive: async (envelope: EventEnvelope) => {
        received.push(envelope);
        return true;
      },
    } as unknown as InboxService;
    const publisher = new InboxEventPublisherDriver(inbox);
    expect(publisher).toBeInstanceOf(EventPublisher);
    await publisher.publish(ENVELOPE);
    expect(received).toEqual([ENVELOPE]);
  });

  it("passes the inbox's refusal on", async () => {
    const inbox = {
      receive: async () => {
        throw new TypeError("unknown");
      },
    } as unknown as InboxService;
    await expect(new InboxEventPublisherDriver(inbox).publish(ENVELOPE)).rejects.toThrow("unknown");
  });
});
