/**
 * Stackra file contract:
 * Purpose: the `ImportLedger` port: the durable record of import runs and their committed batches, which gives a
 *          resumed run its cursor and a revert its before-images.
 * Boundary: an abstract class that is its own token, keyed `data-transfer.ImportLedger`. The `memory` driver ships here;
 *           the durable driver and its table belong to the OS data-exchange service (ADR 0367 decision 9). A driver
 *           returns copies, never its own state.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 to 9); ADR 0266 (memory drivers first); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ImportRunState } from "#contracts/enums/import-run-state.enum";
import type { ImportBatchEntry } from "#contracts/types/import-batch-entry.type";
import type { ImportRunRecord } from "#contracts/types/import-run-record.type";

/**
 * The ledger of import runs.
 *
 * @example
 * const run = await ledger.open("imp_01J...");
 * await ledger.append(run.id, { index: 0, lastRow: 501, changes, errors });
 */
export abstract class ImportLedger extends Port {
  /** Type-only port key, so `DriverName<ImportLedger>` narrows to this port's drivers. */
  declare readonly "~key": "data-transfer.ImportLedger";

  /** The run `runId`, created `running` with cursor `0` when the ledger has none. */
  abstract open(runId: string): Promise<ImportRunRecord>;

  /** The run `runId`, or `undefined`. */
  abstract find(runId: string): Promise<ImportRunRecord | undefined>;

  /**
   * Records a committed batch and moves the run's cursor to its `lastRow`.
   *
   * @throws RangeError when the run is unknown or `entry.index` is not the next batch number.
   */
  abstract append(runId: string, entry: ImportBatchEntry): Promise<void>;

  /** The run's committed batches, oldest first. */
  abstract batches(runId: string): Promise<readonly ImportBatchEntry[]>;

  /**
   * Sets the run's state and the time it settled.
   *
   * @throws RangeError when the run is unknown.
   */
  abstract settle(runId: string, state: ImportRunState, at: Date): Promise<void>;
}
