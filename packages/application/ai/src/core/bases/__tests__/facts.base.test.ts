/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Facts<M>`: the bare kind is registered as `facts`, a subclass gets its constructor
 *          dependencies, `provide` takes the subject's id and the facts context and returns a summary with facts, a
 *          refusal from `ctx.authorize` propagates, the subject type argument is required and `provide` is abstract.
 * Boundary: test only; the facts are the template's `OrderFacts` over a stand-in order and service.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0245 (decision 7); ADR 0305 (rule 5).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Facts } from "#core/bases/facts.base";
import type { ContextFacts } from "#core/types/context-facts.type";
import type { FactsContext } from "#core/types/facts-context.type";

/** The refusal a policy throws, standing in for `forbidden`. */
class OrderForbiddenError extends Error {}

class Order {
  id!: PublicId<"ord">;
  status = "pending_payment";
  totalMinor = 125_000;
}

class OrderService {
  readonly rows = new Map<string, Order>();

  async findOneOrFail(id: PublicId<"ord">): Promise<Order> {
    const order = this.rows.get(id);
    if (order === undefined) throw new RangeError(`no order ${id}`);
    return order;
  }
}

class OrderFacts extends Facts<Order> {
  readonly orders: OrderService;

  constructor(orders: OrderService) {
    super();
    this.orders = orders;
  }

  async provide(orderId: Order["id"], ctx: FactsContext): Promise<ContextFacts> {
    const order = await this.orders.findOneOrFail(orderId);
    await ctx.authorize(order);
    return {
      summary: `Order ${order.id} is ${order.status}, ${ctx.money(order.totalMinor, "SAR")}.`,
      facts: { id: order.id, status: order.status, canCancel: order.status === "pending_payment" },
    };
  }
}

/** A facts context for an agent acting for a customer; `allow` decides `authorize`. */
function context(allow: boolean): FactsContext {
  return {
    actor: {
      kind: ActorKind.Agent,
      id: "agt_01JA0000000000000000000001",
      onBehalfOf: { kind: ActorKind.System, id: "sys_test" },
    },
    locale: "en",
    authorize: async () => {
      if (!allow) throw new OrderForbiddenError("forbidden");
    },
    money: (minorUnits, currency) => `${currency} ${(minorUnits / 100).toFixed(2)}`,
  };
}

describe("Facts", () => {
  it("is the facts kind", () => {
    expect(kindOf(OrderFacts)).toEqual({ kind: "facts", options: {} });
  });

  it("provides a summary and facts read as the principal", async () => {
    const orders = new OrderService();
    const order = Object.assign(new Order(), { id: "ord_01JA0000000000000000000003" as const });
    orders.rows.set(order.id, order);
    const facts = new OrderFacts(orders);
    expect(facts).toBeInstanceOf(Facts);
    await expect(facts.provide(order.id, context(true))).resolves.toEqual({
      summary: "Order ord_01JA0000000000000000000003 is pending_payment, SAR 1250.00.",
      facts: { id: order.id, status: "pending_payment", canCancel: true },
    });
    await expect(facts.provide(order.id, context(false))).rejects.toBeInstanceOf(
      OrderForbiddenError,
    );
  });

  it("types provide by the subject's id and requires the subject", () => {
    expectTypeOf<Parameters<OrderFacts["provide"]>[0]>().toEqualTypeOf<PublicId<"ord">>();
    // @ts-expect-error -- the subject is a type argument: Facts<Order>
    class NoSubject extends Facts {}
    // @ts-expect-error -- provide is abstract and not implemented
    class Empty extends Facts<Order> {}
    expect([NoSubject, Empty]).toHaveLength(2);
  });
});
