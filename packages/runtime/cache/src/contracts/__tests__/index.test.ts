/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `Cache` (the template's web wiring imports it from
 *          `@stackra/cache/contracts`) and `CacheNamespace` are exported, nothing else is; the `CacheKey` brand stays
 *          with `.`.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import { Cache } from "#contracts/ports/cache.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";

describe("@stackra/cache/contracts", () => {
  it("exports exactly its ports", () => {
    expect(Object.keys(contracts).sort()).toEqual(["Cache", "CacheNamespace"]);
    expect(contracts.Cache).toBe(Cache);
    expect(contracts.CacheNamespace).toBe(CacheNamespace);
  });
});
