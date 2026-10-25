/**
 * Stackra file contract:
 * Purpose: unit tests of `FacturXDriver`: the CII invoice under the pack's guideline, the tax breakdown and totals,
 *          the original of a note, completion without a platform, the hand-over with one, the hybrid PDF, and the
 *          export.
 * Boundary: test only; the transport and PDF binding are fakes and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { HybridPdfRequest } from "#contracts/types/hybrid-pdf-request.type";
import { FacturXDriver } from "#core/drivers/factur-x.driver";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { HybridPdfFake } from "#testing/hybrid-pdf.fake";

const OPTIONS = {
  guidelineId: "urn:sample:guideline",
  fileName: "invoice.xml",
  conformanceLevel: "LEVEL",
  version: "1.0",
  documentType: "INVOICE",
  submitUrl: null,
  timeZone: "UTC",
};
const context = {
  unitId: "unit_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};

describe("FacturXDriver#seal", () => {
  it("writes the CII invoice under the pack's guideline", async () => {
    const sealed = await new FacturXDriver(
      FiscalTransportFake.answering(),
      new HybridPdfFake(),
    ).seal(fiscalDocument(), context);
    expect(sealed.payload).toContain("<ram:ID>urn:sample:guideline</ram:ID>");
    expect(sealed.payload).toContain(
      '<udt:DateTimeString format="102">20260301</udt:DateTimeString>',
    );
    expect(sealed.payload).toContain(
      '<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">TAX-BUYER-1</ram:ID>',
    );
    expect(sealed.payload).toContain(
      "<ram:CalculatedAmount>4.00</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>20.00</ram:BasisAmount>",
    );
    expect(sealed.payload).toContain(
      '<ram:TaxTotalAmount currencyID="EUR">5.00</ram:TaxTotalAmount>',
    );
    expect(sealed.status).toBe(FiscalRecordStatus.Accepted);
  });

  it("names the original of a credit note", async () => {
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: {
        number: "INV-0000",
        issuedAt: new Date("2026-02-01T00:00:00Z"),
        reason: "returned",
        reference: null,
      },
    });
    const { payload } = await new FacturXDriver(
      FiscalTransportFake.answering(),
      new HybridPdfFake(),
    ).seal(note, context);
    expect(payload).toContain("<ram:TypeCode>381</ram:TypeCode>");
    expect(payload).toContain(
      "<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>INV-0000</ram:IssuerAssignedID>",
    );
  });

  it("waits for submission when the pack names a platform", async () => {
    const withPlatform = {
      ...context,
      options: { ...OPTIONS, submitUrl: "https://platform.test" },
    };
    const sealed = await new FacturXDriver(
      FiscalTransportFake.answering(),
      new HybridPdfFake(),
    ).seal(fiscalDocument(), withPlatform);
    expect(sealed.status).toBe(FiscalRecordStatus.Sealed);
  });

  it("refuses a document without a buyer", async () => {
    const driver = new FacturXDriver(FiscalTransportFake.answering(), new HybridPdfFake());
    await expect(driver.seal(fiscalDocument({ buyer: null }), context)).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, FiscalDocumentInvalidError),
    );
  });
});

describe("FacturXDriver#submit", () => {
  it("accepts without a call when there is no platform", async () => {
    const transport = FiscalTransportFake.answering();
    const outcome = await new FacturXDriver(transport, new HybridPdfFake()).submit(
      fiscalRecord(),
      context,
    );
    expect(outcome.status).toBe(FiscalRecordStatus.Accepted);
    expect(transport.calls("send")).toEqual([]);
  });

  it("hands the XML to the platform", async () => {
    const transport = FiscalTransportFake.answering({ status: 201, headers: {}, body: "" });
    const options = { ...OPTIONS, submitUrl: "https://platform.test" };
    const outcome = await new FacturXDriver(transport, new HybridPdfFake()).submit(fiscalRecord(), {
      unitId: "unit_1",
      options,
    });
    expect(outcome.status).toBe(FiscalRecordStatus.Submitted);
  });
});

describe("FacturXDriver#hybrid", () => {
  it("embeds the record's XML under the pack's name and XMP facts", async () => {
    const pdfs = new HybridPdfFake();
    const hybrid = await new FacturXDriver(FiscalTransportFake.answering(), pdfs).hybrid(
      fiscalRecord(),
      new Uint8Array([37]),
      context,
    );
    const [request] = pdfs.calls("attach") as HybridPdfRequest[];
    expect([
      request?.fileName,
      request?.conformanceLevel,
      request?.version,
      request?.documentType,
    ]).toEqual(["invoice.xml", "LEVEL", "1.0", "INVOICE"]);
    expect(new TextDecoder().decode(hybrid)).toBe("%<Invoice></Invoice>");
  });
});

describe("FacturXDriver#exportJournal", () => {
  it("exports JSON lines", async () => {
    const driver = new FacturXDriver(FiscalTransportFake.answering(), new HybridPdfFake());
    expect((await driver.exportJournal([], context)).fileName).toBe("unit_1.factur-x.jsonl");
  });
});
