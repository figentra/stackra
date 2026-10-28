/**
 * Stackra file contract:
 * Purpose: unit tests of the server `createApp`: the app carries the member key and the bound classes by kind, `run`
 *          gives each call a request container, `drain` waits for calls in flight and then refuses new ones, `close`
 *          drains and shuts the container down once, the generated boot gets the ready container, `DATABASE_URL` and
 *          a signal that only `close` aborts, SIGTERM closes and exits 0 (1 after reporting a failed
 *          shutdown), `guard` runs the contributed `RequestGuard`s by order and stops at the first refusal, and
 *          `/readyz` runs the given indicators and every bound `HealthIndicator`, failing with the down one named.
 * Boundary: test only; boots real containers; `process.exit` is mocked and signals are emitted as events.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7 to 9); ADR 0263; ADR 0260 (decision 4); ADR 0457.
 */
import { Module, Service } from "@stackra/container";
import type { Container, Wiring } from "@stackra/container";
import { HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RequestGuard } from "#server/bases/request-guard.base";
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

  it("answers the health routes through probe, with the given indicators", async () => {
    class UpIndicator extends HealthIndicator {
      readonly name = "postgres";

      async check(): Promise<HealthReport> {
        return { status: HealthStatus.Up };
      }
    }
    const app = await createApp(OrdersModule, { wiring, health: [new UpIndicator()] });
    expect(await app.probe("GET", "/healthz")).toEqual({ status: 200, body: { status: "up" } });
    expect(await app.probe("GET", "/readyz")).toEqual({ status: 200, body: { postgres: "up" } });
    await app.drain();
    expect((await app.probe("GET", "/healthz"))?.status).toBe(503);
    expect((await app.probe("GET", "/readyz"))?.status).toBe(503);
    await app.close();
  });

  it("runs every bound HealthIndicator in /readyz and names the one that is down", async () => {
    class DatabaseIndicator extends HealthIndicator {
      readonly name = "database";

      async check(): Promise<HealthReport> {
        return { status: HealthStatus.Down, detail: "db.internal refused" };
      }
    }
    class CacheIndicator extends HealthIndicator {
      readonly name = "cache";

      async check(): Promise<HealthReport> {
        return { status: HealthStatus.Up };
      }
    }
    const bound: Wiring = {
      ...wiring,
      bindings: [...(wiring.bindings ?? []), { module: "orders", provide: DatabaseIndicator }],
    };
    const app = await createApp(OrdersModule, { wiring: bound, health: [new CacheIndicator()] });
    expect(await app.probe("GET", "/readyz")).toEqual({
      status: 503,
      body: { cache: "up", database: "down" },
    });
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
    const slow = app.handlers.run(
      () =>
        new Promise<string>((resolve) => {
          gate.finish = resolve;
        }),
    );
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

  it("boots with the ready container and DATABASE_URL, and aborts the signal on close", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost/commerce");
    const seen: { container?: Container; url?: string; signal?: AbortSignal } = {};
    const app = await createApp(OrdersModule, {
      wiring,
      boot: async (container, options) => {
        seen.container = container;
        seen.url = options.url;
        seen.signal = options.signal;
      },
    });
    expect(seen.container?.get(LedgerService)).toBeInstanceOf(LedgerService);
    expect(seen.url).toBe("postgres://localhost/commerce");
    expect(seen.signal?.aborted).toBe(false);
    await app.drain();
    expect(seen.signal?.aborted).toBe(false);
    await app.close();
    expect(seen.signal?.aborted).toBe(true);
    vi.unstubAllEnvs();
  });

  it("rejects when the boot fails", async () => {
    await expect(
      createApp(OrdersModule, { wiring, boot: () => Promise.reject(new Error("no database")) }),
    ).rejects.toThrow("no database");
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

  describe("guard", () => {
    const seen: string[] = [];

    class ScopeGuard extends RequestGuard {
      check(request: Request): void {
        seen.push(`scope ${new URL(request.url).pathname}`);
      }
    }

    class EdgeGuard extends RequestGuard {
      override get order(): number {
        return -100;
      }

      async check(request: Request): Promise<void> {
        seen.push("edge");
        if (request.headers.get("x-edge") === "unsigned") throw new Error("unsigned");
      }
    }

    const guarded: Wiring = {
      ...wiring,
      bindings: [
        ...(wiring.bindings ?? []),
        { module: "orders", kind: "service", provide: ScopeGuard },
        { module: "orders", kind: "service", provide: EdgeGuard },
      ],
    };

    afterEach(() => {
      seen.length = 0;
    });

    it("runs every contributed guard on the request container, lowest order first", async () => {
      const app = await createApp(OrdersModule, { wiring: guarded });
      await app.handlers.run((container) =>
        app.handlers.guard(new Request("https://api.example/orders"), container),
      );
      expect(seen).toEqual(["edge", "scope /orders"]);
      await app.close();
    });

    it("rejects with the first refusal and runs no later guard", async () => {
      const app = await createApp(OrdersModule, { wiring: guarded });
      const request = new Request("https://api.example/orders", {
        headers: { "x-edge": "unsigned" },
      });
      await expect(
        app.handlers.run((container) => app.handlers.guard(request, container)),
      ).rejects.toThrow("unsigned");
      expect(seen).toEqual(["edge"]);
      await app.close();
    });

    it("lets every request through when nothing contributes a guard", async () => {
      const app = await createApp(OrdersModule, { wiring });
      await expect(
        app.handlers.run((container) =>
          app.handlers.guard(new Request("https://api.example/"), container),
        ),
      ).resolves.toBeUndefined();
      await app.close();
    });
  });
});
