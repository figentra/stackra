/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalRecord`: a sealed record type-checks with its chain fields; a record without a hash
 *          does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";

const record: FiscalRecord = {
  unitId: "till_1",
  sequence: 1,
  market: "xx",
  channel: FiscalChannel.Till,
  driver: "nf525",
  documentId: "doc_1",
  documentNumber: "R-1",
  payload: "p",
  contentType: "text/plain",
  hash: "h",
  previousHash: null,
  signature: null,
  qr: null,
  marks: {},
  sealedAt: new Date(0),
  status: FiscalRecordStatus.Sealed,
  submittedAt: null,
  authorityReference: null,
  message: null,
};

describe("FiscalRecord", () => {
  it("takes the first record of a chain", () => {
    expect([record.sequence, record.previousHash]).toEqual([1, null]);
  });

  it("refuses a record without a hash and is read-only", () => {
    // @ts-expect-error -- every record carries its chain hash
    const hashless: FiscalRecord = { ...record, hash: undefined };
    // @ts-expect-error -- records change only through the journal
    record.status = FiscalRecordStatus.Accepted;
    expect(hashless.hash).toBeUndefined();
  });
});
