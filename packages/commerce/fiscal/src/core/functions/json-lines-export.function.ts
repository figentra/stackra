/**
 * Stackra file contract:
 * Purpose: `jsonLinesExport`, a unit's chain as JSON lines (one record per line: sequence, document, time, hashes,
 *          signature, marks, status, payload): the audit export of software-signed mandates.
 * Boundary: a pure function; it writes what the records hold and adds nothing, so an auditor can re-hash every
 *           payload and walk the chain.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 7).
 */
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";

/**
 * The export file; empty content for no records.
 *
 * @example
 * return jsonLinesExport(records, `${context.unitId}.nf525.jsonl`);
 */
export function jsonLinesExport(records: readonly FiscalRecord[], fileName: string): JournalExport {
  const lines = records.map((record) =>
    JSON.stringify({
      sequence: record.sequence,
      documentId: record.documentId,
      documentNumber: record.documentNumber,
      sealedAt: record.sealedAt.toISOString(),
      hash: record.hash,
      previousHash: record.previousHash,
      signature: record.signature,
      marks: record.marks,
      status: record.status,
      authorityReference: record.authorityReference,
      payload: record.payload,
    }),
  );
  return {
    fileName,
    contentType: "application/jsonl",
    encoding: "utf-8",
    content: lines.length === 0 ? "" : `${lines.join("\n")}\n`,
  };
}
