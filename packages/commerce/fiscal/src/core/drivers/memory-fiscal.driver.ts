/**
 * Stackra file contract:
 * Purpose: `MemoryFiscalDriver`, an in-memory `FiscalDriver` for tests and development: it seals a document as JSON
 *          chained by SHA-256 to the previous record, accepts every submission and keeps a log of them, and exports
 *          the journal as JSON lines.
 * Boundary: the memory driver the port ships with (ADR 0266); key and file prefix `memory`. It talks to no authority
 *           and signs nothing, so no market pack may name it in production. It reads no options, clock or network.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2 and 3); ADR 0266 (decision 2).
 */
import { Driver } from "@stackra/container";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { sha256 } from "#core/functions/sha256.function";
import { toHex } from "#core/functions/to-hex.function";

/**
 * Seals offline with a hash chain and accepts every submission.
 *
 * @example
 * new FiscalService([new MemoryFiscalDriver()], packs, new MemoryFiscalJournalDriver(), clock);
 */
export class MemoryFiscalDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "memory";

  /** Every record handed to `submit`, in call order. */
  readonly submitted: FiscalRecord[] = [];

  /** The document's number, kind, time and gross with the chain position; hash is over the previous hash and it. */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const payload = JSON.stringify({
      sequence: context.sequence,
      number: document.number,
      kind: document.kind,
      issuedAt: document.issuedAt.toISOString(),
      gross: document.gross.toDecimal(),
      previousHash: context.previous?.hash ?? null,
    });
    return {
      payload,
      contentType: "application/json",
      hash: toHex(await sha256(`${context.previous?.hash ?? ""}${payload}`)),
      signature: null,
      qr: null,
      marks: { sequence: String(context.sequence) },
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Logs the record and accepts it, with `memory-<sequence>` as the authority's reference. */
  async submit(record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    this.submitted.push(record);
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: `memory-${record.sequence}`,
      message: null,
      payload: null,
    };
  }

  /** The records as JSON lines. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.memory.jsonl`);
  }
}
