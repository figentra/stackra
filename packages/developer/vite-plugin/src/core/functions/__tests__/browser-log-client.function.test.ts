/**
 * Stackra file contract:
 * Purpose: unit tests of `browserLogClient`: run in a fresh JavaScript context standing in for a page, it reports an
 *          uncaught error, an unhandled rejection and `console.error` / `console.warn` (which still print) in one
 *          batch to the route with the client header and the page's origin and path; it installs once; it stops at
 *          the per-page limit with one line saying so.
 * Boundary: test only; `node:vm` with fake `fetch`, timers, console and event target.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { runInContext, createContext } from "node:vm";

import { describe, expect, it } from "@stackra/testing";

import { browserLogClient } from "#core/functions/browser-log-client.function";

/** A page: a context with the globals the client uses, and what it sent. */
function page(perPage = 200) {
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const sent: { route: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const printed: string[] = [];
  const timers: (() => void)[] = [];
  const context = createContext({
    URL,
    location: { href: "http://localhost:5173/orders?token=abc#x" },
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      listeners.set(type, [...(listeners.get(type) ?? []), listener]),
    fetch: (route: string, init: { headers: Record<string, string>; body: string }) => {
      sent.push({ route, init });
      return Promise.resolve({});
    },
    setTimeout: (callback: () => void) => timers.push(callback),
    clearTimeout: () => undefined,
    console: {
      error: (...args: unknown[]) => printed.push(`error ${args.join(" ")}`),
      warn: (...args: unknown[]) => printed.push(`warn ${args.join(" ")}`),
    },
  });
  runInContext(browserLogClient("/__stackra/browser-log", perPage), context);
  const emit = (type: string, event: unknown) =>
    listeners.get(type)?.forEach((listener) => listener(event));
  const tick = () => timers.splice(0).forEach((timer) => timer());
  const entries = () =>
    sent.flatMap(
      ({ init }) => (JSON.parse(init.body) as { entries: Record<string, unknown>[] }).entries,
    );
  return { context, emit, tick, sent, printed, entries };
}

describe("browserLogClient", () => {
  it("reports errors, rejections and console errors and warnings in one batch", () => {
    const { context, emit, tick, sent, printed, entries } = page();
    const error = runInContext("new TypeError('boom')", context) as Error;
    emit("error", { error, message: "boom" });
    emit("unhandledrejection", { reason: runInContext("new Error('nope')", context) as Error });
    runInContext(
      "console.error('failed to load', { id: 7, email: 'dana@example.com' }); console.warn('slow')",
      context,
    );
    expect(sent).toHaveLength(0);
    tick();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.route).toBe("/__stackra/browser-log");
    expect(sent[0]?.init.headers).toEqual({
      "content-type": "application/json",
      "x-stackra-browser-log": "1",
    });
    expect(
      entries().map(({ kind, level, message, args, url }) => [kind, level, message, args, url]),
    ).toEqual([
      ["error", "error", "TypeError: boom", undefined, "http://localhost:5173/orders"],
      [
        "rejection",
        "error",
        "Unhandled rejection: Error: nope",
        undefined,
        "http://localhost:5173/orders",
      ],
      // A console call's arguments stay structured, so the dev server masks `email` by name before writing text.
      [
        "console",
        "error",
        undefined,
        ["failed to load", { id: 7, email: "dana@example.com" }],
        "http://localhost:5173/orders",
      ],
      ["console", "warn", undefined, ["slow"], "http://localhost:5173/orders"],
    ]);
    expect(entries()[0]?.["stack"]).toContain("TypeError: boom");
    expect(printed).toEqual(["error failed to load [object Object]", "warn slow"]);
  });

  it("sends a rejection reason that is not an error as structured args", () => {
    const { context, emit, tick, entries } = page();
    emit("unhandledrejection", {
      reason: runInContext("({ status: 500, user: { email: 'dana@example.com' } })", context),
    });
    tick();
    expect(entries()[0]).toMatchObject({
      kind: "rejection",
      args: ["Unhandled rejection:", { status: 500, user: { email: "dana@example.com" } }],
    });
    expect(entries()[0]?.["message"]).toBeUndefined();
  });

  it("installs once per page", () => {
    const { context, tick, entries } = page();
    runInContext(browserLogClient("/__stackra/browser-log", 200), context);
    runInContext("console.warn('once')", context);
    tick();
    expect(entries()).toHaveLength(1);
  });

  it("stops at the per-page limit with one line saying so", () => {
    const { context, tick, entries } = page(3);
    runInContext("for (let i = 0; i < 10; i++) console.warn('w' + i)", context);
    tick();
    expect(entries().map(({ message, args }) => message ?? (args as string[])[0])).toEqual([
      "w0",
      "w1",
      "stackra: this page reached 3 browser log entries; later ones are not sent",
    ]);
  });
});
