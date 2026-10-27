/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry of @stackra/licensing: types only (no value is exported),
 *          and the registry licence command, licence and grant resolve as the licence API sends them.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0453 (decision 14).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  RegistryLicence,
  RegistryLicenceCommand,
  RegistryLicenceGrant,
  RegistryLicenceToken,
} from "#contracts/index";

describe("@stackra/licensing/contracts", () => {
  it("exports no value", () => {
    expect(Object.keys(contracts)).toEqual([]);
  });

  it("resolves the licence API types", () => {
    expectTypeOf<RegistryLicenceCommand["action"]>().toEqualTypeOf<
      "issue" | "renew" | "setGrants" | "suspend" | "resume" | "revoke" | "addToken" | "revokeToken"
    >();
    expectTypeOf<RegistryLicence["status"]>().toEqualTypeOf<"active" | "suspended" | "revoked">();
    expectTypeOf<RegistryLicence["issuedToken"]>().toEqualTypeOf<string | null>();
    expectTypeOf<RegistryLicence["tokens"]>().toEqualTypeOf<readonly RegistryLicenceToken[]>();
    expectTypeOf<RegistryLicenceGrant["names"]>().toEqualTypeOf<"*" | readonly string[]>();
  });
});
