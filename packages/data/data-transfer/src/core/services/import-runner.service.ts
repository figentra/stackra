/**
 * Stackra file contract:
 * Purpose: `ImportRunner`, the import engine: maps and validates each row, writes valid rows in batches through the
 *          target's `upsert`, records each batch in the `ImportLedger`, resumes a failed or crashed run after each
 *          sheet's cursor, and reverts a whole run inside the caller's undo window. `run` imports one sheet into one
 *          target; `runSheets` imports several sheets of one workbook into several targets in one run.
 * Boundary: a service with no state of its own. Batch size and undo window are the caller's settings. A refused row is
 *           reported, never fatal; a batch that throws is rolled back by the target's unit of work and fails the run. A
 *           batch never spans two sheets, so each batch is reverted through its own sheet's target, newest first
 *           (children before the parents they point at). Personal data in rows is passed to the target and never
 *           logged or kept here.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 6 to 8); ADR 0431 (decisions 1 and 3); ADR 0163 (decision 3); ADR 0263
 *                     (resolved by type).
 */
import { Clock, Duration } from "@stackra/contracts";
import { Service } from "@stackra/container";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import { ImportLedger } from "#contracts/ports/import-ledger.port";
import type { ImportBatchEntry } from "#contracts/types/import-batch-entry.type";
import type { ImportTarget } from "#contracts/types/import-target.type";
import type { RowError } from "#contracts/types/row-error.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { ImportRunClosedError } from "#core/errors/import-run-closed.error";
import { ImportRunNotFoundError } from "#core/errors/import-run-not-found.error";
import { ImportUndoExpiredError } from "#core/errors/import-undo-expired.error";
import { compileMapping } from "#core/functions/compile-mapping.function";
import type { ImportOptions } from "#core/types/import-options.type";
import type { ImportReport } from "#core/types/import-report.type";
import type { RevertOptions } from "#core/types/revert-options.type";
import type { RevertTargets } from "#core/types/revert-targets.type";
import type { SheetImport } from "#core/types/sheet-import.type";
import type { WorkbookImportOptions } from "#core/types/workbook-import-options.type";

/**
 * How the rows of one call are planned: the import of the sheet named `sheet`, or `undefined` to read past it.
 *
 * @throws TypeError when the sheet may not appear here.
 */
type Planner = (sheet: string) => SheetImport<unknown> | undefined;

/** The sheet being imported: its plan, its compiled mapping and the cursor it resumes after. */
interface Current {
  readonly plan: SheetImport<unknown>;
  readonly toRecord: (cells: readonly string[]) => Record<string, string>;
  readonly cursor: number;
}

/** Whether `targets` is one target rather than a map of them. */
function isTarget(
  targets: ImportTarget<unknown> | RevertTargets,
): targets is ImportTarget<unknown> {
  return typeof (targets as { upsert?: unknown }).upsert === "function";
}

