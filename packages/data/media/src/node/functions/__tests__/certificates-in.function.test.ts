/**
 * Stackra file contract:
 * Purpose: unit tests of `certificatesIn`: every certificate of a PEM chain in order, comment lines ignored, a block
 *          that does not parse dropped rather than thrown, and nothing from text with no certificate.
 * Boundary: test only; certificates made in memory by `c2paTestCertificate()`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-2791 (fail closed on an unreadable trust list).
 */
import { describe, expect, it } from "@stackra/testing";

import { c2paTestCertificate } from "#node/drivers/__tests__/c2pa-test-certificate.fixture";
import { certificatesIn } from "#node/functions/certificates-in.function";

describe("certificatesIn", () => {
  it("reads every certificate of a chain, in order", () => {
    const { certificate } = c2paTestCertificate();
    const [signer, authority, ...rest] = certificatesIn(`Subject\tCN=comment\n${certificate}`);
    expect(signer?.subject).toContain("Stackra C2PA test signer");
    expect(signer?.ca).toBe(false);
    expect(authority?.subject).toContain("Stackra C2PA test CA");
    expect(authority?.ca).toBe(true);
    expect(rest).toEqual([]);
  });

  it("drops a block that is not a certificate, and finds none in other text", () => {
    const { certificate } = c2paTestCertificate();
    const broken =
      "-----BEGIN CERTIFICATE-----\nbm90IGEgY2VydGlmaWNhdGU=\n-----END CERTIFICATE-----\n";
    expect(certificatesIn(broken + certificate)).toHaveLength(2);
    expect(certificatesIn(broken)).toEqual([]);
    expect(certificatesIn("")).toEqual([]);
    expect(certificatesIn("not a pem")).toEqual([]);
  });
});
