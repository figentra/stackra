/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `NonceProvider`, `Style` and `useNonce`, the symbols the
 *          template imports from `@stackra/csp/react`, are exported, nothing else is, and the props types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { NonceProviderProps, StyleProps } from "#react/index";

describe("@stackra/csp/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["NonceProvider", "Style", "useNonce"]);
    expect("NonceContext" in react).toBe(false);
  });

  it("resolves the props types", () => {
    expectTypeOf<NonceProviderProps["value"]>().toEqualTypeOf<string>();
    expectTypeOf<StyleProps["children"]>().toEqualTypeOf<string>();
  });
});
