/**
 * Stackra file contract:
 * Purpose: unit tests of `readLicence`: a full Keygen dataset maps to a `Licence`, absent or `null` fields read as
 *          unlimited or perpetual, only `entitlements` resources count, and a dataset without its issue time or
 *          licence id is refused as malformed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178 (decision 6).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import { readLicence } from "#core/functions/read-licence.function";

import { keygenDataset } from "./fixtures/licence-file.fixture";

describe("readLicence", () => {
  it("maps a Keygen dataset", () => {
    const licence = readLicence(keygenDataset());
    expect(licence.id).toBe("6a2c1f0e-0b7f-4c0a-9d8e-1f2a3b4c5d6e");
    expect(licence.maxUsers).toBe(50);
    expect(licence.entitlements).toEqual(["SSO", "AUDIT_LOG"]);
    expect(licence.fileExpiry).toEqual(new Date("2026-11-01T00:00:00.000Z"));
  });

  it("reads null limits and expiry as unlimited and perpetual", () => {
    const licence = readLicence({
      meta: { issued: "2026-10-01T00:00:00.000Z", expiry: null, ttl: null },
      data: {
        id: "lic",
        attributes: { status: "ACTIVE", expiry: null, maxMachines: null, maxUsers: null },
      },
    });
    expect(licence).toEqual({
      id: "lic",
      name: undefined,
      status: "ACTIVE",
      expiry: undefined,
      issued: new Date("2026-10-01T00:00:00.000Z"),
      fileExpiry: undefined,
      maxMachines: undefined,
      maxUsers: undefined,
      entitlements: [],
      metadata: {},
    });
  });

  it("refuses a dataset without an issue time", () => {
    const error: unknown = (() => {
      try {
        return readLicence({ meta: {}, data: { id: "lic" } });
      } catch (caughtError) {
        return caughtError;
      }
    })();
    expect(isRefusal(error, LicenceFileInvalidError)).toBe(true);
    expect((error as LicenceFileInvalidError).reason).toBe("malformed");
  });

  it("refuses a dataset without a licence id", () => {
    expect(() => readLicence({ meta: { issued: "2026-10-01T00:00:00.000Z" }, data: {} })).toThrow();
    expect(() => readLicence("nope")).toThrow();
  });
});
