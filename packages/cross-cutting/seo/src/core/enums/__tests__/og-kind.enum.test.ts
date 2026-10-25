/**
 * Stackra file contract:
 * Purpose: unit tests of `OgKind`: its codes in source order, a case read by name, the type of one code, and the
 *          frozen object.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OgKind } from "#core/enums/og-kind.enum";

describe("OgKind", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(OgKind)).toEqual(["site", "page", "product"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(OgKind.Product).toBe("product");
    expectTypeOf(OgKind.Site).toEqualTypeOf<"site">();
    expectTypeOf<OgKind>().toEqualTypeOf<"site" | "page" | "product">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(OgKind)).toBe(true);
  });
});
