/**
 * Stackra file contract:
 * Purpose: unit tests of `PeppolDriver`: the UBL invoice and credit note under the pack's ids, both electronic
 *          addresses, the refusals, the hand-over to the access point, and the export.
 * Boundary: test only; the transport is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { PeppolDriver } from "#core/drivers/peppol.driver";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";

const OPTIONS = {
  accessPointUrl: "https://ap.test/send",
  customizationId: "urn:sample:customization",
  profileId: "urn:sample:profile",
  timeZone: "UTC",
};
const context = {
  unitId: "unit_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const driver = (transport = FiscalTransportFake.answering()) => new PeppolDriver(transport);

describe("PeppolDriver#seal", () => {
  it("writes the invoice under the pack's ids with both electronic addresses", async () => {
    const sealed = await driver().seal(fiscalDocument(), context);
    expect(sealed.payload).toMatch(
      /^<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"/,
    );
    expect(sealed.payload).toContain(
      "<cbc:CustomizationID>urn:sample:customization</cbc:CustomizationID>",
    );
    expect(sealed.payload).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(sealed.payload).toContain(
      '<cbc:EndpointID schemeID="0000">buyer-endpoint</cbc:EndpointID>',
    );
    expect(sealed.payload).toContain('<cbc:ID schemeID="GS1">4006381333931</cbc:ID>');
    expect(sealed.payload).toContain(
      '<cbc:PayableAmount currencyID="EUR">35.00</cbc:PayableAmount>',
    );
    expect(sealed.hash).toBe(toBase64(await sha256(sealed.payload)));
    expect([sealed.signature, sealed.qr, sealed.status]).toEqual([
      null,
      null,
      FiscalRecordStatus.Sealed,
    ]);
  });

  it("writes a credit note with credited quantities and the original", async () => {
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: {
        number: "INV-0000",
        issuedAt: new Date("2026-02-01T00:00:00Z"),
        reason: "returned",
        reference: null,
      },
    });
    const { payload } = await driver().seal(note, context);
    expect(payload).toMatch(/^<CreditNote /);
    expect(payload).toContain("<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>");
    expect(payload).toContain('<cbc:CreditedQuantity unitCode="C62">2</cbc:CreditedQuantity>');
    expect(payload).toContain("<cbc:ID>INV-0000</cbc:ID><cbc:IssueDate>2026-02-01</cbc:IssueDate>");
  });

  it("refuses a document without a buyer or an electronic address", async () => {
    const { seller, buyer } = fiscalDocument();
    for (const [field, document] of [
      ["buyer", fiscalDocument({ buyer: null })],
      ["seller.endpoint", fiscalDocument({ seller: { ...seller, endpoint: null } })],
      ["buyer.endpoint", fiscalDocument({ buyer: { ...(buyer as FiscalParty), endpoint: null } })],
    ] as const)
      await expect(driver().seal(document, context)).rejects.toSatisfy(
        (error: unknown) =>
          isRefusal(error, FiscalDocumentInvalidError) && error.details.field === field,
      );
  });

  it("refuses options that do not fit", async () => {
    await expect(driver().seal(fiscalDocument(), { ...context, options: {} })).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, FiscalOptionsInvalidError),
    );
  });
});

describe("PeppolDriver#submit", () => {
  it("hands the XML to the access point and reads 2xx as submitted", async () => {
    const transport = FiscalTransportFake.answering({ status: 202, headers: {}, body: "" });
    const outcome = await driver(transport).submit(fiscalRecord(), {
      unitId: "unit_1",
      options: OPTIONS,
    });
    const [request] = transport.calls("send") as TransportRequest[];
    expect([request?.url, request?.credential, request?.body]).toEqual([
      OPTIONS.accessPointUrl,
      "unit_1",
      "<Invoice></Invoice>",
    ]);
    expect(outcome.status).toBe(FiscalRecordStatus.Submitted);
  });

  it("reads another answered status as rejected with the body", async () => {
    const transport = FiscalTransportFake.answering({
      status: 422,
      headers: {},
      body: "bad party",
    });
    const outcome = await driver(transport).submit(fiscalRecord(), {
      unitId: "unit_1",
      options: OPTIONS,
    });
    expect([outcome.status, outcome.message]).toEqual([FiscalRecordStatus.Rejected, "bad party"]);
  });
});

describe("PeppolDriver#exportJournal", () => {
  it("exports JSON lines", async () => {
    expect(
      (await driver().exportJournal([], { unitId: "unit_1", options: OPTIONS })).fileName,
    ).toBe("unit_1.peppol.jsonl");
  });
});
