/**
 * Stackra file contract:
 * Purpose: unit tests of `CacheEviction`: the eight Valkey policies in their tool spelling.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CacheEviction } from "#core/enums/cache-eviction.enum";

describe("CacheEviction", () => {
  it("keeps the Valkey spelling", () => {
    expect(Enum.values(CacheEviction)).toEqual([
      "noeviction",
      "allkeys-lru",
      "allkeys-lfu",
      "allkeys-random",
      "volatile-lru",
      "volatile-lfu",
      "volatile-random",
      "volatile-ttl",
    ]);
    expect(CacheEviction.VolatileTtl).toBe("volatile-ttl");
  });
});
