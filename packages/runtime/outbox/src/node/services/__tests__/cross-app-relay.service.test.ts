/**
 * Stackra file contract:
 * Purpose: tests of `CrossAppRelayService`: a 2xx deletes a delivery; a 5xx, 408, 429 or network error retries it
 *          later; another 4xx or the last attempt dead-letters it and logs it; a failing subscriber stops at its first
 *          failure while another subscriber's deliveries go out in the same tick; a delivery whose subscriber is gone
 *          is dropped; each request is signed and posted to the subscriber's inbox route; a dead delivery is replayed.
 * Boundary: test only; memory delivery store and locks, a recording transport and signer, a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decisions 12, 13 and 17).
 */
import type { Resolver } from "@stackra/actions";
import { type AnyClass, Driver } from "@stackra/container";
import { type Clock, Logger, type PublicId } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";

import type { CrossAppConfig } from "#config/cross-app.config";
import { DeliveryTransport, EventSigner } from "#contracts/index";
import type { CrossAppEnvelope, Delivery } from "#contracts/index";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
import { CrossAppRelayService } from "#node/services/cross-app-relay.service";

const NOON = new Date(Date.UTC(2026, 10, 2, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class FixedSigner extends Driver(EventSigner) {
  async sign(id: string): Promise<Readonly<Record<string, string>>> {
    return { "webhook-id": id, "webhook-signature": "v1a,k,sig" };
  }
}

class RecordingTransport extends Driver(DeliveryTransport) {
  readonly posts: { url: string; id: string | undefined }[] = [];

  /** Status per origin; a thrown error when the value is an Error. */
  answers = new Map<string, number | Error>();

  async post(url: string, headers: Readonly<Record<string, string>>): Promise<number> {
    this.posts.push({ url, id: headers["webhook-id"] });
    const answer = this.answers.get(new URL(url).origin) ?? 204;
    if (answer instanceof Error) throw answer;
    return answer;
  }
}

class RecordingLogger extends Logger {
  readonly lines: { level: string; event: string }[] = [];

  debug(): void {}

  info(): void {}

  warn(event: string): void {
    this.lines.push({ level: "warn", event });
  }

  error(event: string): void {
    this.lines.push({ level: "error", event });
  }
}

/** A delivery of event `eventId` to `subscriber`, created `minute` minutes after noon. */
function delivery(subscriber: string, eventId: string, minute = 0, attempts = 0): Delivery {
  const envelope: CrossAppEnvelope = {
    id: eventId,
    type: "payments.payment.captured.v1",
    occurredAt: NOON.toISOString(),
    meta: {},
    data: { paymentId: "pay_1" },
    envelopeVersion: 1,
  };
  const at = new Date(NOON.getTime() + minute * 60_000 - 3_600_000);
  return {
    id: `dlv_${subscriber}_${eventId}` as PublicId<"dlv">,
    subscriber,
    envelope,
    attempts,
    availableAt: at,
    createdAt: at,
  };
}

/** A relay over memory stores with billing and usage configured. */
function relayOf() {
  const deliveries = new MemoryDeliveryDriver();
  const transport = new RecordingTransport();
  const logger = new RecordingLogger();
  const config = {
    subscribers: [
      {
        member: "billing",
        inbox: "https://billing.test",
        events: ["payments.payment.captured.v1"],
      },
      { member: "usage", inbox: "http://localhost:4013", events: ["payments.payment.captured.v1"] },
    ],
  } as unknown as CrossAppConfig;
  const relay = new CrossAppRelayService(
    deliveries,
    new ConfigSubscriberSourceDriver(config),
    new FixedSigner(),
    transport,
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
  );
  const bound = new Map<AnyClass, object>([[Logger, logger]]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  relay.connect(resolver);
  return { relay, deliveries, transport, logger };
}

describe(CrossAppRelayService, () => {
  // @covers sta-1910:FR-001 @covers sta-1910:FR-002
  it("signs and posts each delivery to its subscriber's inbox route and deletes it on a 2xx", async () => {
    const { relay, deliveries, transport } = relayOf();
    await deliveries.write([delivery("billing", "evt_1")]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(transport.posts).toEqual([
      { url: "https://billing.test/events/inbox", id: "dlv_billing_evt_1" },
    ]);
    expect(deliveries.stored()).toEqual([]);
  });

  // @covers sta-1910:FR-003
  it("retries a 5xx, 408, 429 or network failure later with one attempt counted", async () => {
    for (const answer of [503, 408, 429, new TypeError("connection refused")]) {
      const { relay, deliveries, transport } = relayOf();
      transport.answers.set("https://billing.test", answer);
      await deliveries.write([delivery("billing", "evt_1")]);
      await expect(relay.relay()).resolves.toBe(0);
      const [stored] = deliveries.stored();
      expect(stored?.attempts).toBe(1);
      expect(stored?.deadAt).toBeUndefined();
      expect(stored?.availableAt.getTime()).toBeGreaterThan(NOON.getTime());
    }
  });

  // @covers sta-1910:FR-003
  it("dead-letters a permanent refusal at once, and any failure on the last attempt, and logs it", async () => {
    const { relay, deliveries, transport, logger } = relayOf();
    transport.answers.set("https://billing.test", 401);
    transport.answers.set("http://localhost:4013", 500);
    await deliveries.write([delivery("billing", "evt_1"), delivery("usage", "evt_1", 0, 9)]);
    await relay.relay();
    expect(
      deliveries
        .stored()
        .map((stored) => [stored.subscriber, stored.deadAt !== undefined, stored.lastError?.code]),
    ).toEqual([
      ["billing", true, "http_401"],
      ["usage", true, "http_500"],
    ]);
    expect(logger.lines.filter((line) => line.event === "outbox.delivery_dead")).toHaveLength(2);
  });

  // @covers sta-1910:AC-005 @covers sta-1910:SC-005
  it("stops a failing subscriber at its first failure while another subscriber's deliveries go out", async () => {
    const { relay, deliveries, transport } = relayOf();
    transport.answers.set("https://billing.test", 503);
    await deliveries.write([
      delivery("billing", "evt_1", 0),
      delivery("billing", "evt_2", 1),
      delivery("usage", "evt_1", 0),
      delivery("usage", "evt_2", 1),
    ]);
    await expect(relay.relay()).resolves.toBe(2);
    expect(
      transport.posts.filter((post) => post.url.startsWith("https://billing.test")),
    ).toHaveLength(1);
    expect(
      deliveries.stored().map((stored) => [stored.subscriber, stored.envelope.id, stored.attempts]),
    ).toEqual([
      ["billing", "evt_1", 1],
      ["billing", "evt_2", 0],
    ]);
  });

  it("drops a delivery whose subscriber is no longer configured, and logs it", async () => {
    const { relay, deliveries, transport, logger } = relayOf();
    await deliveries.write([delivery("search", "evt_1")]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(transport.posts).toEqual([]);
    expect(deliveries.stored()).toEqual([]);
    expect(logger.lines).toContainEqual({ level: "warn", event: "outbox.delivery_dropped" });
  });

  // @covers sta-1910:FR-014
  it("lists a dead delivery and replays it once", async () => {
    const { relay, deliveries, transport } = relayOf();
    transport.answers.set("https://billing.test", 404);
    await deliveries.write([delivery("billing", "evt_1")]);
    await relay.relay();
    const [dead] = await relay.list({ subscriber: "billing", state: "dead" });
    expect(dead?.id).toBe("dlv_billing_evt_1");
    await expect(relay.replay("dlv_billing_evt_1" as PublicId<"dlv">)).resolves.toBe(true);
    await expect(relay.replay("dlv_billing_evt_1" as PublicId<"dlv">)).resolves.toBe(false);
    transport.answers.clear();
    await expect(relay.relay()).resolves.toBe(1);
    expect(deliveries.stored()).toEqual([]);
  });
});
