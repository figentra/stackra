/**
 * Stackra file contract:
 * Purpose: the fault-injection tests of `OutboxRelayService` (ADR 0182 decision 4), relaying into this service's own
 *          inbox (`InboxEventPublisherDriver`) on the memory stores, with faults injected into the transport and the
 *          outbox store. A transport that fails before delivering keeps the message, backs it off and delivers it once
 *          it answers. A transport that delivers and loses its answer makes the relay publish again under the same id,
 *          and the inbox runs the listener once. A store that cannot delete a delivered message (or deletes it and
 *          loses its answer) makes the relay publish it again, and the listener still runs once. A store that cannot
 *          claim, or cannot record a retry, fails the tick and loses nothing: the message is delivered on a later tick.
 *          Nothing is dead-lettered by any of these faults.
 * Boundary: test only; the memory outbox, change feed, inbox and lock drivers, `injectFaults` around the publisher
 *           and the outbox store, a clock a test moves, and a stand-in database that runs the work. The database faults
 *           of the same paths are in `outbox-relay.service.fault.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the fault-injection tests in the unit tier); ADR 0078 (decisions 2
 *                     and 4: at least once, the inbox deduplicates by id); ADR 0149 (one runner under a lock).
 */
import type { Resolver } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import type { AnyClass } from "@stackra/container";
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { EventBus, IntegrationEvent, Listener } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, InjectedFaultError, injectFaults, it } from "@stackra/testing";
import type { FaultRule } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { OutboxConfig } from "#config/outbox.config";
import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { InboxEventPublisherDriver } from "#node/drivers/inbox-event-publisher.driver";
import { InboxService } from "#node/services/inbox.service";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

const NOON = new Date(Date.UTC(2026, 10, 26, 12));

/** Past every backoff the tests below wait for. */
const LATER = new Date(NOON.getTime() + 60 * 60_000);

class InvoiceIssued extends IntegrationEvent({
  name: "invoice.issued",
}) {
  invoiceId!: string;
}

registerSchemas([[InvoiceIssued, z.object({ invoiceId: z.string() })]]);
registerEventNames([{ type: InvoiceIssued, name: "billing.invoice.issued.v1" }]);

/** Counts each invoice it is told about: the effect at-least-once must not double. */
class SendInvoiceListener extends Listener {
  readonly sent: string[] = [];

  async handle(event: InvoiceIssued): Promise<void> {
    this.sent.push(event.invoiceId);
  }
}

/** The invoice event message `id`, due at noon. */
function issued(id: OutboxMessage["id"], invoiceId: string): OutboxMessage {
  return {
    id,
    kind: MessageKind.Event,
    type: "billing.invoice.issued.v1",
    data: { invoiceId },
    meta: { correlationId: `call-${invoiceId}` },
    occurredAt: NOON,
    attempts: 0,
    availableAt: NOON,
  };
}

/**
 * A relay into this service's inbox over memory stores, with `storeFaults` injected into the outbox store and
 * `transportFaults` into the publisher; `at(date)` moves its clock.
 */
function setup(
  storeFaults: readonly FaultRule<keyof MemoryOutboxDriver & string>[] = [],
  transportFaults: readonly FaultRule<keyof InboxEventPublisherDriver & string>[] = [],
) {
  let now = NOON;
  const clock = { now: () => new Date(now) } as Clock;
  const database = {
    transaction: async <T>(work: () => Promise<T>) => work(),
    withScope: async <T>(_scope: ScopeRef | readonly ScopeRef[], work: () => Promise<T>) => work(),
  } as unknown as Database;
  const bus = new EventBus(clock);
  const listener = new SendInvoiceListener();
  bus.subscribe(InvoiceIssued, listener);
  const inbox = new InboxService(new MemoryInboxDriver(), bus, database, clock);
  const real = new MemoryOutboxDriver();
  const store = injectFaults(real, storeFaults);
  const transport = injectFaults(new InboxEventPublisherDriver(inbox), transportFaults);
  const relay = new OutboxRelayService(
    store.target,
    new MemoryChangeFeedDriver(),
    transport.target,
    new Locks(new MemoryLockDriver(clock), clock),
    database,
    clock,
    buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
  );
  const bound = new Map<AnyClass, object>();
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  relay.connect(resolver);
  return {
    relay,
    real,
    store,
    transport,
    listener,
    at: (date: Date) => {
      now = date;
    },
  };
}

