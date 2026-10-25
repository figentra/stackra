/**
 * Stackra file contract:
 * Purpose: `fiscalRecord`, a sample sealed `FiscalRecord` for tests: the first record of `till_1`, sealed and waiting.
 * Boundary: test data only; overrides replace whole fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fixtures in the owning package's `./testing`); ADR 0364.
 */
import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";

/**
 * The sample record with `overrides` applied.
 *
 * @example
 * const second = fiscalRecord({ sequence: 2, documentId: "doc_2", previousHash: "hash-1" });
 */
export function fiscalRecord(overrides: Partial<FiscalRecord> = {}): FiscalRecord {
  return {
    unitId: "till_1",
    sequence: 1,
    market: "xx",
    channel: FiscalChannel.Till,
    driver: "sample",
    documentId: "doc_1",
    documentNumber: "INV-0001",
    payload: "<Invoice></Invoice>",
    contentType: "application/xml",
    hash: "hash-1",
    previousHash: null,
    signature: null,
    qr: null,
    marks: {},
    sealedAt: new Date("2026-03-01T09:30:00Z"),
    status: FiscalRecordStatus.Sealed,
    submittedAt: null,
    authorityReference: null,
    message: null,
    ...overrides,
  };
}
