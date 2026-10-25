/**
 * Stackra file contract:
 * Purpose: unit tests of `handlePushSubscriptionChange`: it subscribes again with the old options and tells the open
 *          tabs; with no old subscription named it does nothing.
 * Boundary: test only; the worker scope's `registration` and `clients` are stubbed on `globalThis`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { handlePushSubscriptionChange } from "#sw/functions/handle-push-subscription-change.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("handlePushSubscriptionChange", () => {
  it("renews the subscription and tells the tabs", async () => {
    const subscribe = vi.fn(async () => ({ endpoint: "https://push.example/new" }));
    const tab = { postMessage: vi.fn() };
    vi.stubGlobal("registration", { pushManager: { subscribe } });
    vi.stubGlobal("clients", { matchAll: async () => [tab] });
    const key = new ArrayBuffer(1);
    const waits: Promise<unknown>[] = [];
    handlePushSubscriptionChange({
      oldSubscription: { options: { userVisibleOnly: true, applicationServerKey: key } },
      waitUntil: (p) => void waits.push(p),
    });
    await Promise.all(waits);
    expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: key });
    expect(tab.postMessage).toHaveBeenCalledWith({
      type: "push_subscription_changed",
      subscription: JSON.stringify({ endpoint: "https://push.example/new" }),
    });
  });

  it("does nothing when the old subscription is not named", () => {
    const waitUntil = vi.fn();
    handlePushSubscriptionChange({ oldSubscription: null, waitUntil });
    expect(waitUntil).not.toHaveBeenCalled();
  });
});
