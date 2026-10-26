/**
 * Stackra file contract:
 * Purpose: unit and type tests of `resource`: route constants exist only for the operations given, with the derived names
 *          and paths, and a bad key or base is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164 (0294 note); owner decision R-56.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { resource } from "#core/functions/resource.function";
import type { PageRef } from "#core/types/page-ref.type";

/** Stands in for the permission constants gen emits in an app. */
const TestPermissions = {
  ordersOrderRead: "orders.order.read",
} as const;

class ListOrdersQuery {}
class GetOrderQuery {}
class CreateProductAction {}
class UpdateProductAction {}

describe("resource", () => {
  it("builds the pages its operations give", () => {
    const Order = resource("orders.order", {
      base: "/orders/orders",
      list: ListOrdersQuery,
      view: GetOrderQuery,
      permission: TestPermissions.ordersOrderRead,
    });
    expect(Order.list).toEqual({ name: "orders.order.list", path: "/orders/orders" });
    expect(Order.view).toEqual({ name: "orders.order.view", path: "/orders/orders/:id" });
    expect(Order.operations).toEqual({ list: ListOrdersQuery, view: GetOrderQuery });
    expect(Order.permission).toBe("orders.order.read");
    expect(Order).not.toHaveProperty("create");
    expectTypeOf(Order.view).toEqualTypeOf<PageRef>();

    const Product = resource("catalogue.product", {
      base: "/catalogue/products",
      create: CreateProductAction,
      update: UpdateProductAction,
    });
    expect(Product.create.path).toBe("/catalogue/products/new");
    expect(Product.edit.path).toBe("/catalogue/products/:id/edit");
    expect(Product).not.toHaveProperty("view");
  });

  it("refuses a bad key or base", () => {
    expect(() => resource("orders", { base: "/orders" })).toThrow(RangeError);
    expect(() => resource("orders.order", { base: "orders" })).toThrow(RangeError);
  });
});
