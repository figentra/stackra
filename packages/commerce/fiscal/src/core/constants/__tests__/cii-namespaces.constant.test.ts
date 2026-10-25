/**
 * Stackra file contract:
 * Purpose: unit tests of `CII_NAMESPACES`: the three CII namespaces, each a UN/CEFACT URN.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { CII_NAMESPACES } from "#core/constants/cii-namespaces.constant";

describe("CII_NAMESPACES", () => {
  it("names the CII prefixes", () => {
    expect(Object.keys(CII_NAMESPACES)).toEqual(["rsm", "ram", "udt"]);
    for (const uri of Object.values(CII_NAMESPACES))
      expect(uri).toMatch(/^urn:un:unece:uncefact:data:standard:.+:100$/);
  });
});
