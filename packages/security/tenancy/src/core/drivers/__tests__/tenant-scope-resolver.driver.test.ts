/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantScopeResolverDriver`: it answers the node of the caller's tenant when that node is at
 *          the tenant level; it passes for no tenant, an id that is not a tenant id, a node the tree does not show and
 *          a node at another level; placed before the root in a host's chain, it answers before the root.
 * Boundary: test only; the tree is the scope package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 7 and 8).
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import {
  ChainScopeResolverDriver as BaseChainScopeResolverDriver,
  ClaimScopeResolverDriver,
  HeaderScopeResolverDriver,
  MemoryScopeTreeDriver,
  RootScopeResolverDriver,
  ScopeConfig,
} from "@stackra/scope";
import { GrantedScopes, ScopeResolver } from "@stackra/scope/contracts";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantScopeResolverDriver } from "#core/drivers/tenant-scope-resolver.driver";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const PRODUCT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};
const TENANT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.acme.shop_eu",
  level: "tenant",
  name: "Shop EU",
};
const ABSENT = "scp_01j9z3k4m5n6p7q8r9s0t1v2w9";

const tree = new MemoryScopeTreeDriver([ROOT, PRODUCT, TENANT]);

/** A job acting in `tenantId`, or in none. */
const requestOf = (tenantId?: PublicId) => ({
  actor: {
    kind: ActorKind.Job,
    id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3" as const,
    ...(tenantId === undefined ? {} : { tenantId }),
  },
});

/** Grants nothing, so the header step never answers. */
class NoGrantsDriver extends Driver(GrantedScopes) {
  /** No grant. */
  async of(): Promise<readonly ScopeEntry[]> {
    return [];
  }
}

/** A host's chain with the tenancy step before the root. */
class ChainScopeResolverDriver extends BaseChainScopeResolverDriver {
  /** The tenancy step. */
  private readonly tenant: TenantScopeResolverDriver;

  constructor(
    header: HeaderScopeResolverDriver,
    claim: ClaimScopeResolverDriver,
    root: RootScopeResolverDriver,
    tenant: TenantScopeResolverDriver,
  ) {
    super(header, claim, root);
    this.tenant = tenant;
  }

  protected override steps(): readonly ScopeResolver[] {
    const steps = super.steps();
    return [...steps.slice(0, -1), this.tenant, ...steps.slice(-1)];
  }
}

describe(TenantScopeResolverDriver, () => {
  it("is a ScopeResolver that answers the caller's tenant node", async () => {
    const step = new TenantScopeResolverDriver(tree);
    expect(step).toBeInstanceOf(ScopeResolver);
    await expect(step.resolve(requestOf(TENANT.id))).resolves.toBe(TENANT);
  });

  it("passes for no tenant, a foreign id, an absent node and a node at another level", async () => {
    const step = new TenantScopeResolverDriver(tree);
    for (const tenantId of [
      undefined,
      "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      ABSENT,
      PRODUCT.id,
    ] as const)
      await expect(step.resolve(requestOf(tenantId))).resolves.toBeUndefined();
  });

  it("answers before the root once a host places it in the chain", async () => {
    const chain = new ChainScopeResolverDriver(
      new HeaderScopeResolverDriver(tree, new NoGrantsDriver()),
      new ClaimScopeResolverDriver(tree),
      new RootScopeResolverDriver(tree, buildConfig(ScopeConfig)),
      new TenantScopeResolverDriver(tree),
    );
    await expect(chain.resolve(requestOf(TENANT.id))).resolves.toBe(TENANT);
    await expect(chain.resolve(requestOf())).resolves.toBe(ROOT);
  });
});
