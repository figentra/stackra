/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdentityResolverDriver`: it is the contracts' `IdentityResolver`; it answers a
 *          principal's address, refuses an unknown one `not_found`, and finds a principal by address
 *          case-insensitively, or nobody.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0134.
 */
import { IdentityResolver } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MemoryIdentityResolverDriver } from "#core/drivers/memory-identity-resolver.driver";

const RANA = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

const identity = new MemoryIdentityResolverDriver({
  [RANA]: { email: "Rana@Acme.example", locale: "ar" },
});

describe("MemoryIdentityResolverDriver", () => {
  it("is an IdentityResolver", () => {
    expect(identity).toBeInstanceOf(IdentityResolver);
  });

  it("answers a principal's address and refuses an unknown one", async () => {
    expect(await identity.emailOf(RANA)).toBe("Rana@Acme.example");
    await expect(identity.emailOf("usr_01j9z3k4m5n6p7q8r9s0t1v2w9")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("finds a principal by address, case-insensitively", async () => {
    expect(await identity.principalByVerifiedEmail("rana@acme.EXAMPLE")).toEqual({
      id: RANA,
      email: "Rana@Acme.example",
      locale: "ar",
    });
    expect(await identity.principalByVerifiedEmail("nobody@acme.example")).toBeNull();
  });

  it("holds nobody by default", async () => {
    expect(await new MemoryIdentityResolverDriver().principalByVerifiedEmail("a@b.c")).toBeNull();
  });
});
