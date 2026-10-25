/**
 * Stackra file contract:
 * Purpose: unit tests of `@OneToMany`: the target and inverse thunks and orphan removal are recorded; the field keeps
 *          its own `Collection` initializer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6, 11 and 27).
 */
import { Collection } from "@mikro-orm/core";
import type { Ref } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { ManyToOne } from "#core/decorators/many-to-one.decorator";
import { OneToMany } from "#core/decorators/one-to-many.decorator";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class Order extends Model.with(HasPublicId("ord")) {
  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
  lines = new Collection<OrderLine>(this);
}

class OrderLine extends Model.with(HasPublicId("oln")) {
  @ManyToOne(() => Order)
  order!: Ref<Order>;
}

describe(OneToMany, () => {
  it("records the target, the inverse and orphan removal", () => {
    const relation = OneToMany.members(Order).get("lines");
    expect(relation?.target()).toBe(OrderLine);
    expect(relation?.orphanRemoval).toBe(true);
    const line = { order: "ord_x" } as unknown as never;
    expect(relation?.inverse?.(line)).toBe("ord_x");
  });

  it("leaves the collection initializer to the field", () => {
    expect(new Order().lines).toBeInstanceOf(Collection);
  });
});
