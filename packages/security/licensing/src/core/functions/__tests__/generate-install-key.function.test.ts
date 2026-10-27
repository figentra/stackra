/**
 * Stackra file contract:
 * Purpose: unit tests of `generateInstallKey`: a P-256 private JWK and an ES256 public key under the key id; an empty
 *          id is refused.
 * Boundary: test only; keys are generated per run and never written anywhere.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0178 (decision 5); ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { generateInstallKey } from "#core/functions/generate-install-key.function";

describe("generateInstallKey", () => {
  it("makes a private JWK and the public key to register", async () => {
    const key = await generateInstallKey("acme-onprem-1");
    expect(JSON.parse(key.privateKey)).toMatchObject({ kty: "EC", crv: "P-256" });
    expect(key.publicKey.keyId).toBe("acme-onprem-1");
    expect(key.publicKey.algorithm).toBe("ES256");
    expect(key.publicKey.spki).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("refuses an empty key id", async () => {
    await expect(generateInstallKey("")).rejects.toBeInstanceOf(RangeError);
  });
});
