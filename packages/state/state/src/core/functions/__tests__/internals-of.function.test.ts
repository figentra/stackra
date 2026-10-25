/**
 * Stackra file contract:
 * Purpose: unit tests of `internalsOf`: a store's fresh bookkeeping (no area without storage, version 0, hydration not
 *          started) and a throw for anything that is not a store.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079.
 */
import { describe, expect, it } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { internalsOf } from "#core/functions/internals-of.function";

class ToastStore extends Store {
  message = "";
}

describe("internalsOf", () => {
  it("returns the fresh bookkeeping of a store", () => {
    const internals = internalsOf(new ToastStore());
    expect(internals).toMatchObject({
      area: undefined,
      key: undefined,
      version: 0,
      hydration: false,
    });
    expect(internals.listeners.size).toBe(0);
    expect(internals.written.size).toBe(0);
  });

  it("throws for anything that is not a store", () => {
    expect(() => internalsOf({ message: "" })).toThrow(
      /Not a store: declare the class with `extends Store`/,
    );
  });
});
