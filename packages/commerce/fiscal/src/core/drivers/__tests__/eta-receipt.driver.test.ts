/**
 * Stackra file contract:
 * Purpose: unit tests of `EtaReceiptDriver`: the receipt JSON, its UUID over the canonical form with an empty UUID,
 *          the chain to the previous receipt, the share QR, the return receipt, the refusals, the submission answer,
 *          validity polling and the export.
 * Boundary: test only; the transport and credential store are fakes and the options are samples (ADR 0363 decision
 *           9), not the authority's values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { EtaReceiptDriver } from "#core/drivers/eta-receipt.driver";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { canonicalEta } from "#core/functions/canonical-eta.function";
import { sha256 } from "#core/functions/sha256.function";
import { toHex } from "#core/functions/to-hex.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const OPTIONS = {
  submitUrl: "https://authority.test/receipts",
  statusUrl: "https://authority.test/receipts/{uuid}/details",
  shareUrl: "https://portal.test/receipts/search",
  typeVersion: "1.0",
  activityCode: "0000",
  reportingCurrency: "EUR",
  taxTypes: { S: { taxType: "T1", subType: "V1" } },
  paymentMethods: { cash: "C" },
};
const context = {
  unitId: "pos_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const credentials = () =>
  TillCredentialsFake.with([
    {
      unitId: "pos_1",
      stage: "production",
      requestId: null,
      token: "client",
      secret: "secret",
      certificate: null,
      certificateSerial: null,
      attributes: { device_serial: "SERIAL-1" },
    },
  ]);
/** Whether a refusal names the missing field. */
const field = (name: string) => (error: unknown) =>
  isRefusal(error, FiscalDocumentInvalidError) && error.details.field === name;
const receipt = fiscalDocument({ kind: FiscalDocumentKind.Simplified, buyer: null });

describe("EtaReceiptDriver#seal", () => {
  it("builds the receipt and derives its UUID over the canonical form with an empty UUID", async () => {
    const sealed = await new EtaReceiptDriver(FiscalTransportFake.answering(), credentials()).seal(
      receipt,
      context,
    );
    const json = JSON.parse(sealed.payload);
    const blank = { ...json, header: { ...json.header, uuid: "" } };
    expect(sealed.hash).toBe(toHex(await sha256(canonicalEta(blank))));
    expect(json.header).toMatchObject({
      receiptNumber: "INV-0001",
      uuid: sealed.hash,
      previousUUID: "",
      dateTimeIssued: "2026-03-01T09:30:00Z",
    });
    expect(json.documentType.receiptType).toBe("S");
    expect(json.seller).toMatchObject({ rin: "TAX-SELLER-1", deviceSerialNumber: "SERIAL-1" });
    expect(json.buyer).toEqual({ type: "P" });
    expect([json.paymentMethod, json.totalAmount, json.itemData[0].itemCode]).toEqual([
      "C",
      35,
      "4006381333931",
    ]);
    expect(sealed.qr).toBe(
      `https://portal.test/receipts/search/${sealed.hash}/share/2026-03-01T09:30:00Z#Total:35,IssuerRIN:TAX-SELLER-1`,
    );
    expect([sealed.signature, sealed.status]).toEqual([null, FiscalRecordStatus.Sealed]);
  });

  it("chains to the previous receipt of this driver only", async () => {
    const driver = new EtaReceiptDriver(FiscalTransportFake.answering(), credentials());
    const previous = fiscalRecord({ driver: "eta-receipt", hash: "PREV-UUID" });
    const chained = JSON.parse(
      (await driver.seal(receipt, { ...context, previous, sequence: 2 })).payload,
    );
    expect(chained.header.previousUUID).toBe("PREV-UUID");
    const other = fiscalRecord({ driver: "memory", hash: "OTHER" });
    const fresh = JSON.parse(
      (await driver.seal(receipt, { ...context, previous: other, sequence: 2 })).payload,
    );
    expect(fresh.header.previousUUID).toBe("");
  });

  it("issues a return receipt against the original UUID", async () => {
    const back = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: {
        number: "INV-0000",
        issuedAt: new Date(0),
        reason: "returned",
        reference: "ORIG",
      },
    });
    const json = JSON.parse(
      (
        await new EtaReceiptDriver(FiscalTransportFake.answering(), credentials()).seal(
          back,
          context,
        )
      ).payload,
    );
    expect([json.documentType.receiptType, json.header.referenceUUID]).toEqual(["R", "ORIG"]);
  });

  it("refuses a debit note, a return without its original, an unmapped tender and a POS without a serial", async () => {
    const driver = new EtaReceiptDriver(FiscalTransportFake.answering(), credentials());
    await expect(
      driver.seal(fiscalDocument({ kind: FiscalDocumentKind.DebitNote }), context),
    ).rejects.toSatisfy(field("kind"));
    await expect(
      driver.seal(fiscalDocument({ kind: FiscalDocumentKind.CreditNote }), context),
    ).rejects.toSatisfy(field("original.reference"));
    await expect(
      driver.seal(receipt, { ...context, options: { ...OPTIONS, paymentMethods: {} } }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
    await expect(
      new EtaReceiptDriver(FiscalTransportFake.answering(), new TillCredentialsFake()).seal(
        receipt,
        context,
      ),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
  });
});

describe("EtaReceiptDriver#submit and #poll", () => {
  const record = fiscalRecord({ driver: "eta-receipt", hash: "U1", payload: '{"header":{}}' });

  it("submits a batch of one and reads the accepted UUID", async () => {
    const transport = FiscalTransportFake.answering({
      status: 202,
      headers: {},
      body: JSON.stringify({ submissionId: "S1", acceptedDocuments: [{ uuid: "U1" }] }),
    });
    const outcome = await new EtaReceiptDriver(transport, credentials()).submit(record, context);
    const [request] = transport.calls("send") as TransportRequest[];
    expect(request?.body).toBe('{"receipts":[{"header":{}}]}');
    expect([outcome.status, outcome.authorityReference]).toEqual([
      FiscalRecordStatus.Submitted,
      "U1",
    ]);
  });

  it("reads a rejection with its message", async () => {
    const transport = FiscalTransportFake.answering({
      status: 202,
      headers: {},
      body: JSON.stringify({
        submissionId: "S1",
        rejectedDocuments: [{ uuid: "U1", error: { message: "bad serial" } }],
      }),
    });
    const outcome = await new EtaReceiptDriver(transport, credentials()).submit(record, context);
    expect([outcome.status, outcome.message]).toEqual([FiscalRecordStatus.Rejected, "bad serial"]);
  });

  it("polls the status URL with the receipt UUID", async () => {
    const transport = FiscalTransportFake.answering({
      status: 200,
      headers: {},
      body: '{"receipt":{"status":"Valid"}}',
    });
    const outcome = await new EtaReceiptDriver(transport, credentials()).poll(record, context);
    const [request] = transport.calls("send") as TransportRequest[];
    expect(request?.url).toBe("https://authority.test/receipts/U1/details");
    expect(outcome?.status).toBe(FiscalRecordStatus.Accepted);
  });

  it("exports JSON lines", async () => {
    const driver = new EtaReceiptDriver(FiscalTransportFake.answering(), credentials());
    expect((await driver.exportJournal([], context)).fileName).toBe("pos_1.eta-receipt.jsonl");
  });
});
