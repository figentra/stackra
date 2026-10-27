/**
 * Stackra file contract:
 * Purpose: type tests of `WithPartner`, the partner spike's negative cases on a test-local partner kind built with
 *          `createKind`: the partner is required in both forms, a called form without it fails with the readable
 *          hint, a subject of the wrong kind is refused by its brand, and a member typed from the partner is an
 *          abstract method on the generic base, so a subclass implements it without TS2425.
 * Boundary: test only; `Model`, `Policy` and their options are stand-ins for the kinds of @stackra/model and
 *           @stackra/iam.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0305 (rules 5 and 42
 *                     to 46).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Service } from "#core/bases/service.base";
import { createKind } from "#core/functions/create-kind.function";
import { kindOf } from "#core/functions/kind-of.function";
import { registerKind } from "#core/functions/register-kind.function";
import type { AnyClass } from "#core/types/any-class.type";
import type { WithPartner } from "#core/types/with-partner.type";

abstract class Model {
  declare readonly "~kind": "model";
}
registerKind(Model, "model");

class Order extends Model {
  status = "open";
}

class OrderPermissions {}

interface PolicyOptions {
  readonly permissions: AnyClass;
}

abstract class PolicyBase<M extends Model> {
  declare readonly "~kind": "policy";

  declare readonly "~subject": M;

  abstract view(actor: string, record: M): boolean;
}

type PolicyKind = (abstract new <M extends Model>() => PolicyBase<M>) &
  (<M extends Model = never>(
    options: WithPartner<
      M,
      PolicyOptions,
      "Name the model as a type argument: Policy<Order>({ … })"
    >,
  ) => abstract new () => PolicyBase<M>);

const Policy = createKind("policy", PolicyBase) as PolicyKind;

class OrderPolicy extends Policy<Order> {
  view(_actor: string, record: Order): boolean {
    return record.status === "open";
  }
}

class SalesOrderPolicy extends Policy<Order>({ permissions: OrderPermissions }) {
  view(): boolean {
    return false;
  }
}

describe("WithPartner", () => {
  it("is the options with a partner and the hint without one", () => {
    expectTypeOf<WithPartner<Order, PolicyOptions, "hint">>().toEqualTypeOf<PolicyOptions>();
    expectTypeOf<WithPartner<never, PolicyOptions, "hint">>().toEqualTypeOf<"hint">();
  });

  it("builds both forms of a partner kind, with the subject kept out of the runtime", () => {
    expect(new OrderPolicy().view("usr_1", new Order())).toBe(true);
    expect(new OrderPolicy()).toBeInstanceOf(Policy);
    expect(kindOf(OrderPolicy)).toEqual({ kind: "policy", options: {} });
    expect(kindOf(SalesOrderPolicy)).toEqual({
      kind: "policy",
      options: { permissions: OrderPermissions },
    });
  });

  it("refuses a missing partner, a non-model subject and a missing partner member", () => {
    // @ts-expect-error -- the bare form needs its type argument
    class Bare extends Policy {}
    // @ts-expect-error -- the called form without a type argument gets the hint
    class Called extends Policy({ permissions: OrderPermissions }) {}
    // @ts-expect-error -- a service is not a model
    class NotAModel extends Policy<Service> {}
    // @ts-expect-error -- view is abstract on the generic base
    class Incomplete extends Policy<Order> {}
    expect([Bare, Called, NotAModel, Incomplete]).toHaveLength(4);
  });
});
