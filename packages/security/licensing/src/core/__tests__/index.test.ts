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
  InstallKey,
  Licence,
  LicenceDraft,
  LicenceFileOptions,
  LicenceKeyCheck,
  LicenceKeyCheckOptions,
  LicenceStanding,
  SignedUsageReport,
  UsageReportPayload,
} from "#core/index";

describe("@stackra/licensing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(licensing).sort()).toEqual([
      "IssuerConfig",
      "IssuerConfig$",
      "IssuerOptions",
      "KeygenLicenceIssuerDriver",
      "KeygenLicenceVerifierDriver",
      "LicenceCheckUnavailableError",
      "LicenceFileInvalidError",
      "LicenceIssuer",
      "LicenceIssuerUnavailableError",
      "LicenceStanding",
      "LicenceVerifier",
      "LicensingConfig",
      "LicensingConfig$",
      "LicensingOptions",
      "MemoryLicenceIssuerDriver",
      "checkLicenceKey",
      "generateInstallKey",
      "installSigner",
      "licenceStanding",
      "signUsageReport",
      "usageReportMessage",
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
    expectTypeOf<LicenceDraft>().toHaveProperty("expiry").toEqualTypeOf<Date>();
    expectTypeOf<UsageReportPayload>().toHaveProperty("version").toEqualTypeOf<1>();
    expectTypeOf<SignedUsageReport>().toHaveProperty("licenceId").toEqualTypeOf<string>();
    expectTypeOf<InstallKey>().toHaveProperty("privateKey").toEqualTypeOf<string>();
    expectTypeOf<LicenceStanding>().toEqualTypeOf<"active" | "grace" | "read_only">();
  });
});
