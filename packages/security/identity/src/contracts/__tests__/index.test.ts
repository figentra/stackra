/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the gen wiring imports `SessionStore` from
 *          `@stackra/identity/contracts`; it and `SignInBrowser` are the only values exported, and `SessionUser`
 *          resolves to the signed-in user with the tenancy package's memberships.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { PublicId } from "@stackra/contracts";
import type { TenantMembership } from "@stackra/tenancy/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { SessionUser } from "#contracts/index";

describe("@stackra/identity/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Guardianship",
      "SessionStore",
      "SignInBrowser",
      "StaffPinStore",
      "Verification",
      "VerificationKind",
      "VerificationStatus",
    ]);
  });

  it("types the signed-in user", () => {
    expectTypeOf<SessionUser["userId"]>().toEqualTypeOf<PublicId<"usr">>();
    expectTypeOf<SessionUser["tenants"]>().toEqualTypeOf<readonly TenantMembership[]>();
    expectTypeOf<SessionUser["permissions"]>().toEqualTypeOf<readonly string[]>();
  });
});
