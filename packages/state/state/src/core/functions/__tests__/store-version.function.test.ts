/**
 * Stackra file contract:
 * Purpose: unit tests of `storeVersion`: 0 for a new store, one more after each change, and a throw for a non-store.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079.
 */
import { describe, expect, it } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { commitStore } from "#core/functions/commit-store.function";
import { storeVersion } from "#core/functions/store-version.function";

class FilterStore extends Store {
  query = "";
}

describe("storeVersion", () => {
  it("starts at 0 and moves on every change", () => {
    const store = new FilterStore();
    expect(storeVersion(store)).toBe(0);
    commitStore(store);
    commitStore(store);
    expect(storeVersion(store)).toBe(2);
  });

  it("throws for an object that is not a store", () => {
    expect(() => storeVersion({})).toThrow(TypeError);
  });
});
