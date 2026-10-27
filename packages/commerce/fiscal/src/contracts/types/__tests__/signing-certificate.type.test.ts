/**
 * Stackra file contract:
 * Purpose: type tests of `SigningCertificate`: public facts only, the certificate signature nullable.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { SigningCertificate } from "#contracts/types/signing-certificate.type";

describe("SigningCertificate", () => {
  it("takes the public facts and refuses a private key", () => {
    const certificate: SigningCertificate = {
      certificate: "MII",
      issuerName: "CN=Issuer",
      serialNumber: "1",
      publicKey: "MFY",
      certificateSignature: null,
    };
    // @ts-expect-error -- no private key travels in the facts
    const leaked: SigningCertificate = { ...certificate, privateKey: "x" };
    expect([certificate.serialNumber, leaked.issuerName]).toEqual(["1", "CN=Issuer"]);
  });
});
