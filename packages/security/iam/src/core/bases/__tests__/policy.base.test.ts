/**
 * Stackra file contract:
 * Purpose: unit tests of `Policy`: the bare form (`Policy<Order>`) and the called form (`Policy<StockLevel>({
 *          permissions })`) both register the `policy` kind, a subclass keeps its constructor dependencies through
 *          `super()`, the called form refuses a permissions value that is not a permission set, and the called form
 *          without its type argument is a type error.
 * Boundary: test only; the policies mirror the template's `OrderPolicy` and `StockPolicy`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0305 (rules 2, 5 to 7 and 44); ADR 0132 (as amended by 0294).
 */
import { kindOf } from "@stackra/container";
import { type Actor, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { Policy } from "#core/bases/policy.base";
import { Decision } from "#core/enums/decision.enum";
import { Permission } from "#core/values/permission.value";

class Order {
  customerId = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";
}

class StockLevel {}

class StockPermissions extends Permissions {
  static readonly manage = Permission.L2;
}

class OrderPolicy extends Policy<Order> {
  readonly settings: { customersMayCancel: boolean };

  constructor(settings: { customersMayCancel: boolean }) {
    super();
    this.settings = settings;
  }

  read(actor: Actor, order: Order): Decision {
    const stranger = actor.realm === Realm.Customer && actor.id !== order.customerId;
    return stranger ? Decision.Deny : Decision.Abstain;
  }
}

class StockPolicy extends Policy<StockLevel>({ permissions: StockPermissions }) {
  manage(actor: Actor): Decision {
    return actor.realm === Realm.Customer ? Decision.Deny : Decision.Abstain;
  }
}

describe("Policy", () => {
  it("registers the bare form as the policy kind and keeps constructor dependencies", () => {
    const policy = new OrderPolicy({ customersMayCancel: true });
    expect(kindOf(OrderPolicy)).toEqual({ kind: "policy", options: {} });
    expect(policy.settings.customersMayCancel).toBe(true);
  });

  it("records the permission set of the called form", () => {
    expect(kindOf(StockPolicy)).toEqual({
      kind: "policy",
      options: { permissions: StockPermissions },
    });
    expect(new StockPolicy()).toBeInstanceOf(StockPolicy);
  });

  it("refuses a permissions value that is not a permission set", () => {
    expect(() => Policy<Order>({ permissions: class {} as typeof StockPermissions })).toThrow(
      TypeError,
    );
  });

  it("needs the model as a type argument in the called form", () => {
    // @ts-expect-error -- reason: without `<Model>` the options type is the readable hint
    expect(() => Policy({ permissions: StockPermissions })).not.toThrow();
  });
});
