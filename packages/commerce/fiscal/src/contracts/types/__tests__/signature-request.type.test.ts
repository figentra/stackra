/**
 * Stackra file contract:
 * Purpose: type tests of `SignatureRequest`: a format code, a payload and its digest.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import type { SignatureRequest } from "#contracts/types/signature-request.type";

describe("SignatureRequest", () => {
  it("takes a raw request and refuses an unknown format", () => {
    const request: SignatureRequest = {
      unitId: "till_1",
      format: SignatureFormat.Raw,
      payload: "p",
      digest: "d",
    };
    // @ts-expect-error -- the format is one of the enum's codes
    const pgp: SignatureRequest = { ...request, format: "pgp" };
    expect([request.format, pgp.format]).toEqual(["raw", "pgp"]);
  });
});
