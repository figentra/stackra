/**
 * Stackra file contract:
 * Purpose: unit tests of `TseDriver`: the process data per slot and tender, negative amounts on a credit note, the TSE
 *          transaction call, the receipt QR and marks, the refusals, the no-op submission and the TSE export.
 * Boundary: test only; the TSE is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { TseDriver } from "#core/drivers/tse.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";

const OPTIONS = {
  processType: "Sample-V1",
  vatRateSlots: { "20": 1, "10": 2 },
  paymentTypes: { cash: "Bar", card: "Unbar" },
  homeCurrency: "EUR",
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const ANSWER = {
  transactionNumber: 7,
  signatureCounter: 42,
  signature: "SIG",
  startTime: "2026-03-01T09:30:00.000Z",
  endTime: "2026-03-01T09:30:01.000Z",
  serialNumber: "SERIAL",
  signatureAlgorithm: "ecdsa-plain-SHA256",
  timeFormat: "utcTime",
  publicKey: "PK",
};
const tse = () =>
  FiscalDeviceFake.with({
    "tse.transaction": ANSWER,
    "tse.export": { fileName: "t.tar", contentType: "application/x-tar", content: "AA==" },
  });

describe("TseDriver#seal", () => {
  it("signs the process data in one transaction and builds the QR", async () => {
    const device = tse();
    const sealed = await new TseDriver(device).seal(fiscalDocument(), context);
    const processData = "Beleg^24.00_11.00_0.00_0.00_0.00^35.00:Bar";
    expect(device.sent).toEqual([
      {
        unitId: "till_1",
        command: "tse.transaction",
        payload: {
          clientId: "till_1",
          processType: "Sample-V1",
          processData,
          documentNumber: "INV-0001",
        },
      },
    ]);
    expect(sealed.qr).toBe(
      `V0;till_1;Sample-V1;${processData};7;42;2026-03-01T09:30:00.000Z;2026-03-01T09:30:01.000Z;ecdsa-plain-SHA256;utcTime;SIG;PK`,
    );
    expect([sealed.payload, sealed.signature, sealed.status]).toEqual([
      processData,
      "SIG",
      FiscalRecordStatus.Accepted,
    ]);
    expect(sealed.marks).toMatchObject({
      transactionNumber: "7",
      signatureCounter: "42",
      serialNumber: "SERIAL",
    });
  });

  it("writes a credit note negative and a foreign tender with its currency", async () => {
    const device = tse();
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      payments: [{ method: "card", amount: Money.ofMinor(3500, "USD") }],
    });
    const sealed = await new TseDriver(device).seal(note, context);
    expect(sealed.payload).toBe("Beleg^-24.00_-11.00_0.00_0.00_0.00^-35.00:Unbar:USD");
  });

  it("refuses a rate without a slot and a method without a type", async () => {
    await expect(
      new TseDriver(tse()).seal(fiscalDocument(), {
        ...context,
        options: { ...OPTIONS, vatRateSlots: { "20": 1 } },
      }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
    await expect(
      new TseDriver(tse()).seal(fiscalDocument(), {
        ...context,
        options: { ...OPTIONS, paymentTypes: {} },
      }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
  });

  it("refuses a TSE answer of another shape", async () => {
    const device = FiscalDeviceFake.with({ "tse.transaction": { transactionNumber: "7" } });
    await expect(new TseDriver(device).seal(fiscalDocument(), context)).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, FiscalAuthorityUnavailableError),
    );
  });
});

describe("TseDriver#submit and #exportJournal", () => {
  it("accepts without a call and relays the TSE archive", async () => {
    const device = tse();
    const driver = new TseDriver(device);
    expect((await driver.submit(fiscalRecord(), context)).status).toBe(FiscalRecordStatus.Accepted);
    expect(await driver.exportJournal([fiscalRecord()], context)).toEqual({
      fileName: "t.tar",
      contentType: "application/x-tar",
      encoding: "base64",
      content: "AA==",
    });
  });
});
