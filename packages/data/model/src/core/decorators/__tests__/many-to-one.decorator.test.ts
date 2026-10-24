/**
 * Stackra file contract:
 * Purpose: unit tests of `@ManyToOne`: the target thunk and the delete rule are recorded per field, for a `Ref<T>`
 *          and a `Link<T>`; tsc refuses it on a field of another type; refused on a class that is not a model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6, 11 and 28).
 */
import type { Ref } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { ManyToOne } from "#core/decorators/many-to-one.decorator";
import { OnDelete } from "#core/enums/on-delete.enum";
import { HasPublicId } from "#core/traits/has-public-id.trait";
import type { Link } from "#core/values/link.value";

class Variant extends Model.with(HasPublicId("var")) {}

class Order extends Model.with(HasPublicId("ord")) {}

class OrderLine extends Model.with(HasPublicId("oln")) {
  @ManyToOne(() => Order, { onDelete: OnDelete.Cascade })
  order!: Ref<Order>;

  @ManyToOne(() => Variant)
  variant!: Link<Variant>;

  quantity = 1;
}

describe(ManyToOne, () => {
  it("records the target and the options per field", () => {
    const relations = ManyToOne.members(OrderLine);
    expect([...relations.keys()]).toEqual(["order", "variant"]);
    expect(relations.get("order")?.target()).toBe(Order);
    expect(relations.get("order")?.onDelete).toBe("cascade");
    expect(relations.get("variant")?.target()).toBe(Variant);
    expect(relations.get("variant")?.onDelete).toBeUndefined();
  });

  it("is typed against its field", () => {
    class Wrong extends Model.with() {
      // @ts-expect-error: a number field is not a reference
      @ManyToOne(() => Order)
      order = 1;
    }
    expect(ManyToOne.members(Wrong).has("order")).toBe(true);
  });

  it("refuses a class that is not a model", () => {
    class Plain {
      order!: Ref<Order>;
    }
    const decorate = ManyToOne(() => Order) as (target: object, property: string) => void;
    expect(() => decorate(Plain.prototype, "order")).toThrow(TypeError);
  });
});
