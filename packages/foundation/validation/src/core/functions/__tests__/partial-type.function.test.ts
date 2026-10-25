/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PartialType`: every data field of the base becomes optional (no methods), and the
 *          derived class records its base.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26,
 *                     amendment item 13).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { PartialType } from "#core/functions/partial-type.function";
import type { Fields } from "#core/types/fields.type";

class ProductDraft extends Schema {
  title!: string;

  priceMinor = 0;

  label(): string {
    return this.title;
  }
}

class UpdateProductInput extends PartialType(ProductDraft) {}

describe("PartialType", () => {
  it("types every data field as optional", () => {
    expectTypeOf<Fields<UpdateProductInput>>().toEqualTypeOf<{
      title?: string;
      priceMinor?: number;
    }>();
  });

  it("derives a Schema subclass that records its base", () => {
    expect(kindOf(UpdateProductInput)).toEqual({
      kind: "schema",
      options: { base: ProductDraft, partial: true },
    });
  });
});
