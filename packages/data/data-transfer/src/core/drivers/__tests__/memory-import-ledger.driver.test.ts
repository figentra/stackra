/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryImportLedgerDriver`: open creates once, append moves the cursor and refuses an
 *          out-of-order batch, settle sets state and time, reads return copies, unknown runs are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 7 and 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import { MemoryImportLedgerDriver } from "#core/drivers/memory-import-ledger.driver";

const BATCH = { index: 0, lastRow: 3, changes: [{ key: "a", before: null }], errors: [] };

describe("MemoryImportLedgerDriver", () => {
  it("records runs and batches", async () => {
    const ledger = new MemoryImportLedgerDriver();
    expect(await ledger.find("imp_1")).toBeUndefined();
    expect(await ledger.open("imp_1")).toEqual({
      id: "imp_1",
      state: ImportRunState.Running,
      cursor: 0,
    });
    await ledger.append("imp_1", BATCH);
    expect((await ledger.open("imp_1")).cursor).toBe(3);
    await expect(ledger.append("imp_1", BATCH)).rejects.toThrow(RangeError);
    const at = new Date("2026-10-25T00:00:00.000Z");
    await ledger.settle("imp_1", ImportRunState.Finished, at);
    expect(await ledger.find("imp_1")).toEqual({
      id: "imp_1",
      state: ImportRunState.Finished,
      cursor: 3,
      settledAt: at,
    });
    const batches = await ledger.batches("imp_1");
    expect(batches).toEqual([BATCH]);
    expect(batches[0]).not.toBe(BATCH);
    expect(await ledger.batches("imp_2")).toEqual([]);
  });

  it("refuses unknown runs", async () => {
    const ledger = new MemoryImportLedgerDriver();
    await expect(ledger.append("imp_9", BATCH)).rejects.toThrow(RangeError);
    await expect(ledger.settle("imp_9", ImportRunState.Failed, new Date())).rejects.toThrow(
      RangeError,
    );
  });
});
