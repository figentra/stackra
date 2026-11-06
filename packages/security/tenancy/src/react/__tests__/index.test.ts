/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/tenancy: the two hooks and the kit's blocks
 *          (`TenantMenu`, `TenantPicker`, `MemberPicker`, `OrganizationPage`, `MembersPage`) at run time and the
 *          `TenantMembership` type the hooks return.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { TenantMembership as DeclaredMembership } from "#core/types/tenant-membership.type";
import * as react from "#react/index";
import { MemberPicker } from "#react/member-picker/member-picker";
import { MembersPage } from "#react/members-page/members-page";
import { OrganizationPage } from "#react/organization-page/organization-page";
import type { TenantMembership } from "#react/index";
import { useTenant } from "#react/tenant/use-tenant";
import { TenantMenu } from "#react/tenant-menu/tenant-menu";
import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";
import { TenantPicker } from "#react/tenant-picker/tenant-picker";

describe("@stackra/tenancy/react", () => {
  it("exports exactly the hooks and the blocks", () => {
    expect(Object.keys(react).sort()).toEqual([
      "MemberPicker",
      "MembersPage",
      "OrganizationPage",
      "TenantMenu",
      "TenantPicker",
      "useTenant",
      "useTenantSwitcher",
    ]);
    expect(react.TenantMenu).toBe(TenantMenu);
    expect(react.TenantPicker).toBe(TenantPicker);
    expect(react.MemberPicker).toBe(MemberPicker);
    expect(react.OrganizationPage).toBe(OrganizationPage);
    expect(react.MembersPage).toBe(MembersPage);
    expect(react.useTenant).toBe(useTenant);
    expect(react.useTenantSwitcher).toBe(useTenantSwitcher);
  });

  it("exports the membership type", () => {
    expectTypeOf<TenantMembership>().toEqualTypeOf<DeclaredMembership>();
  });
});
