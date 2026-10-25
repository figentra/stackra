/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDocumentKind`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";

describe("FiscalDocumentKind", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(FiscalDocumentKind)).toEqual([
      "invoice",
      "simplified",
      "credit_note",
      "debit_note",
    ]);
  });
});
