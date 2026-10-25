/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalAddress`: a full address type-checks, a missing city does not, and the fields are
 *          read-only.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalAddress } from "#contracts/types/fiscal-address.type";

const address: FiscalAddress = {
  street: "Main Street",
  buildingNumber: null,
  district: null,
  city: "Sample City",
  region: null,
  postalCode: null,
  country: "XX",
  branchId: null,
};

describe("FiscalAddress", () => {
  it("takes an address with only the required parts", () => {
    expect(address.city).toBe("Sample City");
  });

  it("refuses an address without a city and is read-only", () => {
    // @ts-expect-error -- every address has a city
    const cityless: FiscalAddress = { ...address, city: undefined };
    // @ts-expect-error -- addresses are not edited in place
    address.street = "Other";
    expect(cityless.city).toBeUndefined();
  });
});
