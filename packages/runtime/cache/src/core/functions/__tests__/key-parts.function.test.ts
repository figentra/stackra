/**
 * Stackra file contract:
 * Purpose: unit tests of `keyAncestors` (every proper prefix of a key by whole parts, shortest first, none for a
 *          one-part key) and `keyOwner` (the first part, the label metrics count under).
 * Boundary: test only; pure functions over keys from `CacheKey.of`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { CacheKey } from "#core/constants/cache-key.constant";
import { keyAncestors } from "#core/functions/key-ancestors.function";
import { keyOwner } from "#core/functions/key-owner.function";

class Product {}

describe("keyAncestors", () => {
  it("lists every proper prefix by whole parts, shortest first", () => {
    expect(keyAncestors(CacheKey.of(Product, "prd_1", "en"))).toEqual(["Product", "Product:prd_1"]);
  });

  it("lists none for a one-part key", () => {
    expect(keyAncestors(CacheKey.of(Product))).toEqual([]);
  });

  it("never splits inside an encoded part", () => {
    expect(keyAncestors(CacheKey.of(Product, "a:b"))).toEqual(["Product"]);
  });
});

describe("keyOwner", () => {
  it("is the first part, or the whole one-part key", () => {
    expect(keyOwner(CacheKey.of(Product, "prd_1", "en"))).toBe("Product");
    expect(keyOwner(CacheKey.of(Product))).toBe("Product");
  });
});
