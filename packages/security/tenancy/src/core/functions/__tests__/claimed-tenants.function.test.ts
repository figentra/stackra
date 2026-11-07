/**
 * Stackra file contract:
 * Purpose: unit tests of `claimedTenants`: an actor's own tenant and those of the actors it acts for, nearest first,
 *          skipping links with none; an actor with none claims nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0360.
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { claimedTenants } from "#core/functions/claimed-tenants.function";

const user: Actor = { kind: ActorKind.Job, id: "job_1", scopeId: "scp_a" };

describe(claimedTenants, () => {
  it("lists the actor's own tenant and those it acts for, nearest first, skipping links with none", () => {
    const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: "scp_b", onBehalfOf: user };
    expect(claimedTenants(agent)).toEqual(["scp_b", "scp_a"]);
    expect(claimedTenants({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: user })).toEqual([
      "scp_a",
    ]);
  });

  it("claims nothing for an actor with no tenant anywhere", () => {
    expect(claimedTenants({ kind: ActorKind.Agent, id: "agt_1" })).toEqual([]);
  });
});
