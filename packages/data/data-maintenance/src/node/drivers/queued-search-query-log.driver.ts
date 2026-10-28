/**
 * Stackra file contract:
 * Purpose: `QueuedSearchQueryLogDriver`, the bound `SearchQueryLog` of a Postgres service: the
 *          `PostgresSearchQueryLogDriver` of @stackra/search (its `store`, `popular` and reports) whose `record` queues
 *          the entry as a `RecordSearchQueryAction` job, off the read path.
 * Boundary: `record` only queues; the job writes the row in the read's scope. An entry without a scope (a platform
 *           read) is not logged, since the table's rows each belong to a scope. It lives here, not in search, because
 *           it names the job, whose permission sits above @stackra/iam (ADR 0462 decision 1).
 * Runtime: node
 * Governing contract: ADR 0221; ADR 0148 (queue); ADR 0462 (decision 1); data-layer gap se12 (stackra-326).
 */
import type { Database } from "@stackra/database";
import type { QueueService } from "@stackra/queue";
import type { SearchQueryEntry } from "@stackra/search/contracts";
import { PostgresSearchQueryLogDriver } from "@stackra/search/node";

import { RecordSearchQueryAction } from "#node/actions/record-search-query.action";

/**
 * Logs search queries in Postgres through a job.
 *
 * @example
 * await queryLog.record({ model: "Product", phrase: "linen", hits: 3, latencyMs: 9, scope });
 */
export class QueuedSearchQueryLogDriver extends PostgresSearchQueryLogDriver {
  /** The queue a read's entry is handed to. */
  private readonly queue: QueueService;

  /**
   * @param database - the connected database whose running context each statement joins.
   * @param queue - the queue `record` hands each entry to.
   */
  constructor(database: Database, queue: QueueService) {
    super(database);
    this.queue = queue;
  }

  /** Queues the entry as a job in its scope; an entry without a scope is not logged. */
  async record(entry: SearchQueryEntry): Promise<void> {
    if (entry.scope === undefined) return;
    await this.queue.push(
      RecordSearchQueryAction,
      {
        model: entry.model,
        ...(entry.phrase === null ? {} : { phrase: entry.phrase }),
        ...(entry.hits === undefined ? {} : { hits: entry.hits }),
        ...(entry.latencyMs === undefined ? {} : { latencyMs: entry.latencyMs }),
        ...(entry.clicked === undefined ? {} : { clicked: entry.clicked }),
      },
      { scope: entry.scope },
    );
  }
}
