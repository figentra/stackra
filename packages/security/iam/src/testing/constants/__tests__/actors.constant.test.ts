/**
 * Stackra file contract:
 * Purpose: unit and type tests of `actors`: each helper builds a frozen actor of its kind and realm, the user defaults
 *          are fixed (so two calls are the same person), a passed id must be a user's public id, a service may act for
 *          someone, and a user actor's `id` types as a user's public id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0098 (decisions 6 and 7); ADR 0269 (decision 3).
 */
import { ActorKind, type PublicId, Realm } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { actors } from "#testing/constants/actors.constant";

describe("actors", () => {
  it("builds users of the customer and tenant realms, with fixed defaults", () => {
    expect(actors.customer()).toEqual(actors.customer());
    expect(actors.customer()).toMatchObject({ kind: ActorKind.User, realm: Realm.Customer });
    expect(actors.staff("usr_staff")).toEqual({
      kind: ActorKind.User,
      id: "usr_staff",
      realm: Realm.Tenant,
    });
    expect(Object.isFrozen(actors.staff())).toBe(true);
    expectTypeOf(actors.customer().id).toEqualTypeOf<PublicId<"usr">>();
  });

  it("refuses an id that is not a user's public id", () => {
    expect(() => actors.customer("ord_01j9z3k4m5n6p7q8r9s0t1v2o1")).toThrow(TypeError);
  });

  it("builds a service, optionally acting for someone", () => {
    const owner = actors.customer("usr_1");
    expect(actors.service("notifications")).toEqual({
      kind: ActorKind.Service,
      id: "svc_notifications",
    });
    expect(actors.service("notifications", { onBehalfOf: owner }).onBehalfOf).toBe(owner);
  });

  it("builds the job, system and anonymous actors", () => {
    expect(actors.job().kind).toBe(ActorKind.Job);
    expect(actors.system().kind).toBe(ActorKind.System);
    expect(actors.anonymous().kind).toBe(ActorKind.Anonymous);
    expect(actors.anonymous().realm).toBeUndefined();
  });
});
