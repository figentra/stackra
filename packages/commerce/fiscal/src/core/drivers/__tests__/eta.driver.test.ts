/**
 * Stackra file contract:
 * Purpose: unit tests of `EtaDriver`: the document JSON with item codes and mapped tax types, the CAdES request over
 *          the canonical form, the refusals, the submission answer, and the export.
 * Boundary: test only; the signer and transport are fakes and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { EtaDriver } from "#core/drivers/eta.driver";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { canonicalEta } from "#core/functions/canonical-eta.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";

const OPTIONS = {
  submitUrl: "https://authority.test/submissions",
  documentTypeVersion: "1.0",
  activityCode: "0000",
  reportingCurrency: "EUR",
  taxTypes: { S: { taxType: "T1", subType: "V1" } },
};
const context = {
  unitId: "issuer_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};

describe("EtaDriver#seal", () => {
  it("builds the document and seals its canonical form", async () => {
    const signer = new FiscalSignerFake();
    const sealed = await new EtaDriver(signer, FiscalTransportFake.answering()).seal(
      fiscalDocument(),
      context,
    );
    const json = JSON.parse(sealed.payload);
    const { signatures, ...body } = json;
    const [request] = signer.calls("sign") as SignatureRequest[];
    expect(request?.format).toBe(SignatureFormat.Cades);
    expect(request?.payload).toBe(canonicalEta(body));
    expect(sealed.hash).toBe(toBase64(await sha256(canonicalEta(body))));
    expect(signatures).toEqual([{ signatureType: "I", value: sealed.signature }]);
    expect([json.documentType, json.internalID, json.dateTimeIssued]).toEqual([
      "I",
      "INV-0001",
      "2026-03-01T09:30:00Z",
    ]);
    expect(json.invoiceLines[0]).toMatchObject({
      itemType: "GS1",
      itemCode: "4006381333931",
      salesTotal: 20,
      total: 24,
    });
    expect(json.taxTotals).toEqual([{ taxType: "T1", amount: 5 }]);
    expect(json.issuer).toMatchObject({ type: "B", id: "TAX-SELLER-1" });
  });

  it("references the original of a credit note", async () => {
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: {
        number: "INV-0000",
        issuedAt: new Date(0),
        reason: "returned",
        reference: "AUTH-UUID",
      },
    });
    const json = JSON.parse(
      (
        await new EtaDriver(new FiscalSignerFake(), FiscalTransportFake.answering()).seal(
          note,
          context,
        )
      ).payload,
    );
    expect([json.documentType, json.references]).toEqual(["C", ["AUTH-UUID"]]);
  });

  it("refuses a line without an item code", async () => {
    const [line, other] = fiscalDocument().lines as readonly [FiscalLine, FiscalLine];
    const document = fiscalDocument({ lines: [line, { ...other, itemCode: null }] });
    await expect(
      new EtaDriver(new FiscalSignerFake(), FiscalTransportFake.answering()).seal(
        document,
        context,
      ),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDocumentInvalidError) && error.details.field === "lines.1.itemCode",
    );
  });

  it("refuses a category the pack does not map", async () => {
    const options = { ...OPTIONS, taxTypes: {} };
    await expect(
      new EtaDriver(new FiscalSignerFake(), FiscalTransportFake.answering()).seal(
        fiscalDocument(),
        { ...context, options },
      ),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
  });

  it("refuses a document outside the reporting currency or without a buyer", async () => {
    const driver = new EtaDriver(new FiscalSignerFake(), FiscalTransportFake.answering());
    await expect(
      driver.seal(fiscalDocument(), {
        ...context,
        options: { ...OPTIONS, reportingCurrency: "USD" },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDocumentInvalidError) && error.details.field === "currency",
    );
    await expect(driver.seal(fiscalDocument({ buyer: null }), context)).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDocumentInvalidError) && error.details.field === "buyer",
    );
  });
});

describe("EtaDriver#submit", () => {
  const record = fiscalRecord({ payload: '{"internalID":"INV-0001"}' });

  it("wraps the document in a batch and reads an accepted UUID", async () => {
    const body = JSON.stringify({
      submissionId: "S1",
      acceptedDocuments: [{ uuid: "U1", internalId: "INV-0001" }],
    });
    const transport = FiscalTransportFake.answering({ status: 202, headers: {}, body });
    const outcome = await new EtaDriver(new FiscalSignerFake(), transport).submit(record, context);
    const [request] = transport.calls("send") as TransportRequest[];
    expect(request?.body).toBe('{"documents":[{"internalID":"INV-0001"}]}');
    expect([outcome.status, outcome.authorityReference]).toEqual([
      FiscalRecordStatus.Submitted,
      "U1",
    ]);
  });

  it("reads a rejected document with its message", async () => {
    const body = JSON.stringify({
      submissionId: "S1",
      rejectedDocuments: [{ internalId: "INV-0001", error: { message: "bad code" } }],
    });
    const outcome = await new EtaDriver(
      new FiscalSignerFake(),
      FiscalTransportFake.answering({ status: 202, headers: {}, body }),
    ).submit(record, context);
    expect([outcome.status, outcome.message, outcome.authorityReference]).toEqual([
      FiscalRecordStatus.Rejected,
      "bad code",
      "S1",
    ]);
  });
});

describe("EtaDriver#exportJournal", () => {
  it("exports JSON lines", async () => {
    const driver = new EtaDriver(new FiscalSignerFake(), FiscalTransportFake.answering());
    expect((await driver.exportJournal([], context)).fileName).toBe("issuer_1.eta.jsonl");
  });
});
