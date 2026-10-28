/**
 * Stackra file contract:
 * Purpose: `ChangeFeedService`, the operator's hand on the change feed: `replay` moves a consumer's cursor back to an
 *          instant inside the retained window (or the log's start) so the relay delivers again from there, `resume`
 *          lets a stalled consumer try again from where it stopped, and `backfill` hands a new consumer every existing
 *          row of a model, older than the retained window, by scanning the table.
 * Boundary: a platform service over the `ChangeFeed` port and the `Database`. `replay` and `resume` only write the
 *           cursor; the relay delivers on its next tick. `backfill` reads in the caller's scope (row-level security
 *           applies; a system run opens each scope itself) by primary key in batches, and hands each batch as created
 *           changes with no fields, so a consumer re-reads the rows; it calls the consumer directly, not through the
 *           log, and moves no cursor.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: replay and backfill); ADR 0078 (decision 4:
 *                     idempotent consumers).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { RowChangeKind } from "#contracts/index";
import type { ChangeConsumer, ChangeFeed, RowChange } from "#contracts/index";

/** Rows one backfill batch reads. */
const BACKFILL_BATCH = 500;

/**
 * Replays, resumes and backfills change consumers.
 *
 * @example
 * await feeds.replay(ProductFeedService, new Date("2026-10-20T00:00:00Z"));
 */
export class ChangeFeedService extends Service {
  /** The change log and its cursors. */
  private readonly feed: ChangeFeed;

  /** The database a backfill scans. */
  private readonly database: Database;

  /** The time a moved cursor is due at. */
  private readonly clock: Clock;

  /**
   * @param feed - the change log.
   * @param database - the connected database.
   * @param clock - the time source.
   */
  constructor(feed: ChangeFeed, database: Database, clock: Clock) {
    super();
    this.feed = feed;
    this.database = database;
    this.clock = clock;
  }

  /** Moves `consumer`'s cursor to read every change from `from` on (the log's start when absent), clearing any stall. */
  async replay(consumer: AnyClass<ChangeConsumer>, from?: Date): Promise<void> {
    const position = from === undefined ? undefined : await this.feed.positionAt(from);
    await this.feed.save({
      consumer: consumer.name,
      ...(position === undefined ? {} : { position }),
      attempts: 0,
      availableAt: this.clock.now(),
    });
  }

  /** Lets a stalled `consumer` try again from its cursor; a consumer with no cursor is left alone. */
  async resume(consumer: AnyClass<ChangeConsumer>): Promise<void> {
    const cursor = await this.feed.cursor(consumer.name);
    if (cursor === undefined) return;
    await this.feed.save({
      consumer: cursor.consumer,
      ...(cursor.position === undefined ? {} : { position: cursor.position }),
      attempts: 0,
      availableAt: this.clock.now(),
    });
  }

  /**
   * Hands `consumer` every row of `model` the caller's scope reads, as created changes, `batch` rows at a time.
   *
   * @returns how many rows it handed over.
   */
  async backfill(
    consumer: ChangeConsumer,
    model: AnyClass,
    options: { readonly batch?: number } = {},
  ): Promise<number> {
    const batch = options.batch ?? BACKFILL_BATCH;
    if (!Number.isInteger(batch) || batch < 1)
      throw new TypeError(`backfill takes a whole batch size of at least 1, got ${batch}`);
    const em = this.database.em();
    const [key = "id"] = em.getMetadata(model).primaryKeys;
    let after: string | undefined;
    let total = 0;
    for (;;) {
      const rows = (await em.find(model, after === undefined ? {} : { [key]: { $gt: after } }, {
        fields: [key],
        orderBy: { [key]: "asc" },
        limit: batch,
      } as never)) as Record<string, unknown>[];
      if (rows.length === 0) return total;
      const changes: RowChange[] = rows.map((row) => ({
        model: model.name,
        id: String(row[key]),
        kind: RowChangeKind.Created,
        fields: [],
      }));
      if (consumer.consumeMany !== undefined) await consumer.consumeMany(changes);
      else for (const change of changes) await consumer.consume(change);
      total += rows.length;
      after = changes.at(-1)?.id;
      if (rows.length < batch) return total;
    }
  }
}
