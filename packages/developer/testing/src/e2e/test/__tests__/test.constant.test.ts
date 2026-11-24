/**
 * Stackra file contract:
 * Purpose: unit tests of the e2e `test` function's house fixtures: `recordApiCalls` clears the log, records each finished request of the
 *          context and stops listening after the test; `failOnConsoleError` collects console errors and page errors and fails the
 *          test on any unless `consoleErrors` is `allow`.
 * Boundary: test only; Playwright's `test.extend` hands back the fixture table it was given, and the page and context are event stubs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { API_CALL_LOG } from "#e2e/api-calls/api-call-log.constant";
import { test } from "#e2e/test/test.constant";

vi.mock("@playwright/test", () => ({
  test: { extend: (fixtures: object) => fixtures },
  expect: (value: unknown) => ({
    toEqual: (expected: unknown) => {
      if (JSON.stringify(value) !== JSON.stringify(expected))
        throw new Error(`browser console errors: ${JSON.stringify(value)}`);
    },
  }),
}));

type Fixture = [(args: Record<string, unknown>, use: () => Promise<void>) => Promise<void>, object];
const fixtures = test as unknown as Record<string, Fixture | [string, object]>;

/** An emitter that records its listeners, as a context or a page is. */
const emitter = () => {
  const listeners = new Map<string, ((value: never) => void)[]>();
  return {
    on: vi.fn((event: string, listener: (value: never) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    }),
    off: vi.fn((event: string, listener: (value: never) => void) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((known) => known !== listener),
      );
    }),
    emit: (event: string, value: unknown) => {
      for (const listener of listeners.get(event) ?? []) listener(value as never);
    },
    count: (event: string) => (listeners.get(event) ?? []).length,
  };
};

describe("the e2e test function's house fixtures", () => {
  it("fails on console errors by default, as an option", () => {
    expect(fixtures["consoleErrors"]).toEqual(["fail", { option: true }]);
  });

  it("recordApiCalls clears the log, records finished requests and stops after the test", async () => {
    API_CALL_LOG.push({ method: "GET", url: "http://stale.test/", headers: {} });
    const context = emitter();
    const [run, options] = fixtures["recordApiCalls"] as Fixture;
    expect(options).toEqual({ auto: true });
    await run({ context }, async () => {
      expect(API_CALL_LOG).toEqual([]);
      context.emit("requestfinished", {
        method: () => "POST",
        url: () => "http://app.test/orders",
        headers: () => ({ accept: "application/json" }),
      });
      expect(API_CALL_LOG).toEqual([
        { method: "POST", url: "http://app.test/orders", headers: { accept: "application/json" } },
      ]);
      expect(context.count("requestfinished")).toBe(1);
    });
    expect(context.count("requestfinished")).toBe(0);
    API_CALL_LOG.length = 0;
  });

  it("failOnConsoleError passes a page with no console error, ignoring other console messages", async () => {
    const page = emitter();
    const [run, options] = fixtures["failOnConsoleError"] as Fixture;
    expect(options).toEqual({ auto: true });
    await run({ page, consoleErrors: "fail" }, async () => {
      page.emit("console", { type: () => "log", text: () => "hello" });
      page.emit("console", { type: () => "warning", text: () => "careful" });
    });
  });

  it("failOnConsoleError fails a test whose page logged an error or threw", async () => {
    const logged = emitter();
    const [run] = fixtures["failOnConsoleError"] as Fixture;
    await expect(
      run({ page: logged, consoleErrors: "fail" }, async () => {
        logged.emit("console", { type: () => "error", text: () => "boom" });
      }),
    ).rejects.toThrow("browser console errors");
    const thrown = emitter();
    await expect(
      run({ page: thrown, consoleErrors: "fail" }, async () => {
        thrown.emit("pageerror", { message: "TypeError: x is undefined" });
      }),
    ).rejects.toThrow("TypeError: x is undefined");
  });

  it("failOnConsoleError lets a test that allows console errors through", async () => {
    const page = emitter();
    const [run] = fixtures["failOnConsoleError"] as Fixture;
    await run({ page, consoleErrors: "allow" }, async () => {
      page.emit("console", { type: () => "error", text: () => "expected noise" });
    });
  });
});
