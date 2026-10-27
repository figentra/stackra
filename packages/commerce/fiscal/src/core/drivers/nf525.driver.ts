/**
 * Stackra file contract:
 * Purpose: `Nf525Driver`, the `nf525` till rule (a certified software chain): each ticket's gross per rate, total,
 *          local time, number, operation type, first-ticket flag and the previous ticket's signature, signed by the
 *          till's key, so every ticket seals the one before.
 * Boundary: a driver of `FiscalDriver`, key `nf525`. Fully offline: the chain is the obligation and nothing is
 *           submitted. The chain hash is the signature itself. The printed short signature is characters 3, 7, 13
 *           and 19 of it. Operation types and the time zone are pack options; rates are written in hundredths of a
 *           percent and amounts in minor units, as the format signs them.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { NF525_OPTIONS } from "#core/constants/nf525-options.constant";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { zonedTime } from "#core/functions/zoned-time.function";

/**
 * Signs tickets on the till's software chain.
 *
 * @example
 * new FiscalService([new Nf525Driver(signer)], packs, journal, clock);
 */
export class Nf525Driver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "nf525";

  /** Signs with the till's key. */
  private readonly signer: FiscalSigner;

  /**
   * @param signer - the till's raw signer.
   */
  constructor(signer: FiscalSigner) {
    super();
    this.signer = signer;
  }

  /**
   * Signs the ticket onto the chain; a credit note's amounts are negative.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(NF525_OPTIONS, context.options, this.key);
    const sign = document.kind === FiscalDocumentKind.CreditNote ? -1 : 1;
    const totals = new Map<number, number>();
    for (const group of taxBreakdown(document.lines)) {
      const rate = Math.round(Number(group.rate) * 100);
      totals.set(rate, (totals.get(rate) ?? 0) + sign * group.net.plus(group.tax).minor);
    }
    const local = zonedTime(document.issuedAt, options.timeZone);
    const payload = [
      [...totals].map(([rate, minor]) => `${rate}:${minor}`).join("|"),
      sign * document.gross.minor,
      `${local.date}${local.time}`.replace(/[-:]/g, ""),
      document.number,
      options.operationTypes[document.kind],
      context.previous === null ? "O" : "N",
      context.previous?.signature ?? "",
    ].join(",");
    const signed = await this.signer.sign({
      unitId: context.unitId,
      format: SignatureFormat.Raw,
      payload,
      digest: toBase64(await sha256(payload)),
    });
    const short = [2, 6, 12, 18].map((index) => signed.value.charAt(index)).join("");
    return {
      payload,
      contentType: "text/plain",
      hash: signed.value,
      signature: signed.value,
      qr: null,
      marks: { shortSignature: short },
      status: FiscalRecordStatus.Accepted,
    };
  }

  /** Nothing to hand over: the chain is the record. */
  async submit(_record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  /** The signed chain as JSON lines, the archive an auditor replays. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.nf525.jsonl`);
  }
}
