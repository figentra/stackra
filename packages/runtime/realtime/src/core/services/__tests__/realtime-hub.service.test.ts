/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeHub`: tokens are one-time and expire after `subscribeTokenTtl`, a joined peer gets
 *          only the broadcasts its session may receive and is closed at expiry, leaving is idempotent, a throwing peer
 *          is dropped without stopping the fan-out, and the realm list narrows tenant channels. With a `tokenKey` a token
 *          is signed: another hub sharing the key and the ledger redeems it once, and a replay, another key and a
 *          tampered token are refused; with none, tokens stay in the issuing hub.
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
import type { RealtimeTokenLedger } from "#contracts/ports/realtime-token-ledger.port";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import type { RealtimeSession } from "#contracts/types/realtime-session.type";
import { MemoryRealtimeTokenLedgerDriver } from "#core/drivers/memory-realtime-token-ledger.driver";
import { RealtimeHub } from "#core/services/realtime-hub.service";

const STAFF: RealtimeSession = {
  principalId: "usr_1",
  scopeId: "ten_1",
  realm: Realm.Staff,
  permissions: ["orders.order.read"],
};

const PAID = {
  permission: "orders.order.read",
  message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
};

/** A signing key of 32 characters. */
const KEY = "k".repeat(32);

/** A hub over the default configuration with `layers` applied; `ledger` is shared by hubs that stand for instances. */
function hubOf(
  layers: ConfigLayers<RealtimeConfig> = {},
  ledger: RealtimeTokenLedger = new MemoryRealtimeTokenLedgerDriver(),
): RealtimeHub {
  return new RealtimeHub(buildConfig(RealtimeConfig, layers), ledger);
}

/** The configuration layers of a hub that signs its tokens with `tokenKey`. */
const signing = (tokenKey: string): ConfigLayers<RealtimeConfig> => ({ values: { tokenKey } });

/** `token` with one character of its payload part changed. */
function tamper(token: string): string {
  const [head = "", payload = "", mac = ""] = token.split(".");
  const index = Math.floor(payload.length / 2);
  const flipped = payload[index] === "A" ? "B" : "A";
  return [head, payload.slice(0, index) + flipped + payload.slice(index + 1), mac].join(".");
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
  it("is a service that issues tokens valid for subscribeTokenTtl", async () => {
    vi.setSystemTime(new Date("2026-10-24T09:00:00Z"));
    const hub = hubOf();
    expect(hub).toBeInstanceOf(Service);
    const issued = await hub.issueToken(STAFF);
    expect(issued.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(issued.expiresAt).toEqual(new Date("2026-10-24T09:15:00Z"));
    expect((await hub.issueToken(STAFF)).token).not.toBe(issued.token);
  });

  it("redeems a token once and refuses an unknown or expired one", async () => {
    const hub = hubOf({ values: { subscribeTokenTtl: Duration.seconds(30) } });
    const { token } = await hub.issueToken(STAFF);
    const { peer } = recorder();
    expect(await hub.join(token, peer)).toBeTypeOf("function");
    await expect(hub.join(token, peer)).resolves.toBeUndefined();
    await expect(hub.join("unknown", peer)).resolves.toBeUndefined();
    expect(hub.size).toBe(1);
    const late = (await hub.issueToken(STAFF)).token;
    vi.advanceTimersByTime(30_000);
    await expect(hub.join(late, peer)).resolves.toBeUndefined();
    // The first join's token expired at the same tick, so it left; the refused join added none.
    expect(hub.size).toBe(0);
  });

  it("delivers only what the session may receive", async () => {
    const hub = hubOf();
    const staff = recorder();
    const other = recorder();
    await hub.join((await hub.issueToken(STAFF)).token, staff.peer);
    await hub.join(
      (await hub.issueToken({ ...STAFF, principalId: "usr_2", scopeId: "ten_2" })).token,
      other.peer,
    );
    expect(hub.publish(PAID)).toBe(1);
    expect(hub.publish({ ...PAID, permission: "orders.order.refund" })).toBe(0);
    expect(staff.received).toEqual([PAID.message]);
    expect(other.received).toEqual([]);
  });

  it("narrows tenant channels to the configured realms", async () => {
    const hub = hubOf({ values: { channelRealms: [Realm.Staff] } });
    const customer = recorder();
    await hub.join(
      (await hub.issueToken({ ...STAFF, realm: Realm.Customer })).token,
      customer.peer,
    );
    expect(hub.publish(PAID)).toBe(0);
  });

  it("closes a peer when its token expires and lets it leave once", async () => {
    const hub = hubOf({ values: { subscribeTokenTtl: Duration.minutes(5) } });
    const { peer } = recorder();
    await hub.join((await hub.issueToken(STAFF)).token, peer);
    vi.advanceTimersByTime(5 * 60_000);
    expect(peer.closed).toBe(true);
    expect(hub.size).toBe(0);
    const second = recorder();
    const leave = await hub.join((await hub.issueToken(STAFF)).token, second.peer);
    leave?.();
    leave?.();
    vi.advanceTimersByTime(5 * 60_000);
    expect(second.peer.closed).toBe(false);
    expect(hub.size).toBe(0);
  });

  it("drops a throwing peer and keeps fanning out", async () => {
    const hub = hubOf();
    const healthy = recorder();
    await hub.join((await hub.issueToken(STAFF)).token, {
      deliver: () => {
        throw new Error("socket closed");
      },
      close: () => undefined,
    });
    await hub.join((await hub.issueToken(STAFF)).token, healthy.peer);
    expect(hub.publish(PAID)).toBe(1);
    expect(healthy.received).toHaveLength(1);
    expect(hub.size).toBe(1);
  });
  describe("signed tokens", () => {
    it("joins on another hub sharing the key and the ledger, and refuses a replay", async () => {
      const ledger = new MemoryRealtimeTokenLedgerDriver();
      const first = hubOf(signing(KEY), ledger);
      const second = hubOf(signing(KEY), ledger);
      const { token } = await first.issueToken(STAFF);
      expect(token).not.toMatch(/^[0-9a-f-]{36}$/);
      const { received, peer } = recorder();
      expect(await second.join(token, peer)).toBeTypeOf("function");
      expect(second.publish(PAID)).toBe(1);
      expect(received).toEqual([PAID.message]);
      expect(first.size).toBe(0);
      await expect(second.join(token, recorder().peer)).resolves.toBeUndefined();
      await expect(first.join(token, recorder().peer)).resolves.toBeUndefined();
    });

    it("refuses a token signed with another key", async () => {
      const ledger = new MemoryRealtimeTokenLedgerDriver();
      const first = hubOf(signing(KEY), ledger);
      const stranger = hubOf(signing("z".repeat(32)), ledger);
      const { token } = await first.issueToken(STAFF);
      await expect(stranger.join(token, recorder().peer)).resolves.toBeUndefined();
    });

    it("refuses a tampered token and leaves the genuine one redeemable", async () => {
      const ledger = new MemoryRealtimeTokenLedgerDriver();
      const first = hubOf(signing(KEY), ledger);
      const { token } = await first.issueToken(STAFF);
      await expect(first.join(tamper(token), recorder().peer)).resolves.toBeUndefined();
      await expect(first.join(token, recorder().peer)).resolves.toBeTypeOf("function");
    });

    it("refuses a signed token at expiry", async () => {
      const first = hubOf({ values: { tokenKey: KEY, subscribeTokenTtl: Duration.seconds(30) } });
      const { token } = await first.issueToken(STAFF);
      vi.advanceTimersByTime(30_000);
      await expect(first.join(token, recorder().peer)).resolves.toBeUndefined();
    });

    it("keeps the old behaviour with an empty key: a token of one hub is unknown to another", async () => {
      const ledger = new MemoryRealtimeTokenLedgerDriver();
      const first = hubOf(signing(""), ledger);
      const second = hubOf(signing(""), ledger);
      const { token } = await first.issueToken(STAFF);
      await expect(second.join(token, recorder().peer)).resolves.toBeUndefined();
      await expect(first.join(token, recorder().peer)).resolves.toBeTypeOf("function");
    });
  });
});
