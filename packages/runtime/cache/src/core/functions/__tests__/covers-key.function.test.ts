/**
 * Stackra file contract:
 * Purpose: unit tests of `coversKey`: a key covers itself and the keys that extend it by whole parts, never a sibling
 *          that merely shares a prefix, and works behind a namespace prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0305 (rule 32).
 */
import { describe, expect, it } from "@stackra/testing";

import { coversKey } from "#core/functions/covers-key.function";

describe("coversKey", () => {
  it("covers the key itself and its extensions", () => {
    expect(coversKey("Product:prd_1", "Product:prd_1")).toBe(true);
    expect(coversKey("Product:prd_1", "Product:prd_1:en")).toBe(true);
    expect(coversKey("Product", "Product:prd_1:en")).toBe(true);
  });

  it("does not cover a sibling sharing a prefix, or a parent", () => {
    expect(coversKey("Product:prd_1", "Product:prd_10")).toBe(false);
    expect(coversKey("Product", "ProductView:prd_1")).toBe(false);
    expect(coversKey("Product:prd_1:en", "Product:prd_1")).toBe(false);
  });

  it("works behind a namespace prefix", () => {
    expect(coversKey("a/Product:prd_1", "a/Product:prd_1:en")).toBe(true);
    expect(coversKey("a/Product:prd_1", "b/Product:prd_1:en")).toBe(false);
  });
});
