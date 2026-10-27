/**
 * Stackra file contract:
 * Purpose: unit tests of `ZatcaDriver`: the UBL invoice, the counter and previous-hash chain, the hash over the
 *          unsigned XML, the XAdES request, the TLV QR placed in the signed XML, the refusals, reporting and clearance,
 *          and the export.
 * Boundary: test only; the signer and transport are fakes, and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { ZatcaDriver } from "#core/drivers/zatca.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { fromBase64 } from "#core/functions/from-base64.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";

const OPTIONS = {
  reportingUrl: "https://authority.test/reporting",
  clearanceUrl: "https://authority.test/clearance",
  complianceCsidUrl: "https://authority.test/compliance",
  complianceInvoicesUrl: "https://authority.test/compliance/invoices",
  productionCsidUrl: "https://authority.test/production",
  apiVersion: "V2",
  profileId: "reporting:1.0",
  taxCurrency: "EUR",
  paymentMeans: { cash: "10" },
  timeZone: "UTC",
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const receipt = fiscalDocument({ kind: FiscalDocumentKind.Simplified, buyer: null });

/** The fields of a TLV byte string, values as text. */
const tlv = (base64: string): Record<number, string> => {
  const bytes = fromBase64(base64);
  const fields: Record<number, string> = {};
  for (let at = 0; at < bytes.length; at += 2 + (bytes[at + 1] ?? 0))
    fields[bytes[at] ?? 0] = new TextDecoder().decode(
      bytes.subarray(at + 2, at + 2 + (bytes[at + 1] ?? 0)),
    );
  return fields;
};

describe("ZatcaDriver#seal", () => {
  it("hashes the unsigned UBL invoice and asks for an XAdES signature", async () => {
    const signer = new FiscalSignerFake();
    const sealed = await new ZatcaDriver(signer, FiscalTransportFake.answering()).seal(
      receipt,
      context,
    );
    const [request] = signer.calls("sign") as SignatureRequest[];
    expect(request?.format).toBe(SignatureFormat.Xades);
    expect(request?.signedAt).toEqual(context.now);
    expect(request?.unitId).toBe("till_1");
    expect(sealed.hash).toBe(toBase64(await sha256(request?.payload ?? "")));
    expect(request?.digest).toBe(sealed.hash);
    expect(request?.payload).toContain(
      '<cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>',
    );
    expect(request?.payload).toContain(
      "<cbc:IssueDate>2026-03-01</cbc:IssueDate><cbc:IssueTime>09:30:00</cbc:IssueTime>",
    );
    expect(request?.payload).toContain("<cbc:ID>ICV</cbc:ID><cbc:UUID>1</cbc:UUID>");
    expect(request?.payload).not.toContain("<cbc:ID>QR</cbc:ID>");
  });

  it("chains the first invoice to the mandate's seed and later ones to the previous hash", async () => {
    const signer = new FiscalSignerFake();
    const driver = new ZatcaDriver(signer, FiscalTransportFake.answering());
    await driver.seal(receipt, context);
    await driver.seal(receipt, {
      ...context,
      previous: fiscalRecord({ hash: "previous-hash" }),
      sequence: 2,
    });
    const [first, second] = signer.calls("sign") as SignatureRequest[];
    expect(first?.payload).toContain(
      "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==",
    );
    expect(second?.payload).toContain(">previous-hash</cbc:EmbeddedDocumentBinaryObject>");
    expect(second?.payload).toContain("<cbc:UUID>2</cbc:UUID>");
  });

  it("stamps the QR into the signed XML and returns a sealed record", async () => {
    const sealed = await new ZatcaDriver(
      new FiscalSignerFake(),
      FiscalTransportFake.answering(),
    ).seal(receipt, context);
    const fields = tlv(sealed.qr ?? "");
    expect([fields[1], fields[2], fields[3], fields[4], fields[5], fields[6]]).toEqual([
      "Sample Seller",
      "TAX-SELLER-1",
      "2026-03-01T09:30:00",
      "35.00",
      "5.00",
      sealed.hash,
    ]);
    expect(fields[7]).toBe(sealed.signature);
    expect([fields[8], fields[9]]).toEqual(["public-key", "certificate-signature"]);
    expect(sealed.payload).toContain(
      `<cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${sealed.qr}`,
    );
    expect(sealed.payload.indexOf("<cbc:ID>QR</cbc:ID>")).toBeLessThan(
      sealed.payload.indexOf("<cac:AccountingSupplierParty>"),
    );
    expect([sealed.status, sealed.marks]).toEqual([
      FiscalRecordStatus.Sealed,
      { simplified: "true", counter: "1" },
    ]);
  });

  it("marks a business invoice as standard and leaves tag 9 out", async () => {
    const sealed = await new ZatcaDriver(
      new FiscalSignerFake(),
      FiscalTransportFake.answering(),
    ).seal(fiscalDocument(), context);
    expect(sealed.marks.simplified).toBe("false");
    expect(sealed.payload).toContain('name="0100000"');
    expect(tlv(sealed.qr ?? "")[9]).toBeUndefined();
  });

  it.each([
    ["seller.taxId", fiscalDocument({ seller: { ...fiscalDocument().seller, taxId: null } })],
    ["buyer", fiscalDocument({ buyer: null })],
    [
      "payments.0.method",
      fiscalDocument({ payments: [{ method: "voucher", amount: fiscalDocument().gross }] }),
    ],
  ])("refuses a document missing %s", async (field, document) => {
    const driver = new ZatcaDriver(new FiscalSignerFake(), FiscalTransportFake.answering());
    await expect(driver.seal(document, context)).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDocumentInvalidError) && error.details.field === field,
    );
  });

  it("refuses a document outside the tax currency", async () => {
    const driver = new ZatcaDriver(new FiscalSignerFake(), FiscalTransportFake.answering());
    await expect(
      driver.seal(receipt, { ...context, options: { ...OPTIONS, taxCurrency: "USD" } }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDocumentInvalidError) && error.details.field === "currency",
    );
  });
});

