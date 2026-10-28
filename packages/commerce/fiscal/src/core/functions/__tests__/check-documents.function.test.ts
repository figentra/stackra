/**
 * Stackra file contract:
 * Purpose: unit tests of `checkDocuments`: one document per paid part with its own totals, one whole-check document
 *          only once the tenders cover the gross, and the refusal of a part without lines under `per_part`.
 * Boundary: test only; the check is built from the shared document fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { CheckDocumentMode } from "#contracts/enums/check-document-mode.enum";
import type { FiscalCheck } from "#contracts/types/fiscal-check.type";
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { checkDocuments } from "#core/functions/check-documents.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

const eur = (minor: number) => Money.ofMinor(minor, "EUR");
const document = fiscalDocument();
const [widget, book] = document.lines as readonly [FiscalLine, FiscalLine];
const check: FiscalCheck = {
  document,
  parts: [
    {
      id: "part-1",
      number: "R-1",
      paidAt: new Date("2026-03-01T10:00:00Z"),
      lines: [widget],
      payments: [{ method: "card", amount: eur(2400) }],
    },
    {
      id: "part-2",
      number: "R-2",
      paidAt: new Date("2026-03-01T10:05:00Z"),
      lines: [book],
      payments: [{ method: "cash", amount: eur(1100) }],
    },
  ],
};

describe("checkDocuments", () => {
  it("issues one document per paid part with its own lines and totals", () => {
    const [first, second] = checkDocuments(check, CheckDocumentMode.PerPart);
    expect([first?.id, first?.number, first?.lines, first?.issuedAt]).toEqual([
      "part-1",
      "R-1",
      [widget],
      new Date("2026-03-01T10:00:00Z"),
    ]);
    expect([first?.net.minor, first?.tax.minor, first?.gross.minor]).toEqual([2000, 400, 2400]);
    expect([second?.gross.minor, second?.payments[0]?.method]).toEqual([1100, "cash"]);
    expect(first?.seller).toBe(document.seller);
  });

  it("issues the whole check only once its tenders cover the gross", () => {
    const first = check.parts[0];
    expect(
      checkDocuments({ ...check, parts: first ? [first] : [] }, CheckDocumentMode.WholeCheck),
    ).toEqual([]);
    const [whole] = checkDocuments(check, CheckDocumentMode.WholeCheck);
    expect([whole?.id, whole?.gross.minor, whole?.payments.length]).toEqual([document.id, 3500, 2]);
  });

  it("refuses a part without lines when every part is its own document", () => {
    const amountOnly: FiscalCheck = {
      document,
      parts: [{ id: "p", number: "R", paidAt: new Date(0), lines: null, payments: [] }],
    };
    let caught: unknown;
    try {
      checkDocuments(amountOnly, CheckDocumentMode.PerPart);
    } catch (error) {
      caught = error;
    }
    expect(
      isRefusal(caught, FiscalDocumentInvalidError) && caught.details.field === "parts.0.lines",
    ).toBe(true);
  });
});
