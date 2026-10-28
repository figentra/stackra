/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheKey.of`: the class name then each part in order, parts URI-encoded so `:` only
 *          separates parts, numbers accepted, a shorter key covering the longer ones, an anonymous class refused, and
 *          the result typed as the brand.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0305 (rule 32).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { CacheKey as Key } from "#contracts/types/cache-key.type";
import { CacheKey } from "#core/constants/cache-key.constant";
import { coversKey } from "#core/functions/covers-key.function";

class Product {}

describe("CacheKey", () => {
  it("joins the class name and the parts", () => {
    expect(CacheKey.of(Product, "prd_1", "en")).toBe("Product:prd_1:en");
    expect(CacheKey.of(Product)).toBe("Product");
    expect(CacheKey.of(Product, 42)).toBe("Product:42");
  });

  it("encodes each part, so a part cannot add a separator", () => {
    expect(CacheKey.of(Product, "a:b")).toBe("Product:a%3Ab");
    expect(coversKey(CacheKey.of(Product, "a"), CacheKey.of(Product, "a:b"))).toBe(false);
    expect(coversKey(CacheKey.of(Product, "a"), CacheKey.of(Product, "a", "b"))).toBe(true);
  });

  it("refuses an anonymous class", () => {
    const anonymous = (() => class {})();
    Object.defineProperty(anonymous, "name", { value: "" });
    expect(() => CacheKey.of(anonymous)).toThrow(RangeError);
  });

  it("makes the subject tag, which never covers a model key", () => {
    expect(CacheKey.subject("usr_1")).toBe("~subject:usr_1");
    expect(CacheKey.subject("a:b")).toBe("~subject:a%3Ab");
    expect(coversKey(CacheKey.subject("usr_1"), CacheKey.of(Product, "usr_1"))).toBe(false);
    expect(() => CacheKey.subject("")).toThrow(RangeError);
  });

  it("is frozen and makes the brand", () => {
    expect(Object.isFrozen(CacheKey)).toBe(true);
    expectTypeOf(CacheKey.of(Product, "prd_1")).toEqualTypeOf<Key>();
    expectTypeOf<CacheKey>().toEqualTypeOf<Key>();
  });
});
