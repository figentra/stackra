/**
 * Stackra file contract:
 * Purpose: unit tests of `brandsOf`: a member's brands come from the injected facts; a member with none gets an empty
 *          list; a member absent from the facts fails.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`, as a bundle carries them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decision 8).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { brandsOf } from "#core/functions/brands-of.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

const ATELIER = {
  key: "atelier",
  name: "Atelier",
  tokens: "brands/atelier/tokens.css",
  appId: "com.atelier.shop",
  bundleIds: { ios: "com.atelier.shop", android: "com.atelier.shop" },
};

describe("brandsOf", () => {
  it("returns the member's brands", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      members: { shopper: { brands: [ATELIER] }, console: {} },
    });

    expect(brandsOf("shopper")).toEqual([ATELIER]);
  });

  it("returns an empty list for a member with no brands", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: { console: {} } });

    expect(brandsOf("console")).toEqual([]);
  });

  it("fails for a member the facts do not hold", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: {} });

    expect(() => brandsOf("shopper")).toThrow(RunwayUnresolvedError);
  });
});
