/**
 * Stackra file contract:
 * Purpose: unit tests of `SIGNATURE_SCHEMA` (`Signature$`) and `SIGNER_PUBLIC_KEY_SCHEMA` (`SignerPublicKey$`): an
 *          `ES256` signature of 86 base64url characters and a key parse, and another algorithm is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { SIGNATURE_SCHEMA } from "#core/constants/signature-schema.constant";
import { SIGNER_PUBLIC_KEY_SCHEMA } from "#core/constants/signer-public-key-schema.constant";

describe("Signature$ and SignerPublicKey$", () => {
  it("parses an ES256 signature and key", () => {
    const signature = { keyId: "k1", algorithm: "ES256", value: "A".repeat(86) };
    expect(SIGNATURE_SCHEMA.parse(signature)).toEqual(signature);
    const key = { keyId: "k1", algorithm: "ES256", spki: "MFkwEwYHKoZIzj0CAQ" };
    expect(SIGNER_PUBLIC_KEY_SCHEMA.parse(key)).toEqual(key);
  });

  it("refuses another algorithm or a short value", () => {
    expect(
      SIGNATURE_SCHEMA.safeParse({ keyId: "k1", algorithm: "RS256", value: "A".repeat(86) })
        .success,
    ).toBe(false);
    expect(
      SIGNATURE_SCHEMA.safeParse({ keyId: "k1", algorithm: "ES256", value: "AAAA" }).success,
    ).toBe(false);
  });
});
