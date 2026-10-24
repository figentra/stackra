/**
 * Stackra file contract:
 * Purpose: unit and type tests of `OmitType`: the derived class has the remaining data fields (no methods), records
 *          its base and keys, and refuses a key that is not a data field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (amendment item
 *                     13).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { OmitType } from "#core/functions/omit-type.function";
import type { Fields } from "#core/types/fields.type";

class ProductView extends Schema {
  id!: string;

  title!: string;

  description?: string;

  createdAt!: Date;

  label(): string {
    return this.title;
  }
}

class ProductDraft extends OmitType(ProductView, ["id", "createdAt"]) {}

describe("OmitType", () => {
  it("types the remaining data fields", () => {
    expectTypeOf<Fields<ProductDraft>>().toEqualTypeOf<{ title: string; description?: string }>();
    // @ts-expect-error -- not a field of ProductView
    OmitType(ProductView, ["missing"]);
  });

  it("derives a Schema subclass that records its base and keys", () => {
    expect(kindOf(ProductDraft)).toEqual({
      kind: "schema",
      options: { base: ProductView, omit: ["id", "createdAt"] },
    });
    expect(Object.getPrototypeOf(Object.getPrototypeOf(ProductDraft) as object)).toBe(Schema);
  });
});
