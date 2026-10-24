/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/tenancy: the two hooks at run time and the
 *          `TenantMembership` type they return.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { TenantMembership as DeclaredMembership } from "#core/types/tenant-membership.type";
import * as react from "#react/index";
import type { TenantMembership } from "#react/index";
import { useTenant } from "#react/tenant/use-tenant";
import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";

describe("@stackra/tenancy/react", () => {
  it("exports exactly the hooks", () => {
    expect(Object.keys(react).sort()).toEqual(["useTenant", "useTenantSwitcher"]);
    expect(react.useTenant).toBe(useTenant);
    expect(react.useTenantSwitcher).toBe(useTenantSwitcher);
  });

  it("exports the membership type", () => {
    expectTypeOf<TenantMembership>().toEqualTypeOf<DeclaredMembership>();
  });
});
