/**
 * Stackra file contract:
 * Purpose: type tests of `Actor`: a user actor has a realm and a `usr` id, no other kind has a realm, a realm check
 *          narrows the id to a user id, and the delegation chain resolves to its subject.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0098 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActorKind } from "#core/enums/actor-kind.enum";
import { Realm } from "#core/enums/realm.enum";
import type { Actor } from "#core/types/actor.type";
import type { PublicId } from "#core/types/public-id.type";

const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Customer,
};
const agent: Actor = {
  kind: ActorKind.Agent,
  id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w3",
  onBehalfOf: customer,
};

/** Compiles only because a realm check narrows the actor to a user, whose id is a user id. */
function customerIdOf(actor: Actor): PublicId<"usr"> | null {
  return actor.realm === Realm.Customer ? actor.id : null;
}

describe("Actor", () => {
  it("narrows to a user id through the realm", () => {
    expect(customerIdOf(customer)).toBe("usr_01j9z3k4m5n6p7q8r9s0t1v2w3");
    expect(customerIdOf(agent)).toBeNull();
  });

  it("resolves the subject of a delegated call through onBehalfOf", () => {
    const subject = agent.onBehalfOf ?? agent;
    expect(subject).toBe(customer);
    expect(customerIdOf(subject)).toBe(customer.id);
  });

  it("refuses a realm on a non-user actor and a non-user id on a user", () => {
    // @ts-expect-error -- only a user actor has a realm
    const service: Actor = { kind: ActorKind.Service, id: "svc_a", realm: Realm.Tenant };
    // @ts-expect-error -- a user's id has the usr prefix
    const user: Actor = { kind: ActorKind.User, id: "agt_x", realm: Realm.Tenant };
    expect([service.kind, user.kind]).toEqual(["service", "user"]);
  });

  it("carries the tenant of the call when there is one", () => {
    const staff: Actor = {
      kind: ActorKind.User,
      id: "usr_a",
      realm: Realm.Tenant,
      tenantId: "ten_a",
    };
    expect(staff.tenantId).toBe("ten_a");
    expect(customer.tenantId).toBeUndefined();
  });
});
