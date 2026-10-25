/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeIdentity`, written as the template's notifications tests use it: an `IdentityResolver`
 *          that answers the named principal's address and finds it back by address; none by default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0134.
 */
import { IdentityResolver } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { fakeIdentity } from "#testing/functions/fake-identity.function";

const CUSTOMER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

describe("fakeIdentity", () => {
  it("resolves the principals the test names", async () => {
    const identity = fakeIdentity({ [CUSTOMER]: { email: "a@acme.example", locale: "ar" } });
    expect(identity).toBeInstanceOf(IdentityResolver);
    expect(await identity.emailOf(CUSTOMER)).toBe("a@acme.example");
    expect(await identity.principalByVerifiedEmail("A@acme.example")).toEqual({
      id: CUSTOMER,
      email: "a@acme.example",
      locale: "ar",
    });
  });

  it("knows nobody by default", async () => {
    expect(await fakeIdentity().principalByVerifiedEmail("a@acme.example")).toBeNull();
  });
});
