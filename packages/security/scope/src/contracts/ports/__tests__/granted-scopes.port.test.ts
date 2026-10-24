/**
 * Stackra file contract:
 * Purpose: unit tests of the `GrantedScopes` port: it is an abstract `Port` and a driver lists the scopes a principal
 *          holds a grant in, empty for none.
 * Boundary: test only; the driver here is a stand-in for the IAM one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0208; ADR 0327.
 */
import { Driver } from "@stackra/container";
import { ActorKind, Port, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { GrantedScopes } from "#contracts/ports/granted-scopes.port";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.acme" };

const MEMBER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Platform,
};

const STRANGER: Actor = { kind: ActorKind.Agent, id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w3" };

class ListGrantedScopesDriver extends Driver(GrantedScopes) {
  async of(actor: Actor): Promise<readonly ScopeRef[]> {
    return actor.id === MEMBER.id ? [ACME] : [];
  }
}

describe("GrantedScopes", () => {
  it("is an abstract port", () => {
    expect(GrantedScopes.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that lists a principal's granted scopes", async () => {
    const granted: GrantedScopes = new ListGrantedScopesDriver();
    await expect(granted.of(MEMBER)).resolves.toEqual([ACME]);
    await expect(granted.of(STRANGER)).resolves.toEqual([]);
  });
});
