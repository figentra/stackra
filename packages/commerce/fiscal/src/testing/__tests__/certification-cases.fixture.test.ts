/**
 * Stackra file contract:
 * Purpose: unit tests of `certificationCases`: every recorded authority case passes the harness offline, ids are
 *          unique, and the TLV encoder reproduces ZATCA's published QR example byte for byte.
 * Boundary: test only; recorded answers, no sandbox (certification pending, owner decision D3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeTlv } from "#core/functions/encode-tlv.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { certificationCases } from "#testing/certification-cases.fixture";
import { runCertification } from "#testing/run-certification.function";

describe("certificationCases", () => {
  it.each(certificationCases().map((certification) => [certification.id, certification] as const))(
    "%s matches its specification offline",
    async (_id, certification) => {
      const result = await runCertification(certification);
      expect(result.mismatches).toEqual([]);
      if (certification.expect.outcome)
        expect(result.outcome?.status).toBe(certification.expect.outcome);
    },
  );

  it("names each case once and covers every authority", () => {
    const ids = certificationCases().map((certification) => certification.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids.map((id) => id.split(".")[0]))).toEqual(
      new Set(["zatca", "verifactu", "tse", "rksv", "eta-receipt"]),
    );
  });

  it("encodes ZATCA's published QR example", () => {
    const qr = toBase64(
      encodeTlv([
        [1, "Bobs Records"],
        [2, "310122393500003"],
        [3, "2022-04-25T15:30:00Z"],
        [4, "1000.00"],
        [5, "150.00"],
      ]),
    );
    expect(qr).toBe(
      "AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMUMjAyMi0wNC0yNVQxNTozMDowMFoEBzEwMDAuMDAFBjE1MC4wMA==",
    );
  });
});
