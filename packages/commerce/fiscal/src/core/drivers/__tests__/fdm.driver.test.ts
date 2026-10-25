/**
 * Stackra file contract:
 * Purpose: unit tests of `FdmDriver`: the totals per module slot and the event type sent to the module, its marks,
 *          the refusals, the no-op submission and the module export.
 * Boundary: test only; the module is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FdmDriver } from "#core/drivers/fdm.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";

const OPTIONS = {
  vatRateSlots: { "20": "A", "10": "B" },
  eventTypes: { invoice: "NS", simplified: "NS", credit_note: "NR", debit_note: "NS" },
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const ANSWER = {
  moduleId: "M1",
  ticketCounter: 5,
  totalCounter: 9,
  signature: "SIG",
  signedAt: "2026-03-01T09:30:00Z",
};

describe("FdmDriver#seal", () => {
  it("sends the totals per slot and returns the module's marks", async () => {
    const device = FiscalDeviceFake.with({ "fdm.sign": ANSWER });
    const sealed = await new FdmDriver(device).seal(fiscalDocument(), context);
    expect(device.calls("call")).toEqual([
      {
        unitId: "till_1",
        command: "fdm.sign",
        payload: {
          ticketNumber: "INV-0001",
          issuedAt: "2026-03-01T09:30:00.000Z",
          event: "NS",
          totals: { A: "24.00", B: "11.00" },
          gross: "35.00",
        },
      },
    ]);
    expect(sealed.marks).toEqual({
      moduleId: "M1",
      ticketCounter: "5",
      totalCounter: "9",
      signedAt: "2026-03-01T09:30:00Z",
    });
    expect([sealed.signature, sealed.status]).toEqual(["SIG", FiscalRecordStatus.Accepted]);
  });

  it("refuses a rate without a slot and an answer of another shape", async () => {
    const device = FiscalDeviceFake.with({ "fdm.sign": ANSWER });
    await expect(
      new FdmDriver(device).seal(fiscalDocument(), {
        ...context,
        options: { ...OPTIONS, vatRateSlots: {} },
      }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
    await expect(
      new FdmDriver(FiscalDeviceFake.with({ "fdm.sign": {} })).seal(fiscalDocument(), context),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalAuthorityUnavailableError));
  });
});

describe("FdmDriver#submit and #exportJournal", () => {
  it("accepts without a call and relays the module's dump", async () => {
    const device = FiscalDeviceFake.with({
      "fdm.export": { fileName: "f.bin", contentType: "application/octet-stream", content: "" },
    });
    const driver = new FdmDriver(device);
    expect((await driver.submit(fiscalRecord(), context)).status).toBe(FiscalRecordStatus.Accepted);
    expect((await driver.exportJournal([fiscalRecord()], context)).fileName).toBe("f.bin");
  });
});
