/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPolicySourceDriver`: it starts empty at version 0, `load` replaces the policy and
 *          raises the version, and a snapshot holds the principal's own rows and the rows for everyone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 3); ADR 0462 (no segment memberships).
 */
import { type Actor, ActorKind, Realm, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PolicySource } from "#contracts/index";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { SystemRole } from "#core/enums/system-role.enum";

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" };
const ann: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2a1",
  realm: Realm.Staff,
};
const bob: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2b1",
  realm: Realm.Staff,
};

describe("MemoryPolicySourceDriver", () => {
  it("starts empty at version 0", async () => {
    const source = new MemoryPolicySourceDriver();
    expect(source).toBeInstanceOf(PolicySource);
    expect(await source.snapshot(ann)).toEqual({
      version: 0,
      grants: [],
      roles: {},
      denies: [],
      visibility: [],
      fields: [],
      breakGlass: [],
    });
  });

  it("answers each principal its own rows and the rows for everyone", async () => {
    const source = new MemoryPolicySourceDriver();
    source.load({
      grants: [
        { role: SystemRole.Staff, scope: ROOT },
        { principal: ann.id, role: SystemRole.Manager, scope: ROOT },
      ],
      roles: { staff: ["orders.order.read"] },
      denies: [{ permission: "orders.order.cancel" }],
    });
    const forAnn = await source.snapshot(ann);
    const forBob = await source.snapshot(bob);

    expect(forAnn.version).toBe(1);
    expect(forAnn.grants.map((grant) => grant.role)).toEqual(["staff", "manager"]);
    expect(forBob.grants.map((grant) => grant.role)).toEqual(["staff"]);
    expect("segments" in forBob).toBe(false);
    expect(forBob.denies).toEqual([{ permission: "orders.order.cancel" }]);
  });

  it("replaces the whole policy on every load", async () => {
    const source = new MemoryPolicySourceDriver();
    source.load({ grants: [{ role: SystemRole.Staff, scope: ROOT }] });
    source.load({});
    const snapshot = await source.snapshot(ann);
    expect(snapshot.version).toBe(2);
    expect(snapshot.grants).toEqual([]);
  });
});
