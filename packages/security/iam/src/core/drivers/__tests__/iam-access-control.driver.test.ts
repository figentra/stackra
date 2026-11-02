/**
 * Stackra file contract:
 * Purpose: unit tests of `IamAccessControlDriver`: `require` passes a call without a permission, passes a held one at
 *          the call's `scope` (or, without one, the caller's node read from the tree) and refuses `forbidden`
 *          otherwise (and for an unknown node); `authorize` runs the policy
 *          method named after the verb (deny refuses, abstain and a missing method pass), refuses a matching
 *          conditional deny through the model's fact source and fails closed without one, and errors on an
 *          unconnected policy or an answer that is not a `Decision`; the driver runs as the permission step and
 *          `ctx.authorize` of the real `ActionPipeline`.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the tree `MemoryScopeTreeDriver`, the resolver a map.
 *           Every registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0138 (as amended); ADR 0132 (as amended by 0294 and 0263); ADR 0208 (decision 3).
 */
import {
  Action,
  ActionPipeline,
  InputInvalidError,
  registerActions,
  type ActionContext,
  type Resolver,
} from "@stackra/actions";
import { AccessControl, type CallDescriptor } from "@stackra/actions/contracts";
import {
  type AnyClass,
  Driver,
  kindOf,
  PERMISSION_REGISTRY,
  Permissions,
  registerPermissions,
} from "@stackra/container";
import {
  type Actor,
  ActorKind,
  ApiArea,
  Clock,
  Permission,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Policy } from "#core/bases/policy.base";
import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { IamAccessControlDriver } from "#core/drivers/iam-access-control.driver";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { Decision } from "#core/enums/decision.enum";
import { connectPolicies } from "#core/functions/connect-policies.function";
import { registerPolicies } from "#core/functions/register-policies.function";
import { PolicyDecisionPointService } from "#core/services/policy-decision-point.service";
import type { MemoryPolicyState } from "#core/types/memory-policy-state.type";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

class Order {
  readonly customerId: string;

  readonly region: string;

  constructor(customerId: string, region = "us") {
    this.customerId = customerId;
    this.region = region;
  }
}

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;

  static readonly cancel = Permission.L2;
}

/** A customer cancels only their own order; reading has no method, so it abstains. */
class OrderPolicy extends Policy<Order> {
  cancel(actor: Actor, order: Order): Decision {
    if (actor.realm !== Realm.Customer) return Decision.Abstain;
    return order.customerId === actor.id ? Decision.Allow : Decision.Deny;
  }
}

/** Answers something that is not a Decision. */
class BrokenPolicy extends Policy<Order> {
  cancel(): string {
    return "yes";
  }
}

class CancelOrderAction extends Action({
  key: "order.cancel",
  actors: [ActorKind.User],
}) {
  async handle(input: { order: Order }, ctx: ActionContext): Promise<string> {
    await ctx.authorize(input.order);
    return "cancelled";
  }
}

/** The input an anonymous sign-in action takes: an email, checked once the call is registered. */
class ChallengeInput {
  email!: string;
}
registerSchemas([[ChallengeInput, z.object({ email: z.email() })]]);

/** A class that opts into anonymous callers, as passkey sign-in does. */
class ChallengeAction extends Action({
  key: "passkey.challenge",
  actors: [ActorKind.Anonymous, ActorKind.User],
}) {
  async handle(input: ChallengeInput): Promise<string> {
    return `challenge for ${input.email}`;
  }
}

