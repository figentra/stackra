/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpClientTransportDriver`: a call reaches the configured base URL with the session's headers,
 *          the pinned `Stackra-Version` and a minted Idempotency-Key on a write; a queued call asks to run
 *          asynchronously; no version header when none is pinned; a module listed in `producers` goes to its own base
 *          URL; a call's scope replaces the session's scope header.
 * Boundary: test only; `fetch` is stubbed, so nothing reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0142; ADR 0118; ADR 0138.
 */
import { buildConfig } from "@stackra/config";
import { HttpMethod } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { ClientsConfig } from "#config/clients.config";
import { ClientSession } from "#contracts/ports/client-session.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { HttpClientTransportDriver } from "#core/drivers/http-client-transport.driver";

/** A signed-in session holding one permission. */
class StubSession extends ClientSession {
  headers(): Promise<Readonly<Record<string, string>>> {
    return Promise.resolve({ Authorization: "Bearer token-1" });
  }

  can(permission: string): boolean {
    return permission === "orders.order.cancel";
  }
}

const cancel: ClientRequest = {
  key: "orders.order.cancel@1",
  kind: "action",
  endpoint: { method: HttpMethod.Put, path: "/orders/:orderId/cancel" },
  input: { orderId: "ord_1" },
  output: z.object({ status: z.string() }),
};

/** Stubs `fetch` to answer `body` and returns the requests it saw. */
function stubFetch(body: unknown, status = 200): Request[] {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      seen.push(request);
      return Promise.resolve(
        body === undefined ? new Response(null, { status }) : Response.json(body, { status }),
      );
    }),
  );
  return seen;
}

const configWith = (values: Record<string, unknown>) =>
  buildConfig(ClientsConfig, { values: { baseUrl: "https://api.acme.example", ...values } });

describe("HttpClientTransportDriver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a call with the session's headers, the version and an Idempotency-Key", async () => {
    const seen = stubFetch({ status: "cancelled" });
    const driver = new HttpClientTransportDriver(
      configWith({ apiVersion: "2027-03-01" }),
      new StubSession(),
    );
    expect(await driver.send(cancel)).toEqual({ status: "cancelled" });
    expect(seen[0]?.url).toBe("https://api.acme.example/orders/ord_1/cancel");
    expect(seen[0]?.headers.get("Authorization")).toBe("Bearer token-1");
    expect(seen[0]?.headers.get("Stackra-Version")).toBe("2027-03-01");
    expect(seen[0]?.headers.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("queues a call and pins no version when none is configured", async () => {
    const seen = stubFetch(undefined, 202);
    const driver = new HttpClientTransportDriver(configWith({}), new StubSession());
    await driver.queue(cancel);
    expect(seen[0]?.headers.get("Prefer")).toBe("respond-async");
    expect(seen[0]?.headers.has("Stackra-Version")).toBe(false);
  });

  it("sends a listed module to its producer and the call's scope over the session's", async () => {
    const seen = stubFetch({ status: "cancelled" });
    /** A session that sends its own scope. */
    class ScopedSession extends StubSession {
      override headers(): Promise<Readonly<Record<string, string>>> {
        return Promise.resolve({
          Authorization: "Bearer token-1",
          "x-scope-path": "platform.other",
        });
      }
    }
    const driver = new HttpClientTransportDriver(
      configWith({ producers: { orders: "https://orders.internal/" } }),
      new ScopedSession(),
    );
    await driver.send({ ...cancel, scope: "platform.acme" });
    expect(seen[0]?.url).toBe("https://orders.internal/orders/ord_1/cancel");
    expect(seen[0]?.headers.get("X-Scope-Path")).toBe("platform.acme");
    await driver.send({ ...cancel, key: "billing.invoice.void@1" });
    expect(seen[1]?.url).toBe("https://api.acme.example/orders/ord_1/cancel");
    expect(seen[1]?.headers.get("X-Scope-Path")).toBe("platform.other");
  });
});
