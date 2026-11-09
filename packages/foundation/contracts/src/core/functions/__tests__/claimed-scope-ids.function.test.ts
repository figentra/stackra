/**
 * Stackra file contract:
 * Purpose: unit tests of `claimedScopeIds`: an actor's own tenant and those of the actors it acts for, nearest first,
 *          skipping links with none; an actor with none claims nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0360.
 */
import { describe, expect, it } from "@stackra/testing";

import { ActorKind } from "#core/enums/actor-kind.enum";
import { claimedScopeIds } from "#core/functions/claimed-scope-ids.function";
import type { Actor } from "#core/types/actor.type";

const user: Actor = { kind: ActorKind.Job, id: "job_1", scopeId: "scp_a" };

describe(claimedScopeIds, () => {
  it("lists the actor's own tenant and those it acts for, nearest first, skipping links with none", () => {
    const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: "scp_b", onBehalfOf: user };
    expect(claimedScopeIds(agent)).toEqual(["scp_b", "scp_a"]);
    expect(claimedScopeIds({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: user })).toEqual([
      "scp_a",
    ]);
  });

  it("claims nothing for an actor with no tenant anywhere", () => {
    expect(claimedScopeIds({ kind: ActorKind.Agent, id: "agt_1" })).toEqual([]);
  });
});
