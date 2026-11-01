/**
 * Stackra file contract:
 * Purpose: unit tests of `actorChainOverlaps`: the same principal, an agent acting for the other, the human an agent
 *          acts for, two agents of one human, a deep chain, and unrelated chains.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1724 (P-018).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActorKind } from "#core/enums/actor-kind.enum";
import { Realm } from "#core/enums/realm.enum";
import { actorChainOverlaps } from "#core/functions/actor-chain-overlaps.function";
import type { Actor } from "#core/types/actor.type";

const user = (id: `usr_${string}`): Actor => ({ kind: ActorKind.User, id, realm: Realm.Staff });
const agent = (id: `agt_${string}`, onBehalfOf: Actor): Actor => ({
  kind: ActorKind.Agent,
  id,
  onBehalfOf,
});

const SARA = user("usr_01j9z3k4m5n6p7q8r9s0t1v2w3");
const OMAR = user("usr_01j9z3k4m5n6p7q8r9s0t1v2w4");

describe(actorChainOverlaps, () => {
  it("is true for the same principal", () => {
    expect(actorChainOverlaps(SARA, SARA)).toBe(true);
  });

  it("is true for an agent acting for the other, in both directions", () => {
    const helper = agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w5", SARA);
    expect(actorChainOverlaps(helper, SARA)).toBe(true);
    expect(actorChainOverlaps(SARA, helper)).toBe(true);
  });

  it("is true for two agents of one human", () => {
    const one = agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w5", SARA);
    const two = agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w6", SARA);
    expect(actorChainOverlaps(one, two)).toBe(true);
  });

  it("is true for a deep chain that ends at the other", () => {
    const inner = agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w5", SARA);
    const outer = agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w6", inner);
    expect(actorChainOverlaps(outer, SARA)).toBe(true);
  });

  it("is false for unrelated chains", () => {
    expect(actorChainOverlaps(SARA, OMAR)).toBe(false);
    expect(actorChainOverlaps(agent("agt_01j9z3k4m5n6p7q8r9s0t1v2w5", SARA), OMAR)).toBe(false);
  });
});
