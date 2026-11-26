/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./contracts` entry of @stackra/tenancy: exactly the two client ports and the tenant
 *          data key store at run time, all three ports, and their members asynchronous.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0260.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { TenantMember, TenantProfileView } from "#contracts/index";
import { TenantMembers } from "#contracts/ports/tenant-members.port";
import { TenantProfile } from "#contracts/ports/tenant-profile.port";

describe("@stackra/tenancy/contracts", () => {
  it("exports exactly the ports", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "TenantDataKeyStore",
      "TenantMembers",
      "TenantProfile",
    ]);
    expect(contracts.TenantMembers).toBe(TenantMembers);
    expect(contracts.TenantProfile).toBe(TenantProfile);
    expect(Object.getPrototypeOf(TenantMembers)).toBe(Port);
    expect(Object.getPrototypeOf(TenantProfile)).toBe(Port);
    expect(Object.getPrototypeOf(contracts.TenantDataKeyStore)).toBe(Port);
  });

  it("types the calls as asynchronous and a member's name as nullable", () => {
    expectTypeOf<ReturnType<TenantMembers["remove"]>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<TenantProfile["get"]>>().toEqualTypeOf<Promise<TenantProfileView>>();
    expectTypeOf<TenantMember["name"]>().toEqualTypeOf<string | null>();
  });
});
