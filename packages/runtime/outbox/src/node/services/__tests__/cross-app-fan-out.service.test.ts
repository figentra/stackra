/**
 * Stackra file contract:
 * Purpose: unit tests of `CrossAppFanOut` and its call from `OutboxRelayService.publish`: one delivery per subscriber
 *          whose events include each published versioned type (an older version under the same id included), with
 *          `envelopeVersion` set and no `producer`; nothing for a type nobody takes (a sibling's event); a relay retry
 *          writes nothing twice; without a bound fan-out the relay publishes as before; a failing fan-out fails the
 *          outbox message, which is retried.
 * Boundary: test only; the memory stores, the memory lock driver, a recording publisher, a stand-in database, a fixed
 *           clock and a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 17; P-007, P-009).
 */
import type { Resolver } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { IntegrationEvent } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { Change, registerChanges } from "@stackra/versioning";
import { z } from "zod";

import { OutboxConfig } from "#config/outbox.config";
import { DeliveryDriver, EventPublisher, MessageKind, SubscriberSource } from "#contracts/index";
import type { Delivery, EventEnvelope, OutboxMessage } from "#contracts/index";
import { relayConfig } from "#core/__tests__/fixtures/relay-key.fixture";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { CrossAppFanOut } from "#node/services/cross-app-fan-out.service";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class PaymentCaptured extends IntegrationEvent({
  name: "payment.captured",
  version: 2,
}) {
  paymentId!: string;

  amount!: number;
}

class PaymentCapturedV1Change extends Change<PaymentCaptured>({
  from: 1,
  sunset: "2027-06-01",
}) {
  paymentId!: string;

  up(v1: PaymentCapturedV1Change): PaymentCaptured {
    return PaymentCaptured.create({ paymentId: v1.paymentId, amount: 0 });
  }

  down(v2: PaymentCaptured): PaymentCapturedV1Change {
    return PaymentCapturedV1Change.create({ paymentId: v2.paymentId });
  }
}

registerSchemas([
  [PaymentCaptured, z.object({ paymentId: z.string(), amount: z.number() })],
  [PaymentCapturedV1Change, z.object({ paymentId: z.string() })],
]);
registerEventNames([{ type: PaymentCaptured, name: "payments.payment.captured.v2" }]);
registerChanges([[PaymentCaptured, PaymentCapturedV1Change]]);

class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: EventEnvelope[] = [];

  async publish(envelope: EventEnvelope): Promise<void> {
    this.published.push(envelope);
  }
}

/** The relay configuration: billing takes v2 and the refund, os takes v1. */
const SOURCE = new ConfigSubscriberSourceDriver(
  relayConfig({
    subscribers: [
      {
        member: "billing",
        inbox: "https://billing.example.com",
        events: ["payments.payment.captured.v2", "payments.refund.issued.v1"],
      },
      { member: "os", inbox: "https://os.example.com", events: ["payments.payment.captured.v1"] },
    ],
  }),
);

/** An event message due at noon. */
function eventMessage(fields: Partial<OutboxMessage> = {}): OutboxMessage {
  return {
    id: "evt_A",
    kind: MessageKind.Event,
    type: "payments.payment.captured.v2",
    data: { paymentId: "pay_1", amount: 5 },
    meta: {},
    occurredAt: NOON,
    attempts: 0,
    availableAt: NOON,
    ...fields,
  };
}

