/**
 * Stackra file contract:
 * Purpose: `ImportRunner`, the import engine: maps and validates each row of one sheet, writes valid rows in batches
 *          through the target's `upsert`, records each batch in the `ImportLedger`, resumes a failed or crashed run
 *          after its cursor, and reverts a whole run inside the caller's undo window.
 * Boundary: a service with no state of its own. Batch size and undo window are the caller's settings. A refused row is
 *           reported, never fatal; a batch that throws is rolled back by the target's unit of work and fails the run.
 *           Personal data in rows is passed to the target and never logged or kept here.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 6 to 8); ADR 0163 (decision 3); ADR 0263 (resolved by type).
 */
import { Clock, Duration } from "@stackra/contracts";
import { Service } from "@stackra/container";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import { ImportLedger } from "#contracts/ports/import-ledger.port";
import type { ImportTarget } from "#contracts/types/import-target.type";
import type { RowError } from "#contracts/types/row-error.type";
import { ImportRunClosedError } from "#core/errors/import-run-closed.error";
import { ImportRunNotFoundError } from "#core/errors/import-run-not-found.error";
import { ImportUndoExpiredError } from "#core/errors/import-undo-expired.error";
import { compileMapping } from "#core/functions/compile-mapping.function";
import type { ImportOptions } from "#core/types/import-options.type";
import type { ImportReport } from "#core/types/import-report.type";
import type { RevertOptions } from "#core/types/revert-options.type";

/**
 * Runs and reverts imports.
 *
 * @example
 * const report = await runner.run({ runId, rows: reader.read(upload, readOptions), mapping, target, batchSize });
 * await runner.revert(runId, target, { window: settings.importUndoWindow });
 */
export class ImportRunner extends Service {
  private readonly ledger: ImportLedger;

  private readonly clock: Clock;

  /**
   * @param ledger - where runs and batches are recorded.
   * @param clock - the time a run settles and a revert is checked against.
   */
  constructor(ledger: ImportLedger, clock: Clock) {
    super();
    this.ledger = ledger;
    this.clock = clock;
  }

  /**
   * Imports `options.rows`, resuming after the run's cursor when the run exists.
   *
   * @throws ImportRunClosedError when the run is finished or reverted.
   * @throws RangeError when `batchSize` is not a whole number above zero.
   * @throws TypeError when the rows come from more than one sheet.
   * @throws whatever the reader or the target throws; the run is then marked failed and resumes on the next call.
   */
  async run<T>(options: ImportOptions<T>): Promise<ImportReport> {
    const { runId, rows, mapping, target, batchSize } = options;
    if (!Number.isInteger(batchSize) || batchSize < 1)
      throw new RangeError(
        `A batch holds a whole number of rows above zero, not ${String(batchSize)}`,
      );
    const run = await this.ledger.open(runId);
    if (run.state === ImportRunState.Finished || run.state === ImportRunState.Reverted)
      throw ImportRunClosedError.create({ runId, state: run.state });
    let index = (await this.ledger.batches(runId)).length;
    let sheet: string | undefined;
    let toRecord: ((cells: readonly string[]) => Record<string, string>) | undefined;
    let records: T[] = [];
    let errors: RowError[] = [];
    let lastRow = run.cursor;
    const commit = async (): Promise<void> => {
      const changes = records.length === 0 ? [] : await target.upsert(records);
      await this.ledger.append(runId, { index, lastRow, changes, errors });
      index += 1;
      records = [];
      errors = [];
    };
    try {
      for await (const row of rows) {
        if (toRecord === undefined) {
          sheet = row.sheet;
          toRecord = compileMapping(row.cells, mapping);
          continue;
        }
        if (row.sheet !== sheet)
          throw new TypeError(
            `An import reads one sheet, but rows came from "${sheet ?? ""}" and "${row.sheet}": pass sheets: [name] to the reader`,
          );
        if (row.row <= run.cursor) continue;
        lastRow = row.row;
        const parsed = target.schema.safeParse(toRecord(row.cells));
        if (parsed.success) records.push(parsed.data);
        else
          errors.push({
            sheet: row.sheet,
            row: row.row,
            issues: parsed.error.issues.map((issue) => ({
              field: issue.path.map(String).join("."),
              code: issue.code,
              message: issue.message,
            })),
          });
        if (records.length + errors.length >= batchSize) await commit();
      }
      if (records.length + errors.length > 0) await commit();
    } catch (error) {
      await this.ledger.settle(runId, ImportRunState.Failed, this.clock.now());
      throw error;
    }
    await this.ledger.settle(runId, ImportRunState.Finished, this.clock.now());
    const batches = await this.ledger.batches(runId);
    return {
      runId,
      written: batches.reduce((sum, batch) => sum + batch.changes.length, 0),
      errors: batches.flatMap((batch) => batch.errors),
    };
  }

  /**
   * Reverts every batch of a finished or failed run, newest first, then marks it reverted. A revert that fails part
   * way can be called again: the target restores before-images, so a batch reverted twice ends the same.
   *
   * @throws ImportRunNotFoundError when the ledger has no such run.
   * @throws ImportRunClosedError when the run is running or already reverted.
   * @throws ImportUndoExpiredError when the run settled longer than `options.window` ago.
   */
  async revert<T>(runId: string, target: ImportTarget<T>, options: RevertOptions): Promise<void> {
    const run = await this.ledger.find(runId);
    if (run === undefined) throw ImportRunNotFoundError.create({ runId });
    if (
      run.settledAt === undefined ||
      (run.state !== ImportRunState.Finished && run.state !== ImportRunState.Failed)
    )
      throw ImportRunClosedError.create({ runId, state: run.state });
    const now = this.clock.now();
    if (now.getTime() - run.settledAt.getTime() > Duration.toMilliseconds(options.window))
      throw ImportUndoExpiredError.create({ runId, settledAt: run.settledAt.toISOString() });
    const batches = await this.ledger.batches(runId);
    for (const batch of [...batches].reverse())
      if (batch.changes.length > 0) await target.revert(batch.changes);
    await this.ledger.settle(runId, ImportRunState.Reverted, now);
  }
}
