/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./node` entry of @stackra/tenancy: the trait, its macro and the isolation service;
 *          no setting name and no tenant storage.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";
import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

describe("@stackra/tenancy/node", () => {
  it("exports exactly the trait, the macro and the service", () => {
    expect(Object.keys(node).sort()).toEqual([
      "BelongsToTenant",
      "BelongsToTenantMacro",
      "TenantIsolationService",
    ]);
    expect(node.BelongsToTenant).toBe(BelongsToTenant);
    expect(node.BelongsToTenantMacro).toBe(BelongsToTenantMacro);
    expect(node.TenantIsolationService).toBe(TenantIsolationService);
  });
});
