/**
 * Stackra file contract:
 * Purpose: `RtDriver`, the `rt` till rule (a telematic recorder): the commercial document's lines, rates and tenders
 *          sent to the till's recorder, which prints, stores and transmits it, with its serial, closure number and
 *          document number as the receipt marks.
 * Boundary: a driver of `FiscalDriver`, key `rt`. The recorder is a `FiscalDevice` and transmits to the authority
 *           itself, so a sealed document is complete. Document and payment types are pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 5 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
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
import { RT_OPTIONS } from "#core/constants/rt-options.constant";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { deviceExport } from "#core/functions/device-export.function";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";

/** What the recorder answers for a stored document. */
const RT_ANSWER = z.object({
  serialNumber: z.string().min(1),
  closureNumber: z.int(),
  documentNumber: z.int(),
  storedAt: z.string().min(1),
});

/**
 * Records documents through the till's telematic recorder.
 *
 * @example
 * new FiscalService([new RtDriver(device)], packs, journal, clock);
 */
export class RtDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "rt";

  /** The till's paired recorder. */
  private readonly device: FiscalDevice;

  /** @param device - the paired recorder binding. */
  constructor(device: FiscalDevice) {
    super();
    this.device = device;
  }

  /**
   * Has the recorder store the document.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a method has no payment type.
   * @throws FiscalAuthorityUnavailableError when the recorder answers in another shape.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(RT_OPTIONS, context.options, this.key);
    const request = {
      documentType: options.documentTypes[document.kind],
      number: document.number,
      original: document.original?.number ?? null,
      lines: document.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toDecimal(),
        gross: line.net.plus(line.tax).toDecimal(),
        vatRate: line.taxRate,
      })),
      payments: document.payments.map((payment) => {
        const type = options.paymentTypes[payment.method];
        if (!type)
          throw FiscalOptionsInvalidError.create({
            driver: this.key,
            issues: `paymentTypes: none for ${payment.method}`,
          });
        return { type, amount: payment.amount.toDecimal() };
      }),
      gross: document.gross.toDecimal(),
    };
    const answer = parseDeviceAnswer(
      RT_ANSWER,
      await this.device.call(context.unitId, "rt.document", request),
      this.key,
    );
    const mark = `${answer.serialNumber}-${answer.closureNumber}-${answer.documentNumber}`;
    return {
      payload: JSON.stringify(request),
      contentType: "application/json",
      hash: toBase64(await sha256(mark)),
      signature: null,
      qr: null,
      marks: {
        serialNumber: answer.serialNumber,
        closureNumber: String(answer.closureNumber),
        documentNumber: String(answer.documentNumber),
        storedAt: answer.storedAt,
      },
      status: FiscalRecordStatus.Accepted,
    };
  }

  /** Nothing to hand over: the recorder transmits. */
  async submit(_record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  /** The recorder's dump for the records' span. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return deviceExport(this.device, "rt.export", records, context.unitId, this.key);
  }
}
