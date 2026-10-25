/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Factory`: `make` builds unsaved rows by plain construction when no database is
 *          connected (definition, states in order, sequence, overrides last, nested factories, `has` and `for` through
 *          the definition's factory field), every chain call returns a new factory, `count` retypes the result as a
 *          list, and `create` builds through the connected entity manager and flushes once.
 * Boundary: test only; `create` runs on a recording entity manager, never a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0190 as amended by ADR 0294; ADR 0269; ADR 0022.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { HasPublicId, Model } from "@stackra/model";
import type { Attributes, Ref } from "@stackra/model";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import { Database } from "#core/ports/database.port";
import { Factory } from "#testing/bases/factory.base";
import type { Faker } from "#testing/types/faker.type";

class Order extends Model.with(HasPublicId("ord")) {
  customerId = "";

  status = "pending";

  lines: OrderLine[] = [];
}

class OrderLine extends Model.with(HasPublicId("oln")) {
  order!: Ref<Order>;

  quantity = 1;
}

class OrderFactory extends Factory<Order> {
  definition(faker: Faker): Attributes<Order> {
    return { customerId: faker.publicId("usr") };
  }

  paid(): this {
    return this.state({ status: "paid" });
  }
}

class OrderLineFactory extends Factory<OrderLine> {
  definition(): Attributes<OrderLine> {
    return { order: OrderFactory.new(), quantity: 1 };
  }
}

registerModelPartners([
  [OrderFactory, Order],
  [OrderLineFactory, OrderLine],
]);

/** A database whose entity manager records `create` and `flush`. */
class RecordingDatabase extends Database {
  readonly create = vi.fn((ModelClass: new () => object, data: object, _options?: unknown) =>
    Object.assign(new ModelClass(), data),
  );

  readonly flush = vi.fn(async () => undefined);

  em(): EntityManager {
    return { create: this.create, flush: this.flush } as unknown as EntityManager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe(Factory, () => {
  it("makes a row from the definition, the states and the overrides", () => {
    const order = OrderFactory.new().paid().make({ customerId: "usr_given" });
    expect(order).toBeInstanceOf(Order);
    expect(order.id).toMatch(/^ord_/);
    expect([order.status, order.customerId]).toEqual(["paid", "usr_given"]);
    expect(OrderFactory.new().make().customerId).toMatch(/^usr_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("returns a new factory from every chain call", () => {
    const base = OrderFactory.new();
    expect(base.paid()).not.toBe(base);
    expect(base.make().status).toBe("pending");
  });

  it("counts, sequences and states by function", () => {
    const orders = OrderFactory.new()
      .sequence({ status: "paid" }, { status: "cancelled" })
      .state((faker) => ({ customerId: faker.publicId("usr") }))
      .count(3)
      .make();
    expectTypeOf(orders).toEqualTypeOf<Order[]>();
    expect(orders.map((order) => order.status)).toEqual(["paid", "cancelled", "paid"]);
  });

  it("builds nested factories and links has and for through the definition's field", () => {
    const line = OrderLineFactory.new().make();
    expect(line.order).toBeInstanceOf(Order);
    const parent = OrderFactory.new().make();
    expect(OrderLineFactory.new().for(parent).make().order).toBe(parent);
    const owners = OrderFactory.new().has(OrderLineFactory.new().count(2)).count(2).make();
    expect(owners).toHaveLength(2);
  });

  it("creates through the connected entity manager and flushes once", async () => {
    const database = new RecordingDatabase();
    ACTIVE_DATABASE.current = database;
    const order = await OrderFactory.new().has(OrderLineFactory.new().count(2)).create();
    expect(order).toBeInstanceOf(Order);
    expect(database.create).toHaveBeenCalledTimes(3);
    expect(database.create.mock.calls[1]?.[1]).toMatchObject({ order });
    expect(database.create.mock.calls[0]?.[2]).toEqual({ persist: true, convertCustomTypes: true });
    expect(database.flush).toHaveBeenCalledTimes(1);
  });

  it("refuses a bad count and a has that is not a factory", () => {
    expect(() => OrderFactory.new().count(0)).toThrow(RangeError);
    expect(() => OrderFactory.new().has({})).toThrow(/has takes a factory/);
  });
});
