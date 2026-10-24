/**
 * Stackra file contract:
 * Purpose: unit tests of `commitStore`: it bumps the version, writes the state's own non-function fields under the key
 *          and calls every listener, including when a listener unsubscribes another during the call.
 * Boundary: test only; the area is a hand-written stub.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079; ADR 0256.
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { commitStore } from "#core/functions/commit-store.function";
import { registerStores } from "#core/functions/register-stores.function";
import { storeVersion } from "#core/functions/store-version.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";

class CartStore extends Store({ persist: "session" }) {
  lines = ["sku_1"];

  onEmpty = () => undefined;

  get count(): number {
    return this.lines.length;
  }
}

registerStores([[CartStore, "web.cart"]]);

describe("commitStore", () => {
  it("bumps the version and writes only the data fields under the key", () => {
    const set = vi.fn();
    const store = new CartStore({ area: () => ({ get: () => undefined, set }) });
    commitStore(store);
    expect(storeVersion(store)).toBe(1);
    expect(set).toHaveBeenCalledWith("web.cart", { lines: ["sku_1"] });
  });

  it("calls every listener, even when one unsubscribes another", () => {
    const store = new CartStore();
    const second = vi.fn();
    let stopSecond: (() => void) | undefined;
    subscribeStore(store, () => stopSecond?.());
    stopSecond = subscribeStore(store, second);
    commitStore(store);
    expect(second).toHaveBeenCalledTimes(1);
    commitStore(store);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
