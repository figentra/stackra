/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureFormat`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";

describe("SignatureFormat", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(SignatureFormat)).toEqual(["xades", "cades", "jws", "raw"]);
  });
});
