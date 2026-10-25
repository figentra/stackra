/**
 * Stackra file contract:
 * Purpose: unit tests of `UBL_NAMESPACES`: the five UBL 2.1 namespaces, each an OASIS URN.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { UBL_NAMESPACES } from "#core/constants/ubl-namespaces.constant";

describe("UBL_NAMESPACES", () => {
  it("names the UBL 2.1 roots and components", () => {
    expect(Object.keys(UBL_NAMESPACES)).toEqual([
      "invoice",
      "creditNote",
      "aggregate",
      "basic",
      "extension",
    ]);
    for (const uri of Object.values(UBL_NAMESPACES))
      expect(uri).toMatch(/^urn:oasis:names:specification:ubl:schema:xsd:/);
  });
});
