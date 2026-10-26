/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryImportLedgerDriver`: open creates once, append moves the cursor and refuses an
 *          out-of-order batch, settle sets state and time, reads return copies, unknown runs are refused, and purge
 *          empties the before-images of runs settled before the cutoff only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 7 and 9); ADR 0431 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import { MemoryImportLedgerDriver } from "#core/drivers/memory-import-ledger.driver";

const BATCH = {
  index: 0,
  sheet: "",
  lastRow: 3,
  changes: [{ key: "a", before: null }],
  errors: [],
};

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

  it("purges before-images of runs settled before the cutoff, once", async () => {
    const ledger = new MemoryImportLedgerDriver();
    const settled = new Date("2026-10-01T00:00:00.000Z");
    const cutoff = new Date("2026-10-08T00:00:00.000Z");
    const at = new Date("2026-10-09T00:00:00.000Z");
    for (const runId of ["imp_old", "imp_new", "imp_open"]) {
      await ledger.open(runId);
      await ledger.append(runId, BATCH);
    }
    await ledger.settle("imp_old", ImportRunState.Finished, settled);
    await ledger.settle("imp_new", ImportRunState.Finished, at);
    expect(await ledger.purge(cutoff, at)).toBe(1);
    expect(await ledger.batches("imp_old")).toEqual([{ ...BATCH, changes: [] }]);
    expect((await ledger.find("imp_old"))?.purgedAt).toEqual(at);
    expect(await ledger.batches("imp_new")).toEqual([BATCH]);
    expect(await ledger.batches("imp_open")).toEqual([BATCH]);
    expect(await ledger.purge(cutoff, at)).toBe(0);
  });

  it("refuses unknown runs", async () => {
    const ledger = new MemoryImportLedgerDriver();
    await expect(ledger.append("imp_9", BATCH)).rejects.toThrow(RangeError);
    await expect(ledger.settle("imp_9", ImportRunState.Failed, new Date())).rejects.toThrow(
      RangeError,
    );
  });
});
