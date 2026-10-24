/**
 * Stackra file contract:
 * Purpose: unit tests of `handlePush`: a push with a title shows its notification with the route as data and sets the
 *          badge; a push without JSON or a title shows nothing.
 * Boundary: test only; the worker scope's `registration` and `navigator.setAppBadge` are stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { handlePush } from "#sw/functions/handle-push.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A push event over `json` that collects its `waitUntil` promises. */
function pushOf(json: () => unknown) {
  const waits: Promise<unknown>[] = [];
  return {
    event: { data: { json }, waitUntil: (p: Promise<unknown>) => void waits.push(p) },
    waits,
  };
}

describe("handlePush", () => {
  it("shows the notification with its route and sets the badge", async () => {
    const showNotification = vi.fn(async () => undefined);
    const setAppBadge = vi.fn(async () => undefined);
    vi.stubGlobal("registration", { showNotification });
    vi.stubGlobal("navigator", { setAppBadge });
    const { event, waits } = pushOf(() => ({
      title: "Order paid",
      body: "ord_1",
      route: "/orders/ord_1",
      badge: 2,
    }));
    handlePush(event);
    await Promise.all(waits);
    expect(showNotification).toHaveBeenCalledWith("Order paid", {
      body: "ord_1",
      data: { route: "/orders/ord_1" },
    });
    expect(setAppBadge).toHaveBeenCalledWith(2);
  });

  it("shows nothing for a push without JSON or a title", () => {
    const showNotification = vi.fn();
    vi.stubGlobal("registration", { showNotification });
    handlePush(pushOf(() => JSON.parse("not json")).event);
    handlePush(pushOf(() => ({ body: "no title" })).event);
    handlePush({ data: null, waitUntil: vi.fn() });
    expect(showNotification).not.toHaveBeenCalled();
  });
});