/** A relay over memory stores, connected to a resolver that binds `bound`. */
function relayOf(bound: readonly (readonly [AnyClass, object])[]) {
  const store = new MemoryOutboxDriver();
  const publisher = new RecordingPublisher();
  const database = {
    transaction: async <T>(work: () => Promise<T>) => work(),
    withScope: async <T>(_scope: unknown, work: () => Promise<T>) => work(),
  } as unknown as Database;
  const map = new Map<AnyClass, object>(bound);
  const resolver: Resolver = {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
  const relay = new OutboxRelayService(
    store,
    new MemoryChangeFeedDriver(),
    publisher,
    new Locks(new MemoryLockDriver(clock), clock),
    database,
    clock,
    buildConfig(OutboxConfig),
  );
  relay.connect(resolver);
  return { relay, store, publisher };
}

/** The subscriber and type of each stored delivery. */
async function targets(driver: MemoryDeliveryDriver) {
  return (await stored(driver)).map(({ subscriber, type }) => [subscriber, type]);
}

/** Every stored delivery, oldest first. */
async function stored(driver: MemoryDeliveryDriver) {
  const claims = await driver.list({ limit: 100 });
  return Promise.all(claims.map(async (claim) => (await driver.load(claim.id)) as Delivery));
}

describe(CrossAppFanOut, () => {
  it("writes one delivery per subscriber of each published version, with envelopeVersion and no producer", async () => {
    const deliveries = new MemoryDeliveryDriver();
    const { relay, store } = relayOf([[CrossAppFanOut, new CrossAppFanOut(SOURCE, deliveries)]]);
    await store.write([eventMessage()]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(await targets(deliveries)).toEqual([
      ["billing", "payments.payment.captured.v2"],
      ["os", "payments.payment.captured.v1"],
    ]);
    const [billing, os] = await stored(deliveries);
    expect(billing?.id).toMatch(/^dlv_/);
    expect(billing).toMatchObject({ eventId: "evt_A", attempts: 0, availableAt: NOON });
    expect(billing?.envelope).toMatchObject({
      id: "evt_A",
      envelopeVersion: 1,
      data: { paymentId: "pay_1", amount: 5 },
    });
    expect(os?.envelope).toMatchObject({ id: "evt_A", data: { paymentId: "pay_1" } });
    expect(billing?.envelope).not.toHaveProperty("producer");
    expect(store.stored()).toEqual([]);
  });

  it("writes nothing for a type no subscriber takes, such as a sibling's event", async () => {
    const deliveries = new MemoryDeliveryDriver();
    const { relay, store, publisher } = relayOf([
      [CrossAppFanOut, new CrossAppFanOut(SOURCE, deliveries)],
    ]);
    await store.write([eventMessage({ type: "orders.order.paid.v1", data: { orderId: "o" } })]);
    await relay.relay();
    expect(publisher.published).toHaveLength(1);
    expect(await targets(deliveries)).toEqual([]);
  });

  it("writes nothing twice when a fan-out runs again for the same event", async () => {
    const deliveries = new MemoryDeliveryDriver();
    const fanOut = new CrossAppFanOut(SOURCE, deliveries);
    const envelope: EventEnvelope = {
      id: "evt_B",
      type: "payments.refund.issued.v1",
      occurredAt: NOON.toISOString(),
      meta: {},
      data: {},
    };
    await fanOut.fanOut([envelope], NOON);
    await fanOut.fanOut([envelope], NOON);
    expect(await targets(deliveries)).toEqual([["billing", "payments.refund.issued.v1"]]);
  });

  it("leaves the relay as before when no fan-out is bound", async () => {
    const { relay, store, publisher } = relayOf([]);
    await store.write([eventMessage()]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(publisher.published.map((each) => each.type)).toEqual([
      "payments.payment.captured.v2",
      "payments.payment.captured.v1",
    ]);
  });

  it("fails the outbox message when the fan-out fails, and writes single rows on its retry", async () => {
    class FlakyDeliveries extends MemoryDeliveryDriver {
      failing = true;

      override write(deliveries: readonly Delivery[]): Promise<void> {
        if (this.failing) return Promise.reject(new TypeError("database down"));
        return super.write(deliveries);
      }
    }
    const deliveries = new FlakyDeliveries();
    const { relay, store } = relayOf([[CrossAppFanOut, new CrossAppFanOut(SOURCE, deliveries)]]);
    await store.write([eventMessage()]);
    await relay.relay();
    expect(store.stored()).toEqual([
      expect.objectContaining({ id: "evt_A", attempts: 1, lastError: expect.anything() }),
    ]);
    deliveries.failing = false;
    await new CrossAppFanOut(SOURCE, deliveries).fanOut(
      [{ id: "evt_A", type: "payments.payment.captured.v2", occurredAt: "", meta: {}, data: {} }],
      NOON,
    );
    await new CrossAppFanOut(SOURCE, deliveries).fanOut(
      [{ id: "evt_A", type: "payments.payment.captured.v2", occurredAt: "", meta: {}, data: {} }],
      NOON,
    );
    expect(await targets(deliveries)).toEqual([["billing", "payments.payment.captured.v2"]]);
  });

  it("is built from the two ports", () => {
    expect(SOURCE).toBeInstanceOf(SubscriberSource);
    expect(new MemoryDeliveryDriver()).toBeInstanceOf(DeliveryDriver);
  });
});
