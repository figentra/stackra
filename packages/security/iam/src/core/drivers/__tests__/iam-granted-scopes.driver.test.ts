/**
 * Stackra file contract:
 * Purpose: unit tests of `IamGrantedScopesDriver`: the nodes of the principal's unexpired grants, each once, the
 *          principal a delegate acts for, and an empty list (never everything) for a principal without grants.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the clock fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0327 (decision 7); ADR 0208 (decisions 1 and 2).
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm, type ScopeRef } from "@stackra/contracts";
import { GrantedScopes } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IamGrantedScopesDriver } from "#core/drivers/iam-granted-scopes.driver";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { SystemRole } from "#core/enums/system-role.enum";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.globex" };
const ann: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2a1",
  realm: Realm.Tenant,
};
const bob: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2b1",
  realm: Realm.Tenant,
};

describe("IamGrantedScopesDriver", () => {
  it("lists each node of the unexpired grants once, for the principal a delegate acts for", async () => {
    const source = new MemoryPolicySourceDriver();
    source.load({
      grants: [
        { principal: ann.id, role: SystemRole.Manager, scope: ACME },
        { principal: ann.id, role: SystemRole.Staff, scope: ACME },
        {
          principal: ann.id,
          role: SystemRole.Staff,
          scope: GLOBEX,
          expiresAt: new Date("2026-10-01T00:00:00Z"),
        },
      ],
    });
    const driver = new IamGrantedScopesDriver(source, new FixedClockDriver());

    expect(driver).toBeInstanceOf(GrantedScopes);
    expect(await driver.of(ann)).toEqual([ACME]);
    expect(await driver.of({ kind: ActorKind.Service, id: "svc_pos", onBehalfOf: ann })).toEqual([
      ACME,
    ]);
    expect(await driver.of(bob)).toEqual([]);
  });
});