describe("OutboxRelayService under injected faults", () => {
  it("keeps and backs off a message the transport could not take, then delivers it once", async () => {
    const { relay, real, transport, listener, at } = setup(
      [],
      [{ method: "publish", calls: "every" }],
    );
    await real.write([issued("evt_A", "inv_1")]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(listener.sent).toEqual([]);
    const [kept] = real.stored();
    expect(kept).toMatchObject({ id: "evt_A", attempts: 1, lastError: { code: "internal" } });
    expect(kept?.availableAt.getTime()).toBeGreaterThan(NOON.getTime());
    // not due yet: nothing is sent again inside the backoff
    await expect(relay.relay()).resolves.toBe(0);
    transport.heal();
    at(LATER);
    await expect(relay.relay()).resolves.toBe(1);
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toEqual([]);
  });

  it("publishes again when the transport delivered and lost its answer, and the inbox runs the listener once", async () => {
    const { relay, real, transport, listener, at } = setup(
      [],
      [{ method: "publish", when: "after" }],
    );
    await real.write([issued("evt_A", "inv_1")]);
    await relay.relay();
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toMatchObject([{ id: "evt_A", attempts: 1 }]);
    at(LATER);
    await relay.relay();
    expect(transport.callsOf("publish").map((call) => (call.args[0] as { id: string }).id)).toEqual(
      ["evt_A", "evt_A"],
    );
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toEqual([]);
  });

  it("publishes again when the store cannot delete a delivered message, and the listener runs once", async () => {
    const { relay, real, store, listener, at } = setup([{ method: "remove" }]);
    await real.write([issued("evt_A", "inv_1")]);
    await relay.relay();
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toMatchObject([{ id: "evt_A", attempts: 1 }]);
    at(LATER);
    await relay.relay();
    expect(store.callsOf("remove")).toHaveLength(2);
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toEqual([]);
  });

  it("keeps no message and runs the listener once when the store deletes and loses the answer", async () => {
    const { relay, real, listener, at } = setup([{ method: "remove", when: "after" }]);
    await real.write([issued("evt_A", "inv_1"), issued("evt_B", "inv_2")]);
    await relay.relay();
    at(LATER);
    await relay.relay();
    expect(listener.sent).toEqual(["inv_1", "inv_2"]);
    expect(real.stored()).toEqual([]);
  });

  it("fails the tick when the store cannot claim, and delivers the message on the next", async () => {
    const { relay, real, listener } = setup([{ method: "claim" }]);
    await real.write([issued("evt_A", "inv_1")]);
    await expect(relay.relay()).rejects.toBeInstanceOf(InjectedFaultError);
    expect(real.stored()).toMatchObject([{ id: "evt_A", attempts: 0 }]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(listener.sent).toEqual(["inv_1"]);
  });

  it("fails the tick when the store cannot record a retry, and loses nothing", async () => {
    const { relay, real, transport, listener } = setup(
      [{ method: "retry" }],
      [{ method: "publish" }],
    );
    await real.write([issued("evt_A", "inv_1")]);
    await expect(relay.relay()).rejects.toBeInstanceOf(InjectedFaultError);
    // the failed delivery was not recorded: still due at once, no attempt counted
    expect(real.stored()).toMatchObject([{ id: "evt_A", attempts: 0, availableAt: NOON }]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(transport.callsOf("publish")).toHaveLength(2);
    expect(listener.sent).toEqual(["inv_1"]);
    expect(real.stored()).toEqual([]);
  });
});
