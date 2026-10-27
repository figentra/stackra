/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckDocumentMode`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CheckDocumentMode } from "#contracts/enums/check-document-mode.enum";

describe("CheckDocumentMode", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(CheckDocumentMode)).toEqual(["per_part", "whole_check"]);
  });
});
