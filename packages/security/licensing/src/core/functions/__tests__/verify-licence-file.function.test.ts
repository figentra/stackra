/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyLicenceFile`: a signed plain file and a signed encrypted file are read into a
 *          `Licence`; a tampered file, a file signed by another key, an unknown algorithm, a missing armour, bad base64,
 *          an encrypted file without or with the wrong licence key are refused with `LicenceFileInvalidError` and the
 *          right reason; a verify key that is not 64 hex characters is a RangeError.
 * Boundary: test only; real Ed25519 and AES-GCM through node's Web Crypto, keys made per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178 (enforcement: signatures and expiry are tested).
 */
import { isRefusal } from "@stackra/errors";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import { verifyLicenceFile } from "#core/functions/verify-licence-file.function";

import {
  encodeBase64,
  licenceFile,
  signingKey,
  type SigningKey,
} from "./fixtures/licence-file.fixture";

/** The refusal's reason, or the error itself when it is not a `LicenceFileInvalidError`. */
async function reasonOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  return isRefusal(error, LicenceFileInvalidError) ? error.reason : error;
}

let key: SigningKey;
let other: SigningKey;

beforeAll(async () => {
  key = await signingKey();
  other = await signingKey();
});

/** A made-up licence key; it unlocks nothing. */
const LICENCE_KEY = "ACME-1234-5678"; // gitleaks:allow

describe("verifyLicenceFile", () => {
  it("reads a signed base64 file", async () => {
    const licence = await verifyLicenceFile(await licenceFile(key), { publicKey: key.publicKey });
    expect(licence).toEqual({
      id: "6a2c1f0e-0b7f-4c0a-9d8e-1f2a3b4c5d6e",
      name: "Acme on-prem",
      status: "ACTIVE",
      expiry: new Date("2027-10-01T00:00:00.000Z"),
      issued: new Date("2026-10-01T00:00:00.000Z"),
      fileExpiry: new Date("2026-11-01T00:00:00.000Z"),
      maxMachines: 3,
      maxUsers: 50,
      entitlements: ["SSO", "AUDIT_LOG"],
      metadata: { tier: "enterprise" },
    });
  });

  it("accepts the verify key in upper case", async () => {
    const licence = await verifyLicenceFile(await licenceFile(key), {
      publicKey: key.publicKey.toUpperCase(),
    });
    expect(licence.id).toBe("6a2c1f0e-0b7f-4c0a-9d8e-1f2a3b4c5d6e");
  });

  it("reads a signed encrypted file with its licence key", async () => {
    const file = await licenceFile(key, { licenceKey: LICENCE_KEY });
    const licence = await verifyLicenceFile(file, {
      publicKey: key.publicKey,
      licenceKey: LICENCE_KEY,
    });
    expect(licence.entitlements).toEqual(["SSO", "AUDIT_LOG"]);
  });

  it("refuses a file whose enc changed after signing", async () => {
    const file = await licenceFile(key, { tamper: true });
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe(
      "bad_signature",
    );
  });

  it("refuses a file signed by another key", async () => {
    const file = await licenceFile(other);
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe(
      "bad_signature",
    );
  });

  it("refuses an algorithm it does not know", async () => {
    const file = await licenceFile(key, { alg: "base64+rsa-pss-sha256" });
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe(
      "unsupported_algorithm",
    );
  });

  it("refuses text without the licence file armour", async () => {
    expect(await reasonOf(verifyLicenceFile("not a licence", { publicKey: key.publicKey }))).toBe(
      "malformed",
    );
  });

  it("refuses an armour that is not base64 JSON", async () => {
    const file = "-----BEGIN LICENSE FILE-----\n%%%\n-----END LICENSE FILE-----";
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe("malformed");
  });

  it("refuses a certificate without enc, sig and alg", async () => {
    const body = encodeBase64(new TextEncoder().encode(JSON.stringify({ enc: "x" })));
    const file = `-----BEGIN LICENSE FILE-----\n${body}\n-----END LICENSE FILE-----`;
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe("malformed");
  });

  it("refuses an encrypted file without a licence key", async () => {
    const file = await licenceFile(key, { licenceKey: LICENCE_KEY });
    expect(await reasonOf(verifyLicenceFile(file, { publicKey: key.publicKey }))).toBe(
      "licence_key_required",
    );
  });

  it("refuses an encrypted file with the wrong licence key", async () => {
    const file = await licenceFile(key, { licenceKey: LICENCE_KEY });
    const reason = await reasonOf(
      verifyLicenceFile(file, { publicKey: key.publicKey, licenceKey: "WRONG" }),
    );
    expect(reason).toBe("decryption_failed");
  });

  it("never puts the licence key in the refusal", async () => {
    const file = await licenceFile(key, { licenceKey: LICENCE_KEY });
    const error: unknown = await verifyLicenceFile(file, {
      publicKey: key.publicKey,
      licenceKey: "WRONG-KEY-VALUE",
    }).catch((caught: unknown) => caught);
    expect(JSON.stringify((error as LicenceFileInvalidError).toEnvelope())).not.toContain(
      "WRONG-KEY-VALUE",
    );
  });

  it("throws a RangeError for a verify key that is not 64 hex characters", async () => {
    await expect(verifyLicenceFile(await licenceFile(key), { publicKey: "abc" })).rejects.toThrow(
      RangeError,
    );
  });
});
