/**
 * Stackra file contract:
 * Purpose: unit tests of `handleNotificationClick`: the notification closes; an open tab navigates to the route and is
 *          focused; with no tab a window opens; a foreign or malformed route opens `/`.
 * Boundary: test only; the worker scope's `clients` and `location` are stubbed on `globalThis`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { handleNotificationClick } from "#sw/functions/handle-notification-click.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A click on a notification carrying `data`, collecting its `waitUntil` promises. */
function clickOf(data: unknown) {
  const waits: Promise<unknown>[] = [];
  const close = vi.fn();
  return {
    event: {
      notification: { data, close },
      waitUntil: (p: Promise<unknown>) => void waits.push(p),
    },
    waits,
    close,
  };
}

describe("handleNotificationClick", () => {
  it("navigates and focuses an open tab", async () => {
    const tab = { navigate: vi.fn(async () => undefined), focus: vi.fn(async () => undefined) };
    vi.stubGlobal("clients", { matchAll: async () => [tab], openWindow: vi.fn() });
    vi.stubGlobal("location", { origin: "https://console.acme.test" });
    const { event, waits, close } = clickOf({ route: "/orders/ord_1" });
    handleNotificationClick(event);
    await Promise.all(waits);
    expect(close).toHaveBeenCalled();
    expect(tab.navigate).toHaveBeenCalledWith("https://console.acme.test/orders/ord_1");
    expect(tab.focus).toHaveBeenCalled();
  });

  it("opens a window when no tab is open, and refuses a foreign route", async () => {
    const openWindow = vi.fn(async () => undefined);
    vi.stubGlobal("clients", { matchAll: async () => [], openWindow });
    for (const route of ["//evil.test/x", "https://evil.test", "/a\\b", undefined]) {
      const { event, waits } = clickOf({ route });
      handleNotificationClick(event);
      await Promise.all(waits);
    }
    expect(openWindow.mock.calls).toEqual([["/"], ["/"], ["/"], ["/"]]);
  });
});
