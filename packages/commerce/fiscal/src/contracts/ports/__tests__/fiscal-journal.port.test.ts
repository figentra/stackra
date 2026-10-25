/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalJournal`: an abstract port a host implements; the memory driver is one.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalJournal } from "#contracts/ports/fiscal-journal.port";
import { MemoryFiscalJournalDriver } from "#core/drivers/memory-fiscal-journal.driver";

describe("FiscalJournal", () => {
  it("is a port the memory driver implements", async () => {
    const journal: FiscalJournal = new MemoryFiscalJournalDriver();
    expect(journal).toBeInstanceOf(Port);
    expect(journal).toBeInstanceOf(FiscalJournal);
    expect(await journal.last("u")).toBeNull();
  });
});
