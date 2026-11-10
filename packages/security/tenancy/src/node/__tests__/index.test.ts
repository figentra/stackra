/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./node` entry of @stackra/tenancy: the trait and its nullable form, their macro, the isolation service and driver, the approval binding model with its Postgres store driver and the prune job;
 *          no setting name and no tenant storage.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";
import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { BelongsToTenantOrPlatform } from "#node/traits/belongs-to-tenant-or-platform.trait";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

describe("@stackra/tenancy/node", () => {
  it("exports exactly the traits, the macro, the service, the isolation driver, the approval binding model with its store driver, the prune job and the commands", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ApprovalBinding",
      "ApprovalBindingPermissions",
      "BelongsToTenant",
      "BelongsToTenantMacro",
      "BelongsToTenantOrPlatform",
      "CallIsolationDriver",
      "EphemeralKeyProviderDriver",
      "KmsKeyProviderDriver",
      "PostgresApprovalBindingStoreDriver",
      "PostgresTenantDataKeyStoreDriver",
      "PruneApprovalBindingsAction",
      "TENANCY_ENTITIES",
      "TenantCreateCommand",
      "TenantDataKey",
      "TenantDataKeyService",
      "TenantIsolationService",
      "TenantListCommand",
    ]);
    expect(node.BelongsToTenant).toBe(BelongsToTenant);
    expect(node.BelongsToTenantMacro).toBe(BelongsToTenantMacro);
    expect(node.CallIsolationDriver).toBe(CallIsolationDriver);
    expect(node.BelongsToTenantOrPlatform).toBe(BelongsToTenantOrPlatform);
    expect(node.TenantIsolationService).toBe(TenantIsolationService);
  });
});
