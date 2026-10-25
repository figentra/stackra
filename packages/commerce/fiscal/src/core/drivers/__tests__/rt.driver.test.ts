/**
 * Stackra file contract:
 * Purpose: unit tests of `RtDriver`: the document sent to the recorder with mapped document and payment types, its
 *          marks, the refusals, the no-op submission and the recorder export.
 * Boundary: test only; the recorder is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { RtDriver } from "#core/drivers/rt.driver";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";

const OPTIONS = {
  documentTypes: { invoice: "1", simplified: "1", credit_note: "3", debit_note: "1" },
  paymentTypes: { cash: "1" },
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const ANSWER = {
  serialNumber: "RT1",
  closureNumber: 12,
  documentNumber: 34,
  storedAt: "2026-03-01T09:30:00Z",
};

describe("RtDriver#seal", () => {
  it("sends the document and returns the recorder's marks", async () => {
    const device = FiscalDeviceFake.with({ "rt.document": ANSWER });
    const sealed = await new RtDriver(device).seal(fiscalDocument(), context);
    const [call] = device.calls("call") as { payload: Record<string, unknown> }[];
    expect(call?.payload).toMatchObject({
      documentType: "1",
      number: "INV-0001",
      payments: [{ type: "1", amount: "35.00" }],
    });
    expect(call?.payload.lines).toEqual([
      { description: "Widget", quantity: 2, unitPrice: "10.00", gross: "24.00", vatRate: "20" },
      { description: "Book", quantity: 1, unitPrice: "10.00", gross: "11.00", vatRate: "10" },
    ]);
    expect(sealed.marks).toEqual({
      serialNumber: "RT1",
      closureNumber: "12",
      documentNumber: "34",
      storedAt: "2026-03-01T09:30:00Z",
    });
    expect(sealed.status).toBe(FiscalRecordStatus.Accepted);
  });

  it("refuses a method without a payment type", async () => {
    const device = FiscalDeviceFake.with({ "rt.document": ANSWER });
    await expect(
      new RtDriver(device).seal(fiscalDocument(), {
        ...context,
        options: { ...OPTIONS, paymentTypes: {} },
      }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
  });
});

describe("RtDriver#submit and #exportJournal", () => {
  it("accepts without a call and relays the recorder's dump", async () => {
    const device = FiscalDeviceFake.with({
      "rt.export": { fileName: "r.xml", contentType: "application/xml", content: "" },
    });
    const driver = new RtDriver(device);
    expect((await driver.submit(fiscalRecord(), context)).status).toBe(FiscalRecordStatus.Accepted);
    expect((await driver.exportJournal([fiscalRecord()], context)).fileName).toBe("r.xml");
  });
});
