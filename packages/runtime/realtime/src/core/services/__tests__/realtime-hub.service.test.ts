/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeHub`: tokens are one-time and expire after `subscribeTokenTtl`, a joined peer gets
 *          only the broadcasts its session may receive and is closed at expiry, leaving is idempotent, a throwing peer
 *          is dropped without stopping the fan-out, and the realm list narrows tenant channels.
 * Boundary: test only; timers and `Date` are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigLayers } from "@stackra/config";
import { Service } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import type { RealtimeSession } from "#contracts/types/realtime-session.type";
import { RealtimeHub } from "#core/services/realtime-hub.service";

const STAFF: RealtimeSession = {
  principalId: "usr_1",
  tenantId: "ten_1",
  realm: Realm.Tenant,
  permissions: ["orders.order.read"],
};

const PAID = {
  permission: "orders.order.read",
  message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
};

/** A hub over the default configuration with `layers` applied. */
function hubOf(layers: ConfigLayers<RealtimeConfig> = {}): RealtimeHub {
  return new RealtimeHub(buildConfig(RealtimeConfig, layers));
}

/** A peer that records what it receives and whether it was closed. */
function recorder() {
  const received: RealtimeMessage[] = [];
  const peer = {
    closed: false,
    deliver: (message: RealtimeMessage): void => {
      received.push(message);
    },
    close: (): void => {
      peer.closed = true;
    },
  };
  return { received, peer };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RealtimeHub", () => {
  it("is a service that issues tokens valid for subscribeTokenTtl", () => {
    vi.setSystemTime(new Date("2026-10-24T09:00:00Z"));
    const hub = hubOf();
    expect(hub).toBeInstanceOf(Service);
    const issued = hub.issueToken(STAFF);
    expect(issued.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(issued.expiresAt).toEqual(new Date("2026-10-24T09:15:00Z"));
    expect(hub.issueToken(STAFF).token).not.toBe(issued.token);
  });

  it("redeems a token once and refuses an unknown or expired one", () => {
    const hub = hubOf({ values: { subscribeTokenTtl: Duration.seconds(30) } });
    const { token } = hub.issueToken(STAFF);
    const { peer } = recorder();
    expect(hub.join(token, peer)).toBeTypeOf("function");
    expect(hub.join(token, peer)).toBeUndefined();
    expect(hub.join("unknown", peer)).toBeUndefined();
    const late = hub.issueToken(STAFF).token;
    vi.advanceTimersByTime(30_000);
    expect(hub.join(late, peer)).toBeUndefined();
    expect(hub.size).toBe(1);
  });

  it("delivers only what the session may receive", () => {
    const hub = hubOf();
    const staff = recorder();
    const other = recorder();
    hub.join(hub.issueToken(STAFF).token, staff.peer);
    hub.join(
      hub.issueToken({ ...STAFF, principalId: "usr_2", tenantId: "ten_2" }).token,
      other.peer,
    );
    expect(hub.publish(PAID)).toBe(1);
    expect(hub.publish({ ...PAID, permission: "orders.order.refund" })).toBe(0);
    expect(staff.received).toEqual([PAID.message]);
    expect(other.received).toEqual([]);
  });

  it("narrows tenant channels to the configured realms", () => {
    const hub = hubOf({ values: { channelRealms: [Realm.Tenant] } });
    const customer = recorder();
    hub.join(hub.issueToken({ ...STAFF, realm: Realm.Customer }).token, customer.peer);
    expect(hub.publish(PAID)).toBe(0);
  });

  it("closes a peer when its token expires and lets it leave once", () => {
    const hub = hubOf({ values: { subscribeTokenTtl: Duration.minutes(5) } });
    const { peer } = recorder();
    hub.join(hub.issueToken(STAFF).token, peer);
    vi.advanceTimersByTime(5 * 60_000);
    expect(peer.closed).toBe(true);
    expect(hub.size).toBe(0);
    const second = recorder();
    const leave = hub.join(hub.issueToken(STAFF).token, second.peer);
    leave?.();
    leave?.();
    vi.advanceTimersByTime(5 * 60_000);
    expect(second.peer.closed).toBe(false);
    expect(hub.size).toBe(0);
  });

  it("drops a throwing peer and keeps fanning out", () => {
    const hub = hubOf();
    const healthy = recorder();
    hub.join(hub.issueToken(STAFF).token, {
      deliver: () => {
        throw new Error("socket closed");
      },
      close: () => undefined,
    });
    hub.join(hub.issueToken(STAFF).token, healthy.peer);
    expect(hub.publish(PAID)).toBe(1);
    expect(healthy.received).toHaveLength(1);
    expect(hub.size).toBe(1);
  });
});
