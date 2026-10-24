/**
 * Stackra file contract:
 * Purpose: unit tests of the `sse` `RealtimeDriver`: a driver of the port that answers a GET with a no-store event
 *          stream carrying each refresh as `event: refresh` with its id, keeps it alive with comment heartbeats,
 *          closes it at token expiry and leaves the hub when the client cancels; it refuses a bad token with 401 and
 *          a WebSocket upgrade with 426 without spending the token.
 * Boundary: test only; the stream is read with `@stackra/transport`'s reader; timers are faked where time matters.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1); the WHATWG event-stream format.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";
import { readServerSentEvents } from "@stackra/transport";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import { SseRealtimeDriver } from "#core/drivers/sse-realtime.driver";
import { RealtimeHub } from "#core/services/realtime-hub.service";

const SESSION = {
  principalId: "usr_1",
  tenantId: "ten_1",
  realm: Realm.Tenant,
  permissions: ["orders.order.read"],
};

const PAID = {
  permission: "orders.order.read",
  message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
};

/** A hub, its driver and a token for `SESSION`. */
function setup(ttl = Duration.minutes(15)) {
  const hub = new RealtimeHub(buildConfig(RealtimeConfig, { values: { subscribeTokenTtl: ttl } }));
  return { hub, driver: new SseRealtimeDriver(hub), token: hub.issueToken(SESSION).token };
}

/** The GET a client sends with `token`. */
const get = (token: string, headers: Record<string, string> = {}) =>
  new Request(`https://api.acme.example/realtime?token=${token}`, { headers });

afterEach(() => {
  vi.useRealTimers();
});

describe("SseRealtimeDriver", () => {
  it("is a driver of RealtimeDriver", () => {
    expect(setup().driver).toBeInstanceOf(RealtimeDriver);
    expect(kindOf(SseRealtimeDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeDriver },
    });
  });

  it("streams each refresh as an event with its id", async () => {
    const { hub, driver, token } = setup();
    const response = driver.open(get(token));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(hub.size).toBe(1);
    await expect(driver.publish(PAID)).resolves.toBe(1);
    const events = readServerSentEvents(response);
    const first = await events.next();
    expect(first.value).toEqual({
      event: "refresh",
      data: JSON.stringify(PAID.message),
      id: "evt_1",
    });
    await events.return(undefined);
    expect(hub.size).toBe(0);
  });

  it("heartbeats and closes at token expiry", async () => {
    vi.useFakeTimers();
    const { hub, driver, token } = setup(Duration.minutes(1));
    const response = driver.open(get(token));
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const opened = await reader?.read();
    expect(decoder.decode(opened?.value)).toBe(": open\n\n");
    vi.advanceTimersByTime(25_000);
    const ping = await reader?.read();
    expect(decoder.decode(ping?.value)).toBe(": ping\n\n");
    vi.advanceTimersByTime(35_000);
    await reader?.read();
    expect((await reader?.read())?.done).toBe(true);
    expect(hub.size).toBe(0);
  });

  it("refuses a bad token with 401 and an upgrade with 426, keeping the token", () => {
    const { driver, token } = setup();
    expect(driver.open(get("forged")).status).toBe(401);
    expect(driver.open(get(token, { upgrade: "websocket" })).status).toBe(426);
    expect(driver.open(get(token)).status).toBe(200);
    expect(driver.open(get(token)).status).toBe(401);
  });
});
