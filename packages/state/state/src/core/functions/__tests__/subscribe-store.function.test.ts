/**
 * Stackra file contract:
 * Purpose: unit tests of `subscribeStore`: a listener runs after each change until unsubscribed, unsubscribing twice is
 *          harmless, the same function subscribed twice is two subscriptions, and a non-store throws.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Store } from "#core/bases/store.base";
import { commitStore } from "#core/functions/commit-store.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";

class CounterStore extends Store {
  count = 0;
}

describe("subscribeStore", () => {
  it("calls the listener after each change until unsubscribed", () => {
    const store = new CounterStore();
    const listener = vi.fn();
    const stop = subscribeStore(store, listener);
    commitStore(store);
    stop();
    stop();
    commitStore(store);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("treats the same function subscribed twice as two subscriptions", () => {
    const store = new CounterStore();
    const listener = vi.fn();
    const stopFirst = subscribeStore(store, listener);
    subscribeStore(store, listener);
    stopFirst();
    commitStore(store);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("throws for an object that is not a store", () => {
    expect(() => subscribeStore({}, () => {})).toThrow(/Not a store/);
  });
});
