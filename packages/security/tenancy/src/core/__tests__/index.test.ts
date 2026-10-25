/**
 * Stackra file contract:
 * Purpose: pins the exports of the `.` entry of @stackra/tenancy: the switcher, the tenant level and its alias, the
 *          resolver step, the cron scopes driver, the tenant id check and the refusals; no `TenantMembership` (it is `./react`'s) and nothing
 *          server-only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decisions 7 and 8).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";
import { TENANT_SCOPE_LEVEL } from "#core/constants/tenant-scope-level.constant";
import { TenancyCronScopesDriver } from "#core/drivers/tenancy-cron-scopes.driver";
import { TenantScopeResolverDriver } from "#core/drivers/tenant-scope-resolver.driver";
import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";
import { TenantRequiredError } from "#core/errors/tenant-required.error";
import { isTenantId } from "#core/functions/is-tenant-id.function";
import { TenantSwitcher } from "#core/services/tenant-switcher.service";

describe("@stackra/tenancy", () => {
  it("exports exactly the switcher, sandboxes, shares, the level data, the drivers, the check and the refusals", () => {
    expect(Object.keys(core).sort()).toEqual([
      "MemorySandboxTenantsDriver",
      "MemoryTenantSharesDriver",
      "RevokedCopy",
      "SandboxNotFoundError",
      "SandboxTenantService",
      "SandboxTenants",
      "ShareStatus",
      "ShareTransitionInvalidError",
      "TENANT_SCOPE_ALIAS",
      "TENANT_SCOPE_LEVEL",
      "TenancyCronScopesDriver",
      "TenancyScopes",
      "TenantEnvironment",
      "TenantMembershipMissingError",
      "TenantRequiredError",
      "TenantScopeResolverDriver",
      "TenantShareService",
      "TenantShares",
      "TenantSwitcher",
      "TransferCheck",
      "TransferRefusedError",
      "isTenantId",
      "revocationPlan",
    ]);
  });

  it("re-exports the declaring files' symbols", () => {
    expect(core.TenantSwitcher).toBe(TenantSwitcher);
    expect(core.TENANT_SCOPE_LEVEL).toBe(TENANT_SCOPE_LEVEL);
    expect(core.TenantScopeResolverDriver).toBe(TenantScopeResolverDriver);
    expect(core.TenancyCronScopesDriver).toBe(TenancyCronScopesDriver);
    expect(core.TenancyScopes).toBe(TenancyScopes);
    expect(core.TenantRequiredError).toBe(TenantRequiredError);
    expect(core.isTenantId).toBe(isTenantId);
  });
});
