/**
 * Stackra file contract:
 * Purpose: type tests of `ShapeClass<T>`: a class extending it has instances that are `Schema & T`, and its `create`
 *          is typed to the subclass.
 * Boundary: test only; the class under test is a stand-in made with `deriveShape`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { deriveShape } from "#core/functions/derive-shape.function";
import type { Fields } from "#core/types/fields.type";
import type { ShapeClass } from "#core/types/shape-class.type";

const Base = deriveShape("Totals", {}) as unknown as ShapeClass<{ totalMinor: number }>;

class OrderTotals extends Base {
  taxMinor = 0;
}

describe("ShapeClass", () => {
  it("gives instances that are a Schema and T, with create typed to the subclass", () => {
    expectTypeOf<OrderTotals>().toExtend<Schema>();
    expectTypeOf<Fields<OrderTotals>>().toEqualTypeOf<{ totalMinor: number; taxMinor: number }>();
    // Not called: no schema is registered for the stand-in; only the type of `create` is under test.
    const build = () => OrderTotals.create({ totalMinor: 1, taxMinor: 0 });
    expectTypeOf(build).returns.toEqualTypeOf<OrderTotals>();
    expect(new OrderTotals()).toBeInstanceOf(Schema);
  });
});
