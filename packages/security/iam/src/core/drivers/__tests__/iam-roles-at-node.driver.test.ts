/**
 * Stackra file contract:
 * Purpose: unit tests of `IamRolesAtNodeDriver`: the roles of grants held at the node or above it, unexpired at the
 *          moment asked (the clock's now by default), for the principal a delegate acts for, and an empty set for a
 *          principal without a grant there.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the clock fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 and 2); STA-1271.
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RolesAtNode } from "#contracts/ports/roles-at-node.port";
import { IamRolesAtNodeDriver } from "#core/drivers/iam-roles-at-node.driver";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { SystemRole } from "#core/enums/system-role.enum";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const BRANCH: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme.riyadh" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.globex" };
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

/** A driver over ann's grants. */
function driver(): IamRolesAtNodeDriver {
  const source = new MemoryPolicySourceDriver();
  source.load({
    grants: [
      { principal: ann.id, role: SystemRole.Manager, scope: ACME },
      { principal: ann.id, role: "branch_manager", scope: BRANCH },
      {
        principal: ann.id,
        role: SystemRole.Staff,
        scope: ACME,
        expiresAt: new Date("2026-10-20T00:00:00Z"),
      },
      { principal: ann.id, role: "auditor", scope: GLOBEX },
    ],
  });
  return new IamRolesAtNodeDriver(source, new FixedClockDriver());
}

describe("IamRolesAtNodeDriver", () => {
  it("answers the roles held at the node or above it, unexpired now", async () => {
    const roles = driver();
    expect(roles).toBeInstanceOf(RolesAtNode);
    expect([...(await roles.of(ann, BRANCH))].sort()).toEqual(
      ["branch_manager", SystemRole.Manager].sort(),
    );
    expect([...(await roles.of(ann, ACME))]).toEqual([SystemRole.Manager]);
  });

  it("counts a grant only while it is live at the moment asked", async () => {
    const before = await driver().of(ann, ACME, new Date("2026-10-19T00:00:00Z"));
    expect([...before].sort()).toEqual([SystemRole.Manager, SystemRole.Staff].sort());
  });

  it("answers for the principal a delegate acts for, and nothing for one without grants", async () => {
    const roles = driver();
    expect(
      await roles.of(
        { kind: ActorKind.Agent, id: "agt_01j9z3k4m5n6p7q8r9s0t1v2c1", onBehalfOf: ann },
        GLOBEX,
      ),
    ).toEqual(new Set(["auditor"]));
    expect(await roles.of(bob, BRANCH)).toEqual(new Set());
  });
});
