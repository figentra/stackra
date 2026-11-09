/**
 * Stackra file contract:
 * Purpose: unit tests of `IAM_TESTING_PLUGIN`: it connects the policies to the compiled app, loads "everyone is owner
 *          at the root" into a memory policy source (so every principal holds every non-system permission), leaves
 *          any other source alone, and adds no app member. The record-policy check it hands the memory
 *          `AccessControl` runs for a visitor's call too, so another visitor holding a record's id is refused.
 * Boundary: test only; the apps are plain objects of the `TestingApp` shape the plugin reads (`has`, `get`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Action } from "@stackra/actions";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { MemoryAccessControlDriver } from "@stackra/actions/testing";
import type { AnyClass } from "@stackra/container";
import { Permissions, registerPermissions } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { type Actor, ActorKind, ApiArea, Permission, type PublicId } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PolicySource } from "#contracts/index";
import { Policy } from "#core/bases/policy.base";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { Decision } from "#core/enums/decision.enum";
import { registerPolicies } from "#core/functions/register-policies.function";
import { SystemRole } from "#core/enums/system-role.enum";
import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { actors } from "#testing/constants/actors.constant";
import { IAM_TESTING_PLUGIN } from "#testing/constants/iam-testing-plugin.constant";

/** A guest cart, keyed to the visitor who opened it. */
class Cart {
  constructor(readonly ownerId: string) {}
}

class CartPermissions extends Permissions {
  static readonly read = Permission.L0;
}

/** Only the cart's own visitor reads it. */
class CartPolicy extends Policy<Cart> {
  read(actor: Actor, cart: Cart): Decision {
    return cart.ownerId === actor.id ? Decision.Allow : Decision.Deny;
  }
}

/** A call open to visitors. */
class GetCartAction extends Action({
  key: "cart.get",
  actors: [ActorKind.Anonymous, ActorKind.User],
}) {
  async handle(): Promise<string> {
    return "cart";
  }
}

/** A visitor's call of `cart.get`. */
const visitorCall = (id: string): CallDescriptor => ({
  callId: "call_1",
  type: GetCartAction,
  kind: "action",
  key: "carts.cart.get@1",
  permission: "carts.cart.read",
  actor: { kind: ActorKind.Anonymous, id: id as PublicId },
  area: ApiArea.App,
});

/** An app that binds `bindings` only. */
function appWith(bindings: Map<AnyClass, object>): TestingApp {
  return {
    has: (token: AnyClass) => bindings.has(token),
    get: (token: AnyClass) => bindings.get(token),
  } as unknown as TestingApp;
}

describe("IAM_TESTING_PLUGIN", () => {
  it("connects the policies and opens the memory source to everyone as owner", async () => {
    const source = new MemoryPolicySourceDriver();
    const app = appWith(new Map([[PolicySource, source]]));

    expect(IAM_TESTING_PLUGIN.app?.(app)).toEqual({});
    expect(POLICY_REGISTRY.resolver).toBe(app);
    const snapshot = await source.snapshot(actors.customer());
    expect(snapshot.grants.map((grant) => grant.role)).toEqual([SystemRole.Owner]);
    expect(snapshot.roles).toEqual({ owner: ["*"] });
  });

  it("runs a visitor's record policy, so another visitor holding the record's id is refused (STA-2025)", async () => {
    POLICY_REGISTRY.rows.clear();
    registerPermissions([{ type: CartPermissions, keys: { read: "carts.cart.read" } }]);
    registerPolicies([{ model: Cart, policy: CartPolicy }]);
    IAM_TESTING_PLUGIN.app?.(appWith(new Map([[CartPolicy, new CartPolicy()]])));
    const driver = new MemoryAccessControlDriver();
    const cart = new Cart("anon_01j9z3k4m5n6p7q8r9s0t1v2a1");

    await expect(
      driver.authorize(visitorCall("anon_01j9z3k4m5n6p7q8r9s0t1v2a1"), cart),
    ).resolves.toBeUndefined();
    await expect(
      driver.authorize(visitorCall("anon_01j9z3k4m5n6p7q8r9s0t1v2a2"), cart),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("leaves an app without a memory source alone", () => {
    expect(IAM_TESTING_PLUGIN.app?.(appWith(new Map()))).toEqual({});
    expect(IAM_TESTING_PLUGIN.name).toBe("@stackra/iam");
  });
});
