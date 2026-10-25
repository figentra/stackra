/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalDocument`: the fixture type-checks with totals that add up, and a note names its
 *          original.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("FiscalDocument", () => {
  it("takes a document whose totals add up", () => {
    const document: FiscalDocument = fiscalDocument();
    expect(document.net.plus(document.tax).equals(document.gross)).toBe(true);
  });

  it("takes a note with its original and refuses a note without a reason", () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    const note: FiscalDocument = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: { number: "INV-0001", issuedAt, reason: "returned", reference: null },
    });
    const original = { number: "INV-0001", issuedAt, reference: null };
    // @ts-expect-error -- a correction says why
    const bare: FiscalDocument = fiscalDocument({ original });
    expect([note.original?.reason, bare.original?.number]).toEqual(["returned", "INV-0001"]);
  });
});
