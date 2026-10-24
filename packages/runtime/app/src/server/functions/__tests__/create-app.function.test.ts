/**
 * Stackra file contract:
 * Purpose: unit tests of the server `createApp`: the app carries the member key and the bound classes by kind, `run`
 *          gives each call a request container, `drain` waits for calls in flight and then refuses new ones, `close`
 *          drains and shuts the container down once, and SIGTERM closes and exits 0 (1 after reporting a failed
 *          shutdown).
 * Boundary: test only; boots real containers; `process.exit` is mocked and signals are emitted as events.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7 to 9).
 */
import { Module, Service } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { AppDrainingError } from "#server/errors/app-draining.error";
import { createApp } from "#server/functions/create-app.function";

/** Records its shutdown. */
class LedgerService extends Service {
  static closed = 0;

  onApplicationShutdown(): void {
    LedgerService.closed += 1;
  }
}

class OrdersModule extends Module({ exports: [LedgerService] }) {}

class CancelOrderAction {}

const wiring: Wiring = {
  member: "commerce",
  root: OrdersModule,
  modules: { orders: { exports: [LedgerService], dependsOn: [], type: OrdersModule } },
  bindings: [
    { module: "orders", kind: "service", provide: LedgerService },
    { module: "orders", kind: "action", provide: CancelOrderAction },
  ],
};

describe("createApp (server)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    LedgerService.closed = 0;
  });

  it("carries the member key, readiness and the classes by kind", async () => {
    const app = await createApp(OrdersModule, { wiring });
    expect(app.key).toBe("commerce");
    expect(app.ready()).toBe(true);
    expect(app.handlers.byKind.get("action")).toEqual([CancelOrderAction]);
    expect(app.handlers.byKind.get("service")).toEqual([LedgerService]);
    await app.close();
  });

  it("runs a call on a request container", async () => {
    const app = await createApp(OrdersModule, { wiring });
    const ledger = await app.handlers.run((container) => container.get(LedgerService));
    expect(ledger).toBeInstanceOf(LedgerService);
    await app.close();
  });

  it("drains: waits for calls in flight, then refuses new ones", async () => {
    const app = await createApp(OrdersModule, { wiring });
    const gate: { finish?: (value: string) => void } = {};
    const slow = app.handlers.run(() => new Promise<string>((resolve) => (gate.finish = resolve)));
    let drained = false;
    const draining = app.drain().then(() => (drained = true));
    expect(app.ready()).toBe(false);
    await vi.waitFor(() => expect(gate.finish).toBeDefined());
    expect(drained).toBe(false);
    gate.finish?.("done");
    await expect(slow).resolves.toBe("done");
    await draining;
    expect(drained).toBe(true);
    const refused = await app.handlers.run(() => "late").catch((error: unknown) => error);
    expect(isRefusal(refused, AppDrainingError)).toBe(true);
    await app.close();
  });

  it("does not let a failed call block the drain", async () => {
    const app = await createApp(OrdersModule, { wiring });
    await expect(app.handlers.run(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(app.drain()).resolves.toBeUndefined();
    await app.close();
  });

  it("closes once: drains, then shuts the container down", async () => {
    const app = await createApp(OrdersModule, { wiring });
    await Promise.all([app.close(), app.close()]);
    expect(LedgerService.closed).toBe(1);
    expect(app.ready()).toBe(false);
  });

  it("closes and exits 0 on SIGTERM, and stops listening once closed", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const before = process.listenerCount("SIGTERM");
    const app = await createApp(OrdersModule, { wiring });
    expect(process.listenerCount("SIGTERM")).toBe(before + 1);
    process.emit("SIGTERM");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(LedgerService.closed).toBe(1);
    expect(process.listenerCount("SIGTERM")).toBe(before);
    expect(app.ready()).toBe(false);
  });

  it("reports a failed shutdown and exits 1", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(LedgerService.prototype, "onApplicationShutdown").mockImplementation(() => {
      throw new Error("flush failed");
    });
    await createApp(OrdersModule, { wiring });
    process.emit("SIGINT");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(write).toHaveBeenCalled();
  });
});
