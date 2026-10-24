/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Page.of`: the page shape has `items`, `nextCursor` (optional) and `hasMore`, records
 *          its item class, and a subclass builds through its own registered schema.
 * Boundary: test only; registers the subclass's schema the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     26).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { Page } from "#core/constants/page.constant";
import { registerSchemas } from "#core/functions/register-schemas.function";
import type { Fields } from "#core/types/fields.type";

class ProductCard extends Schema {
  slug!: string;
}

class ProductPage extends Page.of(ProductCard) {}

registerSchemas([
  [
    ProductPage,
    z.object({
      items: z.array(z.object({ slug: z.string() })),
      nextCursor: z.string().exactOptional(),
      hasMore: z.boolean(),
    }),
  ],
]);

describe("Page", () => {
  it("gives items, an optional nextCursor and hasMore", () => {
    expectTypeOf<Fields<ProductPage>>().toEqualTypeOf<{
      items: Fields<ProductCard>[];
      nextCursor?: string;
      hasMore: boolean;
    }>();
  });

  it("records the item class on a Schema subclass", () => {
    expect(kindOf(ProductPage)).toEqual({ kind: "schema", options: { page: ProductCard } });
    expect(Object.isFrozen(Page)).toBe(true);
  });

  it("builds a subclass through its own schema", () => {
    const page = ProductPage.create({ items: [], hasMore: false });
    expect(page).toBeInstanceOf(ProductPage);
    expect(page).toEqual({ items: [], hasMore: false });
    // `?:` compiles to `.exactOptional()`: the key may be absent, never undefined.
    const explicitUndefined = { items: [], hasMore: false, nextCursor: undefined };
    expect(() => ProductPage.create(explicitUndefined as never)).toThrow();
  });
});
