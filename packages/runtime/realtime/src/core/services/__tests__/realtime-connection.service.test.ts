/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeConnection`: stopped is `null`; start connects with a fresh token per attempt and
 *          goes live; a signed-out token source stops it; a lost link or a failed token reconnects after the backoff;
 *          listeners get only their event's refreshes and can unsubscribe, and a throwing listener is logged and spares the rest;
 *          restart and stop ignore the old link; background suspension and foreground resume follow the config.
 * Boundary: test only; the transport is the memory driver, timers are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1); ADR 0295 (decision 10).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigLayers } from "@stackra/config";
import { Service } from "@stackra/container";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";
import { MemoryRealtimeTransportDriver } from "#core/drivers/memory-realtime-transport.driver";
import { RealtimeStatus } from "#core/enums/realtime-status.enum";
import { RealtimeConnection } from "#core/services/realtime-connection.service";

/** Generated-style event refs. */
class OrderPaid {
  static readonly eventName = "orders.order.paid.v1";

  orderId!: string;
}

class StockLow {
  static readonly eventName = "inventory.stock.low.v1";

  variantId!: string;
}

const PAID: RealtimeMessage = {
  channel: "tenant.ten_1.orders",
  name: OrderPaid.eventName,
  id: "evt_1",
};

/** A memory transport that records the targets it was opened with. */
class RecordingTransport extends MemoryRealtimeTransportDriver {
  readonly targets: RealtimeTarget[] = [];

  override open(target: RealtimeTarget, handlers: RealtimeLinkHandlers) {
    this.targets.push(target);
    return super.open(target, handlers);
  }
}

/** A connection over a recording transport and the configuration `layers`. */
function connectionOf(layers: ConfigLayers<RealtimeConfig> = {}) {
  const transport = new RecordingTransport();
  const connection = new RealtimeConnection(buildConfig(RealtimeConfig, layers), transport);
  return { transport, connection };
}

/** Lets queued promise callbacks run, fires the timers due within `ms`, and lets their callbacks run. */
async function settle(ms = 0): Promise<void> {
  for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
  await vi.advanceTimersByTimeAsync(ms);
  for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
}

/** A token source answering `t1`, `t2`, ... */
function counter() {
  let issued = 0;
  return () => `t${++issued}`;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RealtimeConnection", () => {
  it("is a service with no state while stopped", () => {
    const { connection } = connectionOf();
    expect(connection).toBeInstanceOf(Service);
    expect(connection.state).toBeNull();
  });

  it("connects with a fresh token and goes live", async () => {
    const { connection, transport } = connectionOf({
      values: { origin: "https://api.acme.example" },
    });
    const seen: (RealtimeStatus | undefined)[] = [];
    connection.subscribeState(() => seen.push(connection.state?.status));
    connection.start(counter());
    expect(connection.state).toEqual({ status: RealtimeStatus.Connecting });
    await settle();
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
    expect(Object.isFrozen(connection.state)).toBe(true);
    expect(transport.targets).toEqual([{ origin: "https://api.acme.example", token: "t1" }]);
    expect(seen).toEqual([RealtimeStatus.Connecting, RealtimeStatus.Connected]);
  });

  it("stops when the token source says signed out", async () => {
    const { connection, transport } = connectionOf();
    connection.start(() => undefined);
    await settle(0);
    expect(connection.state).toBeNull();
    expect(transport.size).toBe(0);
  });

  it("reconnects after the backoff when the link is lost, with a new token", async () => {
    const { connection, transport } = connectionOf({ values: { maxBackoffSeconds: 1 } });
    connection.start(counter());
    await settle(0);
    transport.drop();
    expect(connection.state).toEqual({ status: RealtimeStatus.Disconnected });
    await settle(1000);
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
    expect(transport.targets.map((target) => target.token)).toEqual(["t1", "t2"]);
  });

  it("retries after the backoff when the token source fails", async () => {
    const { connection } = connectionOf({ values: { maxBackoffSeconds: 1 } });
    const tokens = vi
      .fn<() => Promise<string | undefined>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue("t2");
    connection.start(tokens);
    await settle(0);
    expect(connection.state).toEqual({ status: RealtimeStatus.Disconnected });
    await settle(1000);
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
  });

  it("hands each refresh to its event's listeners only, until they unsubscribe", async () => {
    const { connection, transport } = connectionOf();
    const paid = vi.fn();
    const low = vi.fn();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failing = vi.fn(() => {
      throw new Error("listener bug");
    });
    const unsubscribe = connection.subscribe(OrderPaid, paid);
    connection.subscribe(StockLow, low);
    connection.subscribe(OrderPaid, failing);
    connection.start(counter());
    await settle(0);
    transport.emit(PAID);
    expect(paid).toHaveBeenCalledWith(PAID);
    expect(low).not.toHaveBeenCalled();
    expect(failing).toHaveBeenCalledOnce();
    unsubscribe();
    transport.emit(PAID);
    expect(paid).toHaveBeenCalledOnce();
    expect(errors).toHaveBeenCalledWith(
      "A realtime listener of orders.order.paid.v1 failed",
      expect.any(Error),
    );
  });

  it("ignores the old link after a restart or a stop", async () => {
    const { connection, transport } = connectionOf();
    const paid = vi.fn();
    connection.subscribe(OrderPaid, paid);
    connection.start(counter());
    await settle(0);
    connection.start(counter());
    await settle(0);
    expect(transport.size).toBe(1);
    connection.stop();
    expect(connection.state).toBeNull();
    expect(transport.size).toBe(0);
    transport.emit(PAID);
    expect(paid).not.toHaveBeenCalled();
  });

  it("suspends in the background and resumes on foreground when configured", async () => {
    const { connection, transport } = connectionOf({
      values: { reconnectOnForeground: true, backgroundGraceSeconds: 30 },
    });
    connection.start(counter());
    await settle(0);
    connection.background();
    connection.foreground();
    await settle(30_000);
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
    connection.background();
    await settle(30_000);
    expect(connection.state).toEqual({ status: RealtimeStatus.Disconnected });
    expect(transport.size).toBe(0);
    await settle(120_000);
    expect(transport.targets).toHaveLength(1);
    connection.foreground();
    await settle(0);
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
    expect(transport.targets).toHaveLength(2);
  });

  it("stays connected in the background by default", async () => {
    const { connection, transport } = connectionOf();
    connection.start(counter());
    await settle(0);
    connection.background();
    await settle(600_000);
    expect(connection.state).toEqual({ status: RealtimeStatus.Connected });
    expect(transport.size).toBe(1);
  });
});