/**
 * Runs and reverts imports.
 *
 * @example
 * const report = await runner.run({ runId, rows: reader.read(upload, readOptions), mapping, target, batchSize });
 * await runner.runSheets({ runId, rows, sheets: [{ sheet: "Products", mapping, target: products }, ...], batchSize });
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
   * Imports `options.rows` (one sheet) into `options.target`, resuming after the run's cursor when the run exists.
   *
   * @throws ImportRunClosedError when the run is finished or reverted.
   * @throws RangeError when `batchSize` is not a whole number above zero.
   * @throws TypeError when the rows come from more than one sheet.
   * @throws whatever the reader or the target throws; the run is then marked failed and resumes on the next call.
   */
  async run<T>(options: ImportOptions<T>): Promise<ImportReport> {
    const { mapping, target } = options;
    let only: string | undefined;
    return this.execute(options.runId, options.rows, options.batchSize, (sheet) => {
      if (only !== undefined && sheet !== only)
        throw new TypeError(
          `An import reads one sheet, but rows came from "${only}" and "${sheet}": pass sheets: [name] to the reader, or use runSheets`,
        );
      only = sheet;
      return { sheet, mapping, target: target as ImportTarget<unknown> };
    });
  }

  /**
   * Imports several sheets of one workbook into their targets as one run, in the order `options.sheets` lists them;
   * a sheet it does not list is read past. Resumes each sheet after its own last committed batch.
   *
   * @throws ImportRunClosedError when the run is finished or reverted.
   * @throws RangeError when `batchSize` is not a whole number above zero.
   * @throws TypeError when no sheet is listed, a sheet is listed twice, or the file has the listed sheets out of
   *         order (a target would be written before the one it depends on).
   * @throws whatever the reader or a target throws; the run is then marked failed and resumes on the next call.
   */
  async runSheets(options: WorkbookImportOptions): Promise<ImportReport> {
    const names = options.sheets.map((each) => each.sheet);
    if (names.length === 0) throw new TypeError("A workbook import lists at least one sheet");
    if (new Set(names).size !== names.length)
      throw new TypeError(`A workbook import lists each sheet once, got ${names.join(", ")}`);
    let reached = -1;
    return this.execute(options.runId, options.rows, options.batchSize, (sheet) => {
      const position = names.indexOf(sheet);
      if (position === -1) return undefined;
      if (position < reached)
        throw new TypeError(
          `Sheet "${sheet}" comes after "${names[reached] ?? ""}" in the file, but its target must be written first: reorder the sheets as ${names.join(", ")}`,
        );
      reached = position;
      return options.sheets[position];
    });
  }

  /**
   * Reverts every batch of a finished or failed run, newest first, each through its sheet's target, then marks it
   * reverted. A revert that fails part way can be called again: the target restores before-images, so a batch reverted
   * twice ends the same.
   *
   * @param targets - the run's one target, or sheet name to target for a workbook import.
   * @throws ImportRunNotFoundError when the ledger has no such run.
   * @throws ImportRunClosedError when the run is running or already reverted.
   * @throws ImportUndoExpiredError when the run settled longer than `options.window` ago or its before-images were
   *         purged.
   * @throws TypeError when a batch's sheet has no target; nothing is reverted then.
   */
  async revert(
    runId: string,
    targets: ImportTarget<unknown> | RevertTargets,
    options: RevertOptions,
  ): Promise<void> {
    const run = await this.ledger.find(runId);
    if (run === undefined) throw ImportRunNotFoundError.create({ runId });
    if (
      run.settledAt === undefined ||
      (run.state !== ImportRunState.Finished && run.state !== ImportRunState.Failed)
    )
      throw ImportRunClosedError.create({ runId, state: run.state });
    const now = this.clock.now();
    if (
      run.purgedAt !== undefined ||
      now.getTime() - run.settledAt.getTime() > Duration.toMilliseconds(options.window)
    )
      throw ImportUndoExpiredError.create({ runId, settledAt: run.settledAt.toISOString() });
    const batches = await this.ledger.batches(runId);
    const targetOf = (batch: ImportBatchEntry): ImportTarget<unknown> => {
      const target = isTarget(targets) ? targets : targets[batch.sheet];
      if (target === undefined)
        throw new TypeError(
          `Import run ${runId} wrote sheet "${batch.sheet}", but no target was given for it`,
        );
      return target;
    };
    const plan = [...batches].reverse().map((batch) => ({ batch, target: targetOf(batch) }));
    for (const { batch, target } of plan)
      if (batch.changes.length > 0) await target.revert(batch.changes);
    await this.ledger.settle(runId, ImportRunState.Reverted, now);
  }

  /** Reads `rows`, imports the sheets `planOf` plans, and settles the run. */
  private async execute(
    runId: string,
    rows: AsyncIterable<TabularRow>,
    batchSize: number,
    planOf: Planner,
  ): Promise<ImportReport> {
    if (!Number.isInteger(batchSize) || batchSize < 1)
      throw new RangeError(
        `A batch holds a whole number of rows above zero, not ${String(batchSize)}`,
      );
    const run = await this.ledger.open(runId);
    if (run.state === ImportRunState.Finished || run.state === ImportRunState.Reverted)
      throw ImportRunClosedError.create({ runId, state: run.state });
    const committed = await this.ledger.batches(runId);
    const cursors = new Map<string, number>();
    for (const batch of committed) cursors.set(batch.sheet, batch.lastRow);
    let index = committed.length;
    let current: Current | undefined;
    let sheet: string | undefined;
    let isHeader = false;
    let records: unknown[] = [];
    let errors: RowError[] = [];
    let lastRow = 0;
    const commit = async (): Promise<void> => {
      if (current === undefined || records.length + errors.length === 0) return;
      const changes = records.length === 0 ? [] : await current.plan.target.upsert(records);
      await this.ledger.append(runId, {
        index,
        sheet: current.plan.sheet,
        lastRow,
        changes,
        errors,
      });
      index += 1;
      records = [];
      errors = [];
    };
    try {
      for await (const row of rows) {
        if (row.sheet !== sheet) {
          await commit();
          sheet = row.sheet;
          const plan = planOf(row.sheet);
          current =
            plan === undefined
              ? undefined
              : { plan, toRecord: () => ({}), cursor: cursors.get(row.sheet) ?? 0 };
          isHeader = true;
        }
        if (current === undefined) continue;
        if (isHeader) {
          current = { ...current, toRecord: compileMapping(row.cells, current.plan.mapping) };
          isHeader = false;
          continue;
        }
        if (row.row <= current.cursor) continue;
        lastRow = row.row;
        const parsed = current.plan.target.schema.safeParse(current.toRecord(row.cells));
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
      await commit();
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
}
