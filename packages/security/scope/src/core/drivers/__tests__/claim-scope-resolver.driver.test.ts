/**
 * Stackra file contract:
 * Purpose: unit tests of `ClaimScopeResolverDriver`: the token's scope path claim resolves to its node; no claim, a
 *          malformed one and one for a missing node pass the request on (`undefined`); the header is not its input.
 * Boundary: test only; the tree is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7).
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeResolver } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import { ClaimScopeResolverDriver } from "#core/drivers/claim-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";

const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};

const AGENT: Actor = { kind: ActorKind.Agent, id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w1" };

const step = new ClaimScopeResolverDriver(new MemoryScopeTreeDriver().seed([ACME]));

describe(ClaimScopeResolverDriver, () => {
  it("is a ScopeResolver", () => {
    expect(step).toBeInstanceOf(ScopeResolver);
  });

  it("resolves the claim's node", async () => {
    await expect(step.resolve({ actor: AGENT, claim: "platform.acme" })).resolves.toBe(ACME);
  });

  it("passes without a usable claim, and ignores the header", async () => {
    await expect(step.resolve({ actor: AGENT })).resolves.toBeUndefined();
    await expect(step.resolve({ actor: AGENT, claim: "platform.ACME" })).resolves.toBeUndefined();
    await expect(step.resolve({ actor: AGENT, claim: "platform.other" })).resolves.toBeUndefined();
    await expect(step.resolve({ actor: AGENT, header: "platform.acme" })).resolves.toBeUndefined();
  });
});
