/**
 * Stackra file contract:
 * Purpose: unit tests of the `websocket` `RealtimeDriver`: a driver of the port that joins a socket with the token of
 *          its upgrade URL and sends each refresh as one JSON frame, closes with 4401 on a bad token and 4001 at
 *          expiry, leaves the hub when the socket closes, and still answers the SSE fallback.
 * Boundary: test only; the socket is a small recording stand-in of the WHATWG shape; timers are faked for expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import { SseRealtimeDriver } from "#core/drivers/sse-realtime.driver";
import { WebSocketRealtimeDriver } from "#core/drivers/web-socket-realtime.driver";
import { RealtimeHub } from "#core/services/realtime-hub.service";
import type { RealtimeSocket } from "#core/types/realtime-socket.type";

const SESSION = {
  principalId: "usr_1",
  scopeId: "ten_1",
  realm: Realm.Staff,
  permissions: ["orders.order.read"],
};

const PAID = {
  permission: "orders.order.read",
  message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
};

/** A socket that records frames and closes, and lets a test close it from the client side. */
class RecordingSocket implements RealtimeSocket {
  readonly sent: string[] = [];

  closedWith: [number | undefined, string | undefined] | undefined;

  private readonly onClose: (() => void)[] = [];

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closedWith = [code, reason];
    for (const listener of this.onClose) listener();
  }

  addEventListener(_type: "close", listener: () => void): void {
    this.onClose.push(listener);
  }
}

/** A hub and its driver with tokens of `ttl`. */
function setup(ttl = Duration.minutes(15)) {
  const hub = new RealtimeHub(buildConfig(RealtimeConfig, { values: { subscribeTokenTtl: ttl } }));
  return { hub, driver: new WebSocketRealtimeDriver(hub) };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("WebSocketRealtimeDriver", () => {
  it("is a driver of RealtimeDriver that also serves the SSE fallback", () => {
    const { driver } = setup();
    expect(driver).toBeInstanceOf(RealtimeDriver);
    expect(driver).toBeInstanceOf(SseRealtimeDriver);
    expect(kindOf(WebSocketRealtimeDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeDriver },
    });
  });

  it("joins a socket and sends each refresh as a JSON frame until it closes", async () => {
    const { hub, driver } = setup();
    const socket = new RecordingSocket();
    const { token } = hub.issueToken(SESSION);
    expect(driver.accept(socket, `/realtime?token=${token}`)).toBe(true);
    await expect(driver.publish(PAID)).resolves.toBe(1);
    expect(socket.sent).toEqual([JSON.stringify(PAID.message)]);
    socket.close(1000, "bye");
    expect(hub.size).toBe(0);
  });

  it("closes with 4401 on a bad or reused token", () => {
    const { hub, driver } = setup();
    const { token } = hub.issueToken(SESSION);
    driver.accept(new RecordingSocket(), `wss://api.acme.example/realtime?token=${token}`);
    const reused = new RecordingSocket();
    expect(driver.accept(reused, `/realtime?token=${token}`)).toBe(false);
    expect(reused.closedWith).toEqual([4401, "unauthorised"]);
    const anonymous = new RecordingSocket();
    expect(driver.accept(anonymous, "/realtime")).toBe(false);
    expect(anonymous.closedWith).toEqual([4401, "unauthorised"]);
  });

  it("closes with 4001 when the token expires", () => {
    vi.useFakeTimers();
    const { hub, driver } = setup(Duration.minutes(5));
    const socket = new RecordingSocket();
    driver.accept(socket, `/realtime?token=${hub.issueToken(SESSION).token}`);
    vi.advanceTimersByTime(5 * 60_000);
    expect(socket.closedWith).toEqual([4001, "token_expired"]);
    expect(hub.size).toBe(0);
  });
});
