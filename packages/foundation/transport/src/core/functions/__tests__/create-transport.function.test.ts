/**
 * Stackra file contract:
 * Purpose: unit tests of `createTransport`: middleware run outermost first around the terminal fetch, a middleware
 *          may answer without calling `next`, and with no `fetch` option the global `fetch` is read on every send.
 * Boundary: test only; the global `fetch` is stubbed and restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0260.
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { createTransport } from "#core/functions/create-transport.function";
import type { Middleware } from "#core/types/middleware.type";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createTransport", () => {
  it("runs the middleware outermost first around the terminal fetch", async () => {
    const order: string[] = [];
    const step =
      (name: string): Middleware =>
      async (request, next) => {
        order.push(`${name}>`);
        const response = await next(request);
        order.push(`<${name}`);
        return response;
      };
    const send = createTransport({
      middleware: [step("a"), step("b")],
      fetch: async () => {
        order.push("fetch");
        return new Response("ok");
      },
    });
    expect(await (await send(new Request("https://api.test/x"))).text()).toBe("ok");
    expect(order).toEqual(["a>", "b>", "fetch", "<b", "<a"]);
  });

  it("lets a middleware answer without calling next", async () => {
    const terminal = vi.fn(async () => new Response("network"));
    const send = createTransport({
      middleware: [async () => new Response("cached")],
      fetch: terminal,
    });
    expect(await (await send(new Request("https://api.test/x"))).text()).toBe("cached");
    expect(terminal).not.toHaveBeenCalled();
  });

  it("reads the global fetch on every send when no fetch is given", async () => {
    const send = createTransport();
    const first = vi.fn(async () => new Response("first"));
    vi.stubGlobal("fetch", first);
    expect(await (await send(new Request("https://api.test/x"))).text()).toBe("first");
    const second = vi.fn(async () => new Response("second"));
    vi.stubGlobal("fetch", second);
    expect(await (await send(new Request("https://api.test/x"))).text()).toBe("second");
    expect(first).toHaveBeenCalledTimes(1);
  });
});
