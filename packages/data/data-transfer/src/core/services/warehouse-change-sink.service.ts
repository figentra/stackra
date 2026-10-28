/**
 * Stackra file contract:
 * Purpose: `WarehouseChangeSink`, the change-sink consumer that feeds the warehouse: each `sync` run reads the retained
 *          change log from its own cursor (`WarehouseChangeSink`), splits the page into `scope=/model=/dt=` batches,
 *          hands each to the bound `WarehouseSink`, and moves its cursor past the page. `replay` moves the cursor back
 *          to re-export from a moment (a backfill within the log's retention).
 * Boundary: reads the change log, never the models' tables, so it exports what each model's `CapturesChanges` keeps
 *           and nothing an encrypted or `@Classified` field holds. At least once: a failed write leaves the cursor
 *           where it was, the next run rewrites the batches it reaches, and a reader dedupes on `_position`. It is not
 *           registered with the relay (the relay would read the same cursor); the app's scheduled job calls `sync`
 *           with options from its settings.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5) and ADR 0190 (decision 3), both amended 2026-10-29 (STA-1430); ADR 0078
 *                     and ADR 0221 (2026-10-28 amendment: the retained change feed with per-consumer cursors).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { ChangeFeed } from "@stackra/outbox/contracts";

import type { WarehouseSink } from "#contracts/ports/warehouse-sink.port";
import { warehouseBatches } from "#core/functions/warehouse-batches.function";
import type { WarehouseSyncOptions } from "#core/types/warehouse-sync-options.type";
import type { WarehouseSyncReport } from "#core/types/warehouse-sync-report.type";

/** The change log cursor this sink reads with; a fixed name, so a minifier cannot move it. */
const CURSOR = "WarehouseChangeSink";

/**
 * Exports retained row changes to the warehouse.
 *
 * @example
 * const report = await sink.sync({ models: ["Order"], limit: 5000, prefix: "warehouse" });
 */
export class WarehouseChangeSink extends Service {
  /** The change log and its cursors. */
  private readonly feed: ChangeFeed;

  /** Where the batches go. */
  private readonly sink: WarehouseSink;

  /** The time a moved cursor is due at. */
  private readonly clock: Clock;

  /**
   * @param feed - the change log.
   * @param sink - the warehouse driver.
   * @param clock - the time source.
   */
  constructor(feed: ChangeFeed, sink: WarehouseSink, clock: Clock) {
    super();
    this.feed = feed;
    this.sink = sink;
    this.clock = clock;
  }

  /**
   * Exports the next page of changes of `options.models`, up to `options.limit`.
   *
   * @throws TypeError when no model is named or the limit is not a whole number of at least 1.
   * @throws the sink's error when a write fails; the cursor stays where it was.
   */
  async sync(options: WarehouseSyncOptions): Promise<WarehouseSyncReport> {
    if (options.models.length === 0)
      throw new TypeError("A warehouse sync names at least one model");
    if (!Number.isInteger(options.limit) || options.limit < 1)
      throw new TypeError(
        `A warehouse sync limit is a whole number of at least 1, got ${options.limit}`,
      );
    const cursor = await this.feed.cursor(CURSOR);
    const records = await this.feed.read(cursor?.position, options.models, options.limit);
    const last = records.at(-1);
    if (last === undefined) return { records: 0, files: [] };
    const write = {
      prefix: options.prefix,
      ...(options.rowGroupRows === undefined ? {} : { rowGroupRows: options.rowGroupRows }),
    };
    const files: string[] = [];
    for (const batch of warehouseBatches(records)) files.push(await this.sink.write(batch, write));
    await this.feed.save({
      consumer: CURSOR,
      position: last.position,
      attempts: 0,
      availableAt: this.clock.now(),
    });
    return { records: records.length, files };
  }

  /** Moves the cursor back so the next `sync` re-exports every retained change written at or after `from` (all when absent). */
  async replay(from?: Date): Promise<void> {
    const position = from === undefined ? undefined : await this.feed.positionAt(from);
    await this.feed.save({
      consumer: CURSOR,
      ...(position === undefined ? {} : { position }),
      attempts: 0,
      availableAt: this.clock.now(),
    });
  }
}
