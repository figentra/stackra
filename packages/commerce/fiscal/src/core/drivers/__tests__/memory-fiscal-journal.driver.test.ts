/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFiscalJournalDriver`: the tail, a document's record, the append guards on sequence
 *          and document, updates, the pending queue and a time range.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalJournal } from "#contracts/ports/fiscal-journal.port";
import { MemoryFiscalJournalDriver } from "#core/drivers/memory-fiscal-journal.driver";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

const first = fiscalRecord();
const second = fiscalRecord({
  sequence: 2,
  documentId: "doc_2",
  sealedAt: new Date("2026-03-02T00:00:00Z"),
  status: FiscalRecordStatus.Accepted,
});

describe("MemoryFiscalJournalDriver", () => {
  it("is a FiscalJournal that starts empty", async () => {
    const journal = new MemoryFiscalJournalDriver();
    expect(journal).toBeInstanceOf(FiscalJournal);
    expect(await journal.last("till_1")).toBeNull();
  });

  it("appends in sequence and finds by document", async () => {
    const journal = new MemoryFiscalJournalDriver();
    expect(await journal.append(first)).toBe(true);
    expect(await journal.append(second)).toBe(true);
    expect(await journal.last("till_1")).toBe(second);
    expect(await journal.find("till_1", "doc_1")).toBe(first);
    expect(await journal.find("till_2", "doc_1")).toBeNull();
  });

  it("refuses a taken sequence, a gap and a document already sealed", async () => {
    const journal = new MemoryFiscalJournalDriver();
    await journal.append(first);
    expect(await journal.append({ ...first, documentId: "doc_x" })).toBe(false);
    expect(await journal.append({ ...second, sequence: 3 })).toBe(false);
    expect(await journal.append({ ...second, documentId: "doc_1" })).toBe(false);
  });

  it("updates in place and lists pending and ranges", async () => {
    const journal = new MemoryFiscalJournalDriver();
    await journal.append(first);
    await journal.append(second);
    expect(await journal.pending("till_1", 10)).toEqual([first]);
    await journal.update({ ...first, status: FiscalRecordStatus.Accepted });
    expect(await journal.pending("till_1", 10)).toEqual([]);
    expect(
      await journal.range(
        "till_1",
        new Date("2026-03-01T00:00:00Z"),
        new Date("2026-03-02T00:00:00Z"),
      ),
    ).toHaveLength(1);
    await journal.update(fiscalRecord({ unitId: "till_9" }));
    expect(await journal.last("till_9")).toBeNull();
  });
});
