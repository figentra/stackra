/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalCheck`: the whole-check document and its paid parts.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalCheck } from "#contracts/types/fiscal-check.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("FiscalCheck", () => {
  it("takes a document and parts and refuses a check without a document", () => {
    const check: FiscalCheck = { document: fiscalDocument(), parts: [] };
    // @ts-expect-error -- the whole-check document is required
    const bare: FiscalCheck = { parts: [] };
    expect([check.parts.length, bare.parts.length]).toEqual([0, 0]);
  });
});
