/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `useSession` is the only value; `SignedInSession` is the
 *          signed-in member of `SessionValue`, so the template's `SignedInSession["user"]` is the `SessionUser`.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SessionUser, SignInOptions } from "#contracts/index";
import * as react from "#react/index";
import type { SessionValue, SignedInSession } from "#react/index";

describe("@stackra/identity/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "useAccountDeletion",
      "useAppApprovalWait",
      "useSession",
    ]);
  });

  it("types the signed-in session", () => {
    expectTypeOf<SignedInSession["user"]>().toEqualTypeOf<SessionUser>();
    expectTypeOf<SignedInSession["status"]>().toEqualTypeOf<"signed_in">();
    expectTypeOf<SessionValue["user"]>().toEqualTypeOf<SessionUser | null>();
    expectTypeOf<SessionValue["signIn"]>().toEqualTypeOf<
      (options?: SignInOptions) => Promise<void>
    >();
  });
});
