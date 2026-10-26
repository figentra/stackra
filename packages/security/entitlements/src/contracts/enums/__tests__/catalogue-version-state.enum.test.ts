/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueVersionState`: the three states and their snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";

describe("CatalogueVersionState", () => {
  it("has pending, approved and rejected", () => {
    expect(Enum.values(CatalogueVersionState)).toEqual(["pending", "approved", "rejected"]);
  });
});
