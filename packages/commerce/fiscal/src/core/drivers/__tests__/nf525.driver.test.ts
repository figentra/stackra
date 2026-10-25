/**
 * Stackra file contract:
 * Purpose: unit tests of `Nf525Driver`: the signed string (totals per rate, total, local time, number, operation type,
 *          first-ticket flag, previous signature), the chain through the previous signature, negative credit notes,
 *          the short signature, the no-op submission and the export.
 * Boundary: test only; the signer is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import { Nf525Driver } from "#core/drivers/nf525.driver";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";

const OPTIONS = {
  operationTypes: { invoice: "a", simplified: "b", credit_note: "c", debit_note: "d" },
  timeZone: "UTC",
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};

describe("Nf525Driver#seal", () => {
  it("signs the first ticket of the chain", async () => {
    const signer = new FiscalSignerFake();
    const sealed = await new Nf525Driver(signer).seal(fiscalDocument(), context);
    const [request] = signer.calls("sign") as SignatureRequest[];
    expect(request?.format).toBe(SignatureFormat.Raw);
    expect(sealed.payload).toBe("2000:2400|1000:1100,3500,20260301093000,INV-0001,a,O,");
    expect(sealed.signature).toBeTruthy();
    expect(sealed.hash).toBe(sealed.signature);
    const value = sealed.signature ?? "";
    expect(sealed.marks.shortSignature).toBe(`${value[2]}${value[6]}${value[12]}${value[18]}`);
    expect(sealed.status).toBe(FiscalRecordStatus.Accepted);
  });

  it("chains a later ticket to the previous signature and signs a credit note negative", async () => {
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: { number: "INV-0000", issuedAt: new Date(0), reason: "returned", reference: null },
    });
    const previous = fiscalRecord({ signature: "PREV" });
    const sealed = await new Nf525Driver(new FiscalSignerFake()).seal(note, {
      ...context,
      previous,
      sequence: 2,
    });
    expect(sealed.payload).toBe("2000:-2400|1000:-1100,-3500,20260301093000,INV-0001,c,N,PREV");
  });
});

describe("Nf525Driver#submit and #exportJournal", () => {
  it("accepts without a call and exports the chain", async () => {
    const driver = new Nf525Driver(new FiscalSignerFake());
    expect((await driver.submit(fiscalRecord(), context)).status).toBe(FiscalRecordStatus.Accepted);
    expect((await driver.exportJournal([fiscalRecord()], context)).fileName).toBe(
      "till_1.nf525.jsonl",
    );
  });
});
