/**
 * Stackra file contract:
 * Purpose: `MemoryImportLedgerDriver`, the `memory` driver of `ImportLedger`: runs and batches in a map, for tests, a
 *          worker that imports and reverts in one process, and every target until the durable driver lands.
 * Boundary: nothing survives the instance. It returns copies, and refuses an out-of-order batch exactly as a durable
 *           driver must.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 9); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import { ImportLedger } from "#contracts/ports/import-ledger.port";
import type { ImportBatchEntry } from "#contracts/types/import-batch-entry.type";
import type { ImportRunRecord } from "#contracts/types/import-run-record.type";

/**
 * The import ledger in memory.
 *
 * @example
 * const runner = new ImportRunner(new MemoryImportLedgerDriver(), clock);
 */
export class MemoryImportLedgerDriver extends Driver(ImportLedger) {
  private readonly runs = new Map<
    string,
    { record: ImportRunRecord; batches: ImportBatchEntry[] }
  >();

  /** See `ImportLedger.open`. */
  async open(runId: string): Promise<ImportRunRecord> {
    const entry = this.runs.get(runId) ?? {
      record: { id: runId, state: ImportRunState.Running, cursor: 0 },
      batches: [],
    };
    this.runs.set(runId, entry);
    return { ...entry.record };
  }

  /** See `ImportLedger.find`. */
  async find(runId: string): Promise<ImportRunRecord | undefined> {
    const entry = this.runs.get(runId);
    return entry === undefined ? undefined : { ...entry.record };
  }

  /** See `ImportLedger.append`. */
  async append(runId: string, batch: ImportBatchEntry): Promise<void> {
    const entry = this.entryOf(runId);
    if (batch.index !== entry.batches.length)
      throw new RangeError(
        `Import run ${runId} expects batch ${entry.batches.length}, not ${batch.index}`,
      );
    entry.batches.push(structuredClone(batch));
    entry.record = { ...entry.record, cursor: batch.lastRow };
  }

  /** See `ImportLedger.batches`. */
  async batches(runId: string): Promise<readonly ImportBatchEntry[]> {
    return structuredClone(this.runs.get(runId)?.batches ?? []);
  }

  /** See `ImportLedger.settle`. */
  async settle(runId: string, state: ImportRunState, at: Date): Promise<void> {
    const entry = this.entryOf(runId);
    entry.record = { ...entry.record, state, settledAt: new Date(at) };
  }

  private entryOf(runId: string): { record: ImportRunRecord; batches: ImportBatchEntry[] } {
    const entry = this.runs.get(runId);
    if (entry === undefined) throw new RangeError(`No import run ${runId} in the ledger`);
    return entry;
  }
}
