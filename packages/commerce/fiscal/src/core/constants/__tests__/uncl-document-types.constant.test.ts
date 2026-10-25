/**
 * Stackra file contract:
 * Purpose: unit tests of `UNCL_DOCUMENT_TYPES`: one UNCL 1001 code per document kind.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { UNCL_DOCUMENT_TYPES } from "#core/constants/uncl-document-types.constant";

describe("UNCL_DOCUMENT_TYPES", () => {
  it("maps every document kind", () => {
    expect(UNCL_DOCUMENT_TYPES).toEqual({
      invoice: "380",
      simplified: "380",
      credit_note: "381",
      debit_note: "383",
    });
  });
});