describe("ZatcaDriver#submit", () => {
  const ok = { status: 200, headers: {}, body: "{}" };

  it("reports a simplified invoice and clears a standard one", async () => {
    const transport = FiscalTransportFake.answering(ok, ok);
    const driver = new ZatcaDriver(new FiscalSignerFake(), transport);
    await driver.submit(fiscalRecord({ marks: { simplified: "true" } }), {
      unitId: "till_1",
      options: OPTIONS,
    });
    await driver.submit(fiscalRecord({ marks: { simplified: "false" } }), {
      unitId: "till_1",
      options: OPTIONS,
    });
    const [report, clear] = transport.calls("send") as TransportRequest[];
    expect([report?.url, clear?.url]).toEqual([OPTIONS.reportingUrl, OPTIONS.clearanceUrl]);
    expect(clear?.headers["Clearance-Status"]).toBe("1");
  });

  it("throws when the authority does not take it", async () => {
    const driver = new ZatcaDriver(
      new FiscalSignerFake(),
      FiscalTransportFake.answering({ status: 503, headers: {}, body: "" }),
    );
    await expect(
      driver.submit(fiscalRecord(), { unitId: "till_1", options: OPTIONS }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalAuthorityUnavailableError));
  });
});

describe("ZatcaDriver#exportJournal", () => {
  it("exports the chain as JSON lines", async () => {
    const driver = new ZatcaDriver(new FiscalSignerFake(), FiscalTransportFake.answering());
    const file = await driver.exportJournal([fiscalRecord()], {
      unitId: "till_1",
      options: OPTIONS,
    });
    expect(file.fileName).toBe("till_1.zatca.jsonl");
    expect(JSON.parse(file.content).hash).toBe("hash-1");
  });
});
