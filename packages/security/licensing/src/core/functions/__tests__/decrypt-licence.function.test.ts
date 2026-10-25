/**
 * Stackra file contract:
 * Purpose: unit tests of `decryptLicence`: opens a Keygen-sealed dataset with its licence key, and refuses with the
 *          right reason without a key, with a bad shape, bad base64 or the wrong key.
 * Boundary: test only; real AES-GCM through node's Web Crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import { decryptLicence } from "#core/functions/decrypt-licence.function";

import { sealDataset } from "./fixtures/licence-file.fixture";

/** The refusal's reason, or the error itself. */
async function reasonOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  return isRefusal(error, LicenceFileInvalidError) ? error.reason : error;
}

describe("decryptLicence", () => {
  it("opens a sealed dataset with its licence key", async () => {
    const enc = await sealDataset(new TextEncoder().encode('{"ok":true}'), "KEY-1");
    expect(new TextDecoder().decode(await decryptLicence(enc, "KEY-1"))).toBe('{"ok":true}');
  });

  it("refuses without a licence key", async () => {
    const enc = await sealDataset(new TextEncoder().encode("{}"), "KEY-1");
    expect(await reasonOf(decryptLicence(enc, undefined))).toBe("licence_key_required");
    expect(await reasonOf(decryptLicence(enc, ""))).toBe("licence_key_required");
  });

  it("refuses an enc that is not three parts", async () => {
    expect(await reasonOf(decryptLicence("abc.def", "KEY-1"))).toBe("malformed");
  });

  it("refuses parts that are not base64", async () => {
    expect(await reasonOf(decryptLicence("%%.%%.%%", "KEY-1"))).toBe("malformed");
  });

  it("refuses the wrong licence key", async () => {
    const enc = await sealDataset(new TextEncoder().encode("{}"), "KEY-1");
    expect(await reasonOf(decryptLicence(enc, "KEY-2"))).toBe("decryption_failed");
  });
});
