/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeBroadcaster`: an occurrence becomes a data-free broadcast on the derived channel with
 *          the route's permission and the occurrence id, a principal audience goes to the principal's channel, the
 *          template's events reach the matching sessions end to end through the memory driver, and an occurrence
 *          without its audience id rejects without publishing.
 * Boundary: test only; the events are built with `@stackra/events`' kinds and registered schemas.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (amendment item 7); ADR 0225 (notes of 0294 and 2026-10-23).
 */
import { buildConfig } from "@stackra/config";
import { Service } from "@stackra/container";
import { Realm } from "@stackra/contracts";
import { BroadcastAudience } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import { MemoryRealtimeDriver } from "#core/drivers/memory-realtime.driver";
import { RealtimeBroadcaster } from "#core/services/realtime-broadcaster.service";
import { RealtimeHub } from "#core/services/realtime-hub.service";
import type { BroadcastRoute } from "#core/types/broadcast-route.type";

const ORDER_PAID: BroadcastRoute = {
  name: "orders.order.paid.v1",
  module: "orders",
  permission: "orders.order.read",
  audience: BroadcastAudience.Tenant,
};

const INBOX_CREATED: BroadcastRoute = {
  name: "messages.inbox_message.created.v1",
  module: "messages",
  permission: "messages.inbox_message.read",
  audience: BroadcastAudience.Principal,
};

/** The paid order the template's commerce service records. */
const PAID: RecordedEvent = {
  event: {
    orderId: "ord_1",
    customerId: "usr_7",
    paymentId: "pay_1",
    totalMinor: 100,
    currency: "USD",
  },
  meta: { id: "evt_1", occurredAt: new Date(0), tenantId: "ten_1" },
};

/** A driver that records what it is asked to publish. */
class RecordingDriver extends RealtimeDriver {
  readonly published: RealtimeBroadcast[] = [];

  publish(broadcast: RealtimeBroadcast): Promise<number> {
    this.published.push(broadcast);
    return Promise.resolve(0);
  }
}

describe("RealtimeBroadcaster", () => {
  it("publishes a data-free message on the tenant channel", async () => {
    const driver = new RecordingDriver();
    const broadcaster = new RealtimeBroadcaster(driver);
    expect(broadcaster).toBeInstanceOf(Service);
    await broadcaster.broadcast(PAID, ORDER_PAID);
    expect(driver.published).toEqual([
      {
        permission: "orders.order.read",
        message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
      },
    ]);
    expect(JSON.stringify(driver.published)).not.toContain("totalMinor");
  });

  it("publishes a principal audience on the principal's channel", async () => {
    const driver = new RecordingDriver();
    const created: RecordedEvent = {
      event: { inboxMessageId: "inm_1", principalId: "usr_3", kind: "order_paid" },
      meta: { id: "evt_2", occurredAt: new Date(0), tenantId: "ten_1" },
    };
    await new RealtimeBroadcaster(driver).broadcast(created, INBOX_CREATED);
    expect(driver.published[0]?.message.channel).toBe("principal.usr_3.messages");
  });

  it("reaches the matching sessions end to end", async () => {
    const hub = new RealtimeHub(
      buildConfig(RealtimeConfig, { values: { channelRealms: [Realm.Tenant] } }),
    );
    const driver = new MemoryRealtimeDriver(hub);
    const staff: RealtimeMessage[] = [];
    const customer: RealtimeMessage[] = [];
    const base = { principalId: "usr_1", tenantId: "ten_1", permissions: ["orders.order.read"] };
    driver.connect(hub.issueToken({ ...base, realm: Realm.Tenant }).token, (m) => staff.push(m));
    driver.connect(hub.issueToken({ ...base, realm: Realm.Customer }).token, (m) =>
      customer.push(m),
    );
    await expect(new RealtimeBroadcaster(driver).broadcast(PAID, ORDER_PAID)).resolves.toBe(1);
    expect(staff.map((m) => m.name)).toEqual(["orders.order.paid.v1"]);
    expect(customer).toEqual([]);
  });

  it("rejects without publishing when the occurrence names no audience id", async () => {
    const driver = new RecordingDriver();
    const untenanted: RecordedEvent = { ...PAID, meta: { id: "evt_3", occurredAt: new Date(0) } };
    await expect(new RealtimeBroadcaster(driver).broadcast(untenanted, ORDER_PAID)).rejects.toThrow(
      TypeError,
    );
    expect(driver.published).toEqual([]);
  });
});
