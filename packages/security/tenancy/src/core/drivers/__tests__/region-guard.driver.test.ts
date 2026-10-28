/**
 * Stackra file contract:
 * Purpose: unit tests of `RegionGuardDriver`, `MemoryTenantPlacementDriver` and
 *          `TenantPlacementConnectionResolverDriver`: the guard passes a call with no scope, a scope above every tenant
 *          and a tenant placed in this region, refuses `region_mismatch` for one placed elsewhere (a branch through
 *          its tenant), and fails closed with no placement or no deployment region; the resolver names the tenant's
 *          cell, the primary for platform work, and throws for an unplaced tenant.
 * Boundary: test only; the tree is the scope package's memory driver, the config is built from its defaults.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0353 (decisions 1 and 2); ADR 0172 (decision 3); ADR 0088 (decision
 *                     3); stackra-310.
 */
import { type CallDescriptor, TenancyCheck } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { ActorKind, ApiArea, type ScopeRef } from "@stackra/contracts";
import { DatabaseConfig } from "@stackra/database";
import { ConnectionResolver, PRIMARY_CONNECTION } from "@stackra/database/contracts";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenantPlacementDriver } from "#core/drivers/memory-tenant-placement.driver";
import { RegionGuardDriver } from "#core/drivers/region-guard.driver";
import { TenantPlacementConnectionResolverDriver } from "#core/drivers/tenant-placement-connection-resolver.driver";
import { RegionMismatchError } from "#core/errors/region-mismatch.error";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const GCC: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.gcc_shop",
  level: "tenant",
  name: "GCC shop",
};
const EU: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.eu_shop",
  level: "tenant",
  name: "EU shop",
};
const EU_BRANCH: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.eu_shop.berlin",
  level: "branch",
  name: "Berlin",
};
const UNPLACED: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
  path: "platform.new_shop",
  level: "tenant",
  name: "New shop",
};

const tree = new MemoryScopeTreeDriver().seed([ROOT, GCC, EU, EU_BRANCH, UNPLACED]);
const placements = new MemoryTenantPlacementDriver()
  .place(GCC.id as `scp_${string}`, "me")
  .place(EU.id as `scp_${string}`, "eu", "eu_cell_2");

/** The deployment's database config with `region`. */
const configIn = (region: string): DatabaseConfig =>
  buildConfig(DatabaseConfig, { values: { region } });

/** A call in `scope`, or a platform call. */
function callIn(scope?: ScopeRef): CallDescriptor {
  return {
    callId: "call_1",
    type: Object,
    kind: "action",
    key: "catalogue.product.create@1",
    actor: { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2w9" },
    ...(scope === undefined ? {} : { scope }),
    area: ApiArea.App,
  };
}

describe("RegionGuardDriver", () => {
  const guard = new RegionGuardDriver(placements, tree, configIn("me"));

  it("is a TenancyCheck driver", () => {
    expect(guard).toBeInstanceOf(TenancyCheck);
  });

  it("passes platform calls, scopes above every tenant and tenants placed here", async () => {
    await expect(guard.check(callIn())).resolves.toBeUndefined();
    await expect(guard.check(callIn(ROOT))).resolves.toBeUndefined();
    await expect(guard.check(callIn(GCC))).resolves.toBeUndefined();
  });

  it("refuses a tenant placed in another region, also through a branch", async () => {
    for (const scope of [EU, EU_BRANCH]) {
      const refused = await guard.check(callIn(scope)).catch((error: unknown) => error);
      expect(refused).toBeInstanceOf(RegionMismatchError);
      expect((refused as RegionMismatchError).details).toEqual({ region: "eu" });
    }
  });

  it("fails closed with no placement or no deployment region", async () => {
    await expect(guard.check(callIn(UNPLACED))).rejects.toThrow(/has no placement/);
    await expect(
      new RegionGuardDriver(placements, tree, configIn("")).check(callIn(GCC)),
    ).rejects.toThrow(/region is not set/);
  });
});

describe("TenantPlacementConnectionResolverDriver", () => {
  const resolver = new TenantPlacementConnectionResolverDriver(placements, tree);

  it("drives ConnectionResolver and names the tenant's cell, the primary by default", async () => {
    expect(resolver).toBeInstanceOf(ConnectionResolver);
    await expect(resolver.connectionOf(GCC)).resolves.toBe(PRIMARY_CONNECTION);
    await expect(resolver.connectionOf(EU_BRANCH)).resolves.toBe("eu_cell_2");
  });

  it("serves platform work on the primary and throws for an unplaced tenant", async () => {
    await expect(resolver.connectionOf(undefined)).resolves.toBe(PRIMARY_CONNECTION);
    await expect(resolver.connectionOf(ROOT)).resolves.toBe(PRIMARY_CONNECTION);
    await expect(resolver.connectionOf(UNPLACED)).rejects.toThrow(/has no placement/);
  });
});

describe("MemoryTenantPlacementDriver", () => {
  it("answers what was placed and nothing else", async () => {
    await expect(placements.of(GCC.id as `scp_${string}`)).resolves.toEqual({
      region: "me",
      cell: "primary",
    });
    await expect(placements.of(UNPLACED.id as `scp_${string}`)).resolves.toBeUndefined();
  });
});
