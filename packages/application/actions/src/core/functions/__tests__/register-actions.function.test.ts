/**
 * Stackra file contract:
 * Purpose: unit tests of `registerActions`: rows are stored by class (a later row replaces an earlier one) and a row
 *          that names no action or query, or no key, is refused.
 * Boundary: test only; reads the internal registry to observe the write.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 22).
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Action } from "#core/bases/action.base";
import { Query } from "#core/bases/query.base";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { registerActions } from "#core/functions/register-actions.function";

class CancelOrderAction extends Action({
  key: "order.cancel",
  actors: [ActorKind.User],
}) {
  async handle(_input: { orderId: string }): Promise<void> {}
}

class GetOrderQuery extends Query({
  key: "order.get",
  actors: [ActorKind.User],
}) {
  async handle(_input: { orderId: string }): Promise<null> {
    return null;
  }
}

describe(registerActions, () => {
  it("stores each row by class, the last row winning", () => {
    registerActions([
      {
        type: CancelOrderAction,
        key: "orders.order.cancel@1",
        permission: "orders.order.cancel",
        risk: "L1",
      },
      { type: GetOrderQuery, key: "orders.order.get@1" },
    ]);
    registerActions([
      {
        type: CancelOrderAction,
        key: "orders.order.cancel@1",
        permission: "orders.order.cancel",
        risk: "L2",
      },
    ]);
    expect(ACTION_REGISTRY.get(CancelOrderAction)?.risk).toBe("L2");
    expect(ACTION_REGISTRY.get(GetOrderQuery)?.key).toBe("orders.order.get@1");
  });

  it("refuses a class that is no action or query, and an empty key", () => {
    class OrderService {}
    expect(() =>
      registerActions([
        { type: OrderService as unknown as typeof CancelOrderAction, key: "orders.x@1" },
      ]),
    ).toThrow(TypeError);
    expect(() => registerActions([{ type: CancelOrderAction, key: "" }])).toThrow(/locked key/);
  });
});
