/**
 * Stackra file contract:
 * Purpose: unit tests of `RootScopeResolverDriver`: it answers the node at `ScopeConfig.root` (the default `platform`,
 *          or a deployment's own root), and passes when the tree shows no root.
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
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";
import { RootScopeResolverDriver } from "#core/drivers/root-scope-resolver.driver";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const GLOBAL: ScopeEntry = { ...ROOT, id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9", path: "global" };

const request = { actor: { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2w1" } } as const;

describe(RootScopeResolverDriver, () => {
  it("is a ScopeResolver that answers the configured root", async () => {
    const step = new RootScopeResolverDriver(
      new MemoryScopeTreeDriver([ROOT, GLOBAL]),
      buildConfig(ScopeConfig),
    );
    expect(step).toBeInstanceOf(ScopeResolver);
    await expect(step.resolve()).resolves.toBe(ROOT);
    const own = new RootScopeResolverDriver(
      new MemoryScopeTreeDriver([ROOT, GLOBAL]),
      buildConfig(ScopeConfig, { values: { root: "global" } }),
    );
    await expect(own.resolve()).resolves.toBe(GLOBAL);
  });

  it("passes when the tree shows no root", async () => {
    const step = new RootScopeResolverDriver(
      new MemoryScopeTreeDriver([]),
      buildConfig(ScopeConfig),
    );
    await expect((step as ScopeResolver).resolve(request)).resolves.toBeUndefined();
  });
});
