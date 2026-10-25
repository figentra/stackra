/**
 * Stackra file contract:
 * Purpose: `TseDriver`, the `tse` till rule (a technical security element): the receipt's process data (gross per VAT
 *          slot, tenders by payment type), signed by the till's TSE in one transaction, and the receipt QR built from
 *          the TSE's answer.
 * Boundary: a driver of `FiscalDriver`, key `tse`. The TSE is a `FiscalDevice` (local or cloud), so the TSE's own
 *           counter and log are the chain and nothing is submitted; the journal export is the TSE's archive. Slots,
 *           payment types, the process type and the home currency are pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 5 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Money } from "@stackra/money";
import { z } from "zod";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
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
import { TSE_OPTIONS } from "#core/constants/tse-options.constant";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { deviceExport } from "#core/functions/device-export.function";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";

/** What the TSE answers for a finished transaction. */
const TSE_ANSWER = z.object({
  transactionNumber: z.int(),
  signatureCounter: z.int(),
  signature: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  serialNumber: z.string().min(1),
  signatureAlgorithm: z.string().min(1),
  timeFormat: z.string().min(1),
  publicKey: z.string().min(1),
});

/**
 * Signs receipts through the till's TSE.
 *
 * @example
 * new FiscalService([new TseDriver(device)], packs, journal, clock);
 */
export class TseDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "tse";

  /** The till's paired TSE. */
  private readonly device: FiscalDevice;

  /** @param device - the paired TSE binding. */
  constructor(device: FiscalDevice) {
    super();
    this.device = device;
  }

  /**
   * Signs the receipt's process data in one TSE transaction; a note's amounts are negative.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit, a rate has no slot or a method no type.
   * @throws FiscalAuthorityUnavailableError when the TSE answers in another shape.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(TSE_OPTIONS, context.options, this.key);
    const credit = document.kind === FiscalDocumentKind.CreditNote;
    const signed = (money: Money) => (credit ? Money.zero(money.currency).minus(money) : money);
    const slots = [1, 2, 3, 4, 5].map(() => Money.zero(document.currency));
    for (const line of document.lines) {
      const slot = options.vatRateSlots[line.taxRate];
      if (slot === undefined)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `vatRateSlots: none for ${line.taxRate}`,
        });
      slots[slot - 1] = (slots[slot - 1] ?? Money.zero(document.currency)).plus(
        line.net.plus(line.tax),
      );
    }
    const payments = document.payments.map((payment) => {
      const type = options.paymentTypes[payment.method];
      if (!type)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `paymentTypes: none for ${payment.method}`,
        });
      const currency =
        payment.amount.currency === options.homeCurrency ? "" : `:${payment.amount.currency}`;
      return `${signed(payment.amount).toDecimal()}:${type}${currency}`;
    });
    const processData = `Beleg^${slots.map((sum) => signed(sum).toDecimal()).join("_")}^${payments.join("_")}`;
    const answer = parseDeviceAnswer(
      TSE_ANSWER,
      await this.device.call(context.unitId, "tse.transaction", {
        clientId: context.unitId,
        processType: options.processType,
        processData,
        documentNumber: document.number,
      }),
      this.key,
    );
    const qr = [
      "V0",
      context.unitId,
      options.processType,
      processData,
      answer.transactionNumber,
      answer.signatureCounter,
      answer.startTime,
      answer.endTime,
      answer.signatureAlgorithm,
      answer.timeFormat,
      answer.signature,
      answer.publicKey,
    ].join(";");
    return {
      payload: processData,
      contentType: "text/plain",
      hash: toBase64(await sha256(qr)),
      signature: answer.signature,
      qr,
      marks: {
        transactionNumber: String(answer.transactionNumber),
        signatureCounter: String(answer.signatureCounter),
        startTime: answer.startTime,
        endTime: answer.endTime,
        serialNumber: answer.serialNumber,
      },
      status: FiscalRecordStatus.Accepted,
    };
  }

  /** Nothing to hand over: the TSE's log is the record. */
  async submit(_record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  /** The TSE's archive for the records' span. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return deviceExport(this.device, "tse.export", records, context.unitId, this.key);
  }
}
