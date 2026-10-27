/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDriver`: an abstract port a host implements; a driver has a key and seals, submits and
 *          exports.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

/** A host driver whose seal completes the obligation. */
class EchoDriver extends FiscalDriver {
  readonly key = "echo";

  async seal(): Promise<SealedPayload> {
    return {
      payload: "p",
      contentType: "text/plain",
      hash: "h",
      signature: null,
      qr: null,
      marks: {},
      status: FiscalRecordStatus.Accepted,
    };
  }

  async submit(): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  async exportJournal(records: readonly FiscalRecord[]): Promise<JournalExport> {
    return {
      fileName: "e",
      contentType: "text/plain",
      encoding: "utf-8",
      content: String(records.length),
    };
  }
}

describe("FiscalDriver", () => {
  it("is a port with a key and the three operations", async () => {
    const driver: FiscalDriver = new EchoDriver();
    const context = { unitId: "u", options: {} };
    expect(driver).toBeInstanceOf(Port);
    expect(driver.key).toBe("echo");
    expect(
      (
        await driver.seal(fiscalDocument(), {
          ...context,
          previous: null,
          sequence: 1,
          now: new Date(0),
        })
      ).hash,
    ).toBe("h");
    expect((await driver.exportJournal([], context)).content).toBe("0");
  });
});
