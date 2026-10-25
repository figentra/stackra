/**
 * Stackra file contract:
 * Purpose: the `.` entry of @stackra/licensing exports exactly its public values and resolves its public types; the
 *          internal helpers stay internal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as licensing from "#core/index";
import type {
  Licence,
  LicenceFileOptions,
  LicenceKeyCheck,
  LicenceKeyCheckOptions,
  LicenceStanding,
} from "#core/index";

describe("@stackra/licensing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(licensing).sort()).toEqual([
      "KeygenLicenceVerifierDriver",
      "LicenceCheckUnavailableError",
      "LicenceFileInvalidError",
      "LicenceStanding",
      "LicenceVerifier",
      "LicensingConfig",
      "LicensingConfig$",
      "LicensingOptions",
      "checkLicenceKey",
      "licenceStanding",
      "verifyLicenceFile",
    ]);
    expect("readLicence" in licensing).toBe(false);
    expect("decryptLicence" in licensing).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<Licence>().toHaveProperty("entitlements").toEqualTypeOf<readonly string[]>();
    expectTypeOf<Licence>().toHaveProperty("expiry").toEqualTypeOf<Date | undefined>();
    expectTypeOf<LicenceFileOptions>().toHaveProperty("publicKey").toEqualTypeOf<string>();
    expectTypeOf<LicenceKeyCheck>().toHaveProperty("valid").toEqualTypeOf<boolean>();
    expectTypeOf<LicenceKeyCheckOptions>().toHaveProperty("account").toEqualTypeOf<string>();
    expectTypeOf<LicenceStanding>().toEqualTypeOf<"active" | "grace" | "read_only">();
  });
});
