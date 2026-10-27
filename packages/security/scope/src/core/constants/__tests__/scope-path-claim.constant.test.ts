/**
 * Stackra file contract:
 * Purpose: unit tests of `SCOPE_PATH_CLAIM`: the scope path claim is `urn:stackra:scope_path`, and the claim step
 *          resolves the path a verified token carries under that name.
 * Boundary: test only; the tree is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7).
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { ScopeEntry } from "#contracts/index";
import { SCOPE_PATH_CLAIM } from "#core/constants/scope-path-claim.constant";
import { ClaimScopeResolverDriver } from "#core/drivers/claim-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";

const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};

describe("SCOPE_PATH_CLAIM", () => {
  it("is urn:stackra:scope_path", () => {
    expect(SCOPE_PATH_CLAIM).toBe("urn:stackra:scope_path");
  });

  it("names the claim the claim step resolves", async () => {
    const verifiedClaims: Readonly<Record<string, unknown>> = {
      [SCOPE_PATH_CLAIM]: "platform.acme",
    };
    const claim = verifiedClaims[SCOPE_PATH_CLAIM];
    const step = new ClaimScopeResolverDriver(new MemoryScopeTreeDriver().seed([ACME]));
    await expect(
      step.resolve({
        actor: { kind: ActorKind.Agent, id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w1" },
        ...(typeof claim === "string" && { claim }),
      }),
    ).resolves.toBe(ACME);
  });
});