/** An action that never lists anonymous callers. */
class OpenAction extends Action({
  key: "order.open",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string> {
    return "opened";
  }
}

/** A visitor with no session. */
const visitor: Actor = {
  kind: ActorKind.Anonymous,
  id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId,
};

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2c1",
  realm: Realm.Customer,
};
const stranger: Actor = { ...customer, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2c2" };

const ORDER_FACTS = Rules.create({
  key: "orders.order",
  sources: [
    {
      key: "record",
      fields: {
        region: { type: FieldType.String, label: "orders::fields.region" as FactField["label"] },
      },
    },
  ],
});

/** Everyone holds read and cancel at the root. */
const BUYERS: MemoryPolicyState = {
  grants: [{ role: "buyer", scope: ROOT }],
  roles: { buyer: ["orders.order.read", "orders.order.cancel"] },
};

/** A driver over `state`, the tree holding Acme, and its policies connected to `bindings`. */
function driverOver(state: MemoryPolicyState, bindings: Map<AnyClass, object> = new Map()) {
  const source = new MemoryPolicySourceDriver();
  source.load(state);
  const pdp = new PolicyDecisionPointService(source, new FixedClockDriver());
  const driver = new IamAccessControlDriver(
    pdp,
    new MemoryScopeTreeDriver().seed([
      { ...ROOT, level: "platform", name: "Platform" },
      { ...ACME, level: "product", name: "Acme" },
    ]),
  );
  bindings.set(OrderPolicy, new OrderPolicy());
  bindings.set(BrokenPolicy, new BrokenPolicy());
  bindings.set(AccessControl, driver);
  const resolver: Resolver = {
    has: (token) => bindings.has(token),
    get: <T extends object>(token: AnyClass<T>) => bindings.get(token) as T,
  };
  connectPolicies(resolver);
  return { driver, resolver };
}

/** The descriptor the pipeline builds for a call of `permission` by `actor`, acting in `scope` when given. */
function callOf(
  actor: Actor,
  permission?: string,
  scope?: ScopeRef,
  type: AnyClass = CancelOrderAction,
): CallDescriptor {
  return {
    callId: "call_1",
    type,
    kind: kindOf(type)?.kind === "query" ? "query" : "action",
    key: "orders.order.cancel@1",
    ...(permission === undefined ? {} : { permission }),
    actor,
    ...(scope === undefined ? {} : { scope }),
    area: ApiArea.App,
  };
}

/** `actor` whose credential carries the scope id `id`. */
function within(actor: Actor, id: PublicId): Actor {
  return { ...actor, scopeId: id };
}

describe("IamAccessControlDriver", () => {
  beforeEach(() => {
    PERMISSION_REGISTRY.clear();
    POLICY_REGISTRY.rows.clear();
    POLICY_REGISTRY.resolver = undefined;
    registerPermissions([
      {
        type: OrderPermissions,
        keys: { read: "orders.order.read", cancel: "orders.order.cancel" },
      },
    ]);
    registerPolicies([{ model: Order, policy: OrderPolicy }]);
  });

  describe("require", () => {
    it("passes a held permission and refuses one not held", async () => {
      const { driver } = driverOver(BUYERS);
      await expect(
        driver.require(callOf(customer, "orders.order.cancel")),
      ).resolves.toBeUndefined();
      await expect(driver.require(callOf(customer, "orders.order.refund"))).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it("refuses a call without a permission, whoever calls and whatever the class (STA-2025)", async () => {
      const { driver } = driverOver(BUYERS);
      // An unregistered call carries no permission: never an allowed call.
      await expect(driver.require(callOf(customer))).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        driver.authorize(callOf(customer), new Order(customer.id)),
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        driver.require(callOf(visitor, undefined, undefined, ChallengeAction)),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("lets only an anonymous caller of a class that lists anonymous callers past the check", async () => {
      const { driver } = driverOver(BUYERS);
      const permission = "identity.passkey.challenge";
      await expect(
        driver.require(callOf(visitor, permission, undefined, ChallengeAction)),
      ).resolves.toBeUndefined();
      await expect(
        driver.authorize(
          callOf(visitor, permission, undefined, ChallengeAction),
          new Order(customer.id),
        ),
      ).resolves.toBeUndefined();
      // A signed-in caller of the same class is checked: the customer holds no such permission.
      await expect(
        driver.require(callOf(customer, permission, undefined, ChallengeAction)),
      ).rejects.toBeInstanceOf(ForbiddenError);
      // An anonymous caller of a class that does not list anonymous callers is checked, and holds nothing.
      await expect(
        driver.require(callOf(visitor, "orders.order.open", undefined, OpenAction)),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("checks at the call's scope, without reading the tree", async () => {
      const { driver } = driverOver({ ...BUYERS, grants: [{ role: "buyer", scope: ACME }] });
      const unknown = within(customer, "scp_01j9z3k4m5n6p7q8r9s0t1v2zz");
      await expect(
        driver.require(callOf(customer, "orders.order.read", ACME)),
      ).resolves.toBeUndefined();
      await expect(
        driver.require(callOf(unknown, "orders.order.read", ACME)),
      ).resolves.toBeUndefined();
      await expect(
        driver.require(callOf(customer, "orders.order.read", ROOT)),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("reads the caller's node from the tree when the call has no scope, and refuses an unknown node", async () => {
      const { driver } = driverOver({ ...BUYERS, grants: [{ role: "buyer", scope: ACME }] });
      await expect(
        driver.require(callOf(within(customer, ACME.id), "orders.order.read")),
      ).resolves.toBeUndefined();
      await expect(driver.require(callOf(customer, "orders.order.read"))).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      await expect(
        driver.require(
          callOf(within(customer, "scp_01j9z3k4m5n6p7q8r9s0t1v2zz"), "orders.order.read"),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("authorize", () => {
    it("runs the policy method named after the verb", async () => {
      const { driver } = driverOver(BUYERS);
      const mine = new Order(customer.id);
      await expect(
        driver.authorize(callOf(customer, "orders.order.cancel"), mine),
      ).resolves.toBeUndefined();
      await expect(
        driver.authorize(callOf(stranger, "orders.order.cancel"), mine),
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        driver.authorize(callOf(stranger, "orders.order.read"), mine),
      ).resolves.toBeUndefined();
      await expect(driver.authorize(callOf(stranger), mine)).resolves.toBeUndefined();
    });

    it("refuses a matching conditional deny through the model's fact source, and fails closed without one", async () => {
      const denies: MemoryPolicyState["denies"] = [
        {
          permission: "orders.order.read",
          condition: { field: "record.region", operator: Operator.Equals, value: "eu" },
        },
      ];
      const { driver } = driverOver({ ...BUYERS, denies });
      const call = callOf(stranger, "orders.order.read");

      await expect(driver.authorize(call, new Order(customer.id, "eu"))).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      registerPolicies([{ model: Order, policy: OrderPolicy, rules: ORDER_FACTS }]);
      await expect(driver.authorize(call, new Order(customer.id, "eu"))).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      await expect(driver.authorize(call, new Order(customer.id, "us"))).resolves.toBeUndefined();
    });

    it("errors on an unconnected policy and on an answer that is not a Decision", async () => {
      const { driver } = driverOver(BUYERS);
      registerPolicies([{ model: Order, policy: BrokenPolicy }]);
      await expect(
        driver.authorize(callOf(customer, "orders.order.cancel"), new Order(customer.id)),
      ).rejects.toThrow(/not a Decision/);
      POLICY_REGISTRY.resolver = undefined;
      await expect(
        driver.authorize(callOf(customer, "orders.order.cancel"), new Order(customer.id)),
      ).rejects.toThrow(/connectPolicies/);
    });
  });

  it("is the permission step and ctx.authorize of ActionPipeline", async () => {
    registerActions([
      { type: CancelOrderAction, key: "orders.order.cancel@1", permission: "orders.order.cancel" },
    ]);
    const bindings = new Map<AnyClass, object>([[CancelOrderAction, new CancelOrderAction()]]);
    const { resolver } = driverOver(BUYERS, bindings);
    const pipeline = new ActionPipeline(resolver);
    const mine = new Order(customer.id);

    await expect(
      pipeline.execute(CancelOrderAction, { order: mine } as never, { actor: customer }),
    ).resolves.toBe("cancelled");
    await expect(
      pipeline.execute(CancelOrderAction, { order: mine } as never, { actor: stranger }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses an action the pipeline was never told about (STA-2025)", async () => {
    // No registerActions row: the call has no permission, so it is refused, never run.
    const bindings = new Map<AnyClass, object>([[OpenAction, new OpenAction()]]);
    const { resolver } = driverOver(BUYERS, bindings);
    await expect(
      new ActionPipeline(resolver).execute(OpenAction, {} as never, { actor: customer }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("runs an anonymous call's other steps: its input is still validated (STA-2025)", async () => {
    registerActions([
      {
        type: ChallengeAction,
        key: "identity.passkey.challenge@1",
        permission: "identity.passkey.challenge",
        input: ChallengeInput,
      },
    ]);
    const bindings = new Map<AnyClass, object>([[ChallengeAction, new ChallengeAction()]]);
    const { resolver } = driverOver(BUYERS, bindings);
    const pipeline = new ActionPipeline(resolver);
    await expect(
      pipeline.execute(ChallengeAction, { email: "ada@example.com" } as never, { actor: visitor }),
    ).resolves.toBe("challenge for ada@example.com");
    await expect(
      pipeline.execute(ChallengeAction, { email: "not an email" } as never, { actor: visitor }),
    ).rejects.toBeInstanceOf(InputInvalidError);
  });
});
