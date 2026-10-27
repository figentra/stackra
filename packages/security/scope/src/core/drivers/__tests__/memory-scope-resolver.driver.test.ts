/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScopeResolverDriver`: the claim's node, else the root; the header is never read; no
 *          node refuses `ScopeUnresolvedError`.
 * Boundary: test only; the tree is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7).
 */
import { buildConfig } from "@stackra/config";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeConfig } from "#config/scope.config";
import { ScopeResolver } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import { MemoryScopeResolverDriver } from "#core/drivers/memory-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";
import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const SHOP: ScopeEntry = {
  ...ROOT,
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w8",
  path: "platform.acme",
  name: "Acme",
};

const actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2w1" } as const;
const resolver = (entries: readonly ScopeEntry[]): MemoryScopeResolverDriver =>
  new MemoryScopeResolverDriver(
    new MemoryScopeTreeDriver().seed(entries),
    buildConfig(ScopeConfig),
  );

describe(MemoryScopeResolverDriver, () => {
  it("is a ScopeResolver that answers the claim's node", async () => {
    const step = resolver([ROOT, SHOP]);
    expect(step).toBeInstanceOf(ScopeResolver);
    await expect(step.resolve({ actor, claim: "platform.acme" })).resolves.toBe(SHOP);
  });

  it("falls back to the root and never reads the header", async () => {
    await expect(resolver([ROOT, SHOP]).resolve({ actor, header: "platform.acme" })).resolves.toBe(
      ROOT,
    );
    await expect(resolver([ROOT]).resolve({ actor, claim: "platform.gone" })).resolves.toBe(ROOT);
  });

  it("refuses when the tree shows no node", async () => {
    await expect(resolver([]).resolve({ actor })).rejects.toBeInstanceOf(ScopeUnresolvedError);
  });
});
