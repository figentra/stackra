/**
 * Stackra file contract:
 * Purpose: unit tests of `InboxService`: a received event is rebuilt from its envelope and runs its listeners once with
 *          its id, time and metadata; a redelivery of the id runs nothing; each receipt runs in the event's scope or in
 *          none; an unknown wire name is refused before any claim; `prune` forgets old ids.
 * Boundary: test only; the memory inbox, the real bus with a fixed clock, and a stand-in database that records the
 *           scopes it opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decisions 2 to 4); ADR 0327 (decision 9).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { EventBus, IntegrationEvent, Listener, type ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { EventEnvelope } from "#contracts/index";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
import { UnknownEventError } from "#core/errors/unknown-event.error";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { InboxService } from "#node/services/inbox.service";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {
  orderId!: string;
}

class OrderShipped extends IntegrationEvent({ name: "order.shipped" }) {
  orderId!: string;
}

registerSchemas([
  [OrderPaid, z.object({ orderId: z.string() })],
  [OrderShipped, z.object({ orderId: z.string() })],
]);
registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);

class RecordingListener extends Listener {
  readonly seen: { event: OrderPaid; ctx: ListenerContext }[] = [];

  async handle(event: OrderPaid, ctx: ListenerContext): Promise<void> {
    this.seen.push({ event, ctx });
  }
}

/** An inbox over a fresh bus with one listener, and the scopes its database opened. */
function inboxWithListener() {
  const bus = new EventBus(clock);
  const listener = new RecordingListener();
  bus.subscribe(OrderPaid, listener);
  const scopes: (ScopeRef | readonly ScopeRef[])[] = [];
  const database = {
    withScope: async <T>(scope: ScopeRef | readonly ScopeRef[], work: () => Promise<T>) => {
      scopes.push(scope);
      return work();
    },
  } as unknown as Database;
  const driver = new MemoryInboxDriver();
  return { inbox: new InboxService(driver, bus, database, clock), listener, scopes, driver };
}

/** The envelope of an `orders.order.paid.v1` occurrence. */
function envelope(fields: Partial<EventEnvelope> = {}): EventEnvelope {
  return {
    id: "evt_A",
    type: "orders.order.paid.v1",
    occurredAt: "2026-10-25T11:59:00.000Z",
    meta: { correlationId: "call-1" },
    data: { orderId: "ord_1" },
    ...fields,
  };
}

describe(InboxService, () => {
  it("runs the listeners of a received event once, with its id, time and metadata", async () => {
    const { inbox, listener } = inboxWithListener();
    await expect(inbox.receive(envelope())).resolves.toBe(true);
    await expect(inbox.receive(envelope())).resolves.toBe(false);
    expect(listener.seen).toHaveLength(1);
    const [seen] = listener.seen;
    expect(seen?.event).toBeInstanceOf(OrderPaid);
    expect(seen?.event.orderId).toBe("ord_1");
    expect(seen?.ctx).toMatchObject({
      eventId: "evt_A",
      occurredAt: new Date("2026-10-25T11:59:00.000Z"),
      correlationId: "call-1",
    });
  });

  it("runs each receipt in the event's scope, or in none", async () => {
    const { inbox, scopes } = inboxWithListener();
    await inbox.receive(envelope({ scope: SCOPE }));
    await inbox.receive(envelope({ id: "evt_B" }));
    expect(scopes).toEqual([SCOPE, []]);
  });

  it("refuses an unknown wire name before claiming the id", async () => {
    const { inbox, driver } = inboxWithListener();
    await expect(
      inbox.receive(envelope({ type: "orders.order.shipped.v1" })),
    ).rejects.toBeInstanceOf(UnknownEventError);
    await expect(driver.claim("evt_A", NOON)).resolves.toBe(true);
  });

  it("forgets the ids received before a cut-off", async () => {
    const { inbox, listener } = inboxWithListener();
    await inbox.receive(envelope());
    await inbox.prune(new Date(NOON.getTime() + 1));
    await expect(inbox.receive(envelope())).resolves.toBe(true);
    expect(listener.seen).toHaveLength(2);
  });
});
