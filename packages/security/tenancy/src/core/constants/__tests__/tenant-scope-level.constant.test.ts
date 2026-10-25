/**
 * Stackra file contract:
 * Purpose: unit tests of `TENANT_SCOPE_LEVEL`: the recursive `tenant` level, frozen; added to a deployment's
 *          `ScopeConfig` as data it validates, sits under `product`, and nests under itself (child tenants), with no
 *          code change in the scope package.
 * Boundary: test only; builds the scope package's configuration with the level appended.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 2 and 8); ADR 0210 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import { childLevelsOf, ScopeConfig as BaseScopeConfig } from "@stackra/scope";
import type { ScopeLevel } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TENANT_SCOPE_ALIAS } from "#core/constants/tenant-scope-alias.constant";
import { TENANT_SCOPE_LEVEL } from "#core/constants/tenant-scope-level.constant";
import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

/** A deployment that adds the tenant level after the scope package's defaults. */
class ScopeConfig extends BaseScopeConfig {
  override levels: ScopeLevel[] = [
    { key: "platform", recursive: false },
    { key: "product", recursive: false },
    TENANT_SCOPE_LEVEL,
  ];

  override aliases = { [TenancyScopes.Tenant]: TENANT_SCOPE_ALIAS };
}

describe("TENANT_SCOPE_LEVEL", () => {
  it("is the recursive tenant level, frozen", () => {
    expect(TENANT_SCOPE_LEVEL).toEqual({ key: "tenant", recursive: true });
    expect(Object.isFrozen(TENANT_SCOPE_LEVEL)).toBe(true);
  });

  it("validates as deployment data and nests tenants under a product and under each other", () => {
    const config = buildConfig(ScopeConfig);
    expect(config.levels.map((level) => level.key)).toEqual(["platform", "product", "tenant"]);
    expect(childLevelsOf(config.levels, "product")).toEqual(["tenant"]);
    expect(childLevelsOf(config.levels, TenancyScopes.Tenant)).toEqual(["tenant"]);
  });
});
