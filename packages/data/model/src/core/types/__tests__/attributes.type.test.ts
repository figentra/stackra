/**
 * Stackra file contract:
 * Purpose: type tests of `Attributes<M>`, written as the template's factories write their `definition`: any subset of
 *          the data fields, a factory or the target for a `Ref`, a public id for a `Link`, a locale map for a
 *          `Translated`; methods and wrong value types refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`), checked by `tsc --noEmit` on the tests,
 *           with one runtime assertion so the runner reports the file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (factories); ADR 0294 (decisions 11 and 28).
 */
import type { Ref } from "@mikro-orm/core";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { HasPublicId } from "#core/traits/has-public-id.trait";
import { Translatable } from "#core/traits/translatable.trait";
import type { Attributes } from "#core/types/attributes.type";
import type { RelationSource } from "#core/types/relation-source.type";
import type { Link } from "#core/values/link.value";
import type { Translated } from "#core/values/translated.value";

class Variant extends Model.with(HasPublicId("var")) {}

class Order extends Model.with(HasPublicId("ord")) {}

class OrderLine extends Model.with(HasPublicId("oln"), Translatable(["note"])) {
  order!: Ref<Order>;

  variant!: Link<Variant>;

  quantity = 1;

  unitPrice!: Money;

  note: Translated | null = null;

  total(): number {
    return this.quantity;
  }
}

/** A stand-in for @stackra/database's `Factory<Order>`, which declares the brand. */
class OrderFactory {
  declare readonly "~builds"?: Order;

  static new(): OrderFactory {
    return new OrderFactory();
  }
}

describe("Attributes", () => {
  it("accepts what a factory definition gives", () => {
    const source: RelationSource<Order> = OrderFactory.new();
    const attributes: Attributes<OrderLine> = {
      order: source,
      variant: "var_01jab3k4m5n6p7q8r9s0t1v2w3",
      quantity: 2,
      unitPrice: Money.ofMinor(100, "USD"),
      note: { en: "Gift", ar: "هدية" },
    };
    const empty: Attributes<OrderLine> = {};
    // @ts-expect-error: a method is not an attribute
    const method: Attributes<OrderLine> = { total: () => 1 };
    // @ts-expect-error: a link takes the target's id, not a number
    const wrongLink: Attributes<OrderLine> = { variant: 1 };
    // @ts-expect-error: the quantity is a number
    const wrongField: Attributes<OrderLine> = { quantity: "2" };
    expect([attributes, empty, method, wrongLink, wrongField]).toHaveLength(5);
  });
});
