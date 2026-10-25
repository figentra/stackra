/**
 * Stackra file contract:
 * Purpose: `FdmDriver`, the `fdm` till rule (a fiscal data module, the "black box"): the receipt's gross per VAT slot,
 *          its event type and number, signed by the till's module, with the module's id, counter and signature as the
 *          receipt marks.
 * Boundary: a driver of `FiscalDriver`, key `fdm`. The module is a `FiscalDevice`; it keeps the journal and transmits
 *           nothing through this package, so a sealed receipt is complete. Slots and event types are pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 5 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Money } from "@stackra/money";
import { z } from "zod";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalDevice } from "#contracts/ports/fiscal-device.port";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { FDM_OPTIONS } from "#core/constants/fdm-options.constant";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { deviceExport } from "#core/functions/device-export.function";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";

/** What the module answers for a signed ticket. */
const FDM_ANSWER = z.object({
  moduleId: z.string().min(1),
  ticketCounter: z.int(),
  totalCounter: z.int(),
  signature: z.string().min(1),
  signedAt: z.string().min(1),
});

/**
 * Signs receipts through the till's fiscal data module.
 *
 * @example
 * new FiscalService([new FdmDriver(device)], packs, journal, clock);
 */
export class FdmDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "fdm";

  /** The till's paired module. */
  private readonly device: FiscalDevice;

  /** @param device - the paired module binding. */
  constructor(device: FiscalDevice) {
    super();
    this.device = device;
  }

  /**
   * Has the module sign the ticket.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a rate has no slot.
   * @throws FiscalAuthorityUnavailableError when the module answers in another shape.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(FDM_OPTIONS, context.options, this.key);
    const totals = new Map<string, Money>();
    for (const line of document.lines) {
      const slot = options.vatRateSlots[line.taxRate];
      if (!slot)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `vatRateSlots: none for ${line.taxRate}`,
        });
      const sum = totals.get(slot);
      const gross = line.net.plus(line.tax);
      totals.set(slot, sum ? sum.plus(gross) : gross);
    }
    const request = {
      ticketNumber: document.number,
      issuedAt: document.issuedAt.toISOString(),
      event: options.eventTypes[document.kind],
      totals: Object.fromEntries([...totals].map(([slot, sum]) => [slot, sum.toDecimal()])),
      gross: document.gross.toDecimal(),
    };
    const answer = parseDeviceAnswer(
      FDM_ANSWER,
      await this.device.call(context.unitId, "fdm.sign", request),
      this.key,
    );
    return {
      payload: JSON.stringify(request),
      contentType: "application/json",
      hash: toBase64(await sha256(answer.signature)),
      signature: answer.signature,
      qr: null,
      marks: {
        moduleId: answer.moduleId,
        ticketCounter: String(answer.ticketCounter),
        totalCounter: String(answer.totalCounter),
        signedAt: answer.signedAt,
      },
      status: FiscalRecordStatus.Accepted,
    };
  }

  /** Nothing to hand over: the module keeps the journal. */
  async submit(_record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  /** The module's dump for the records' span. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return deviceExport(this.device, "fdm.export", records, context.unitId, this.key);
  }
}
