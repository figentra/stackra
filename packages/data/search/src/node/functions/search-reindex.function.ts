/**
 * Stackra file contract:
 * Purpose: `searchReindex({ model, scope, since, semantic })`, the half of the search runner `stackra search:reindex`
 *          calls: it queues one reindex job (`ReindexSearchAction`, or `ReindexSemanticAction` for `semantic`) in the
 *          member's `queue.jobs`, in `scope` (platform-wide when absent), and answers the job id, or `undefined` when a
 *          reindex of that scope already waits or runs.
 * Boundary: it queues and returns; the member's workers run the job, where the `@Searchable` models are registered,
 *           so the CLI never loads a model. The connection string is the `DATABASE_URL` the member's runway and config
 *           put in the environment, never an argument. `since` is an ISO 8601 instant, checked by the job's input
 *           schema when it runs.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: run as a job); ADR 0221 (decision 7: the reindex command); ADR 0148;
 *                     ADR 0282 (decision 3: the CLI loads a member's runner).
 */
import { Container } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { QueueService } from "@stackra/queue";
import { PostgresQueueDriver } from "@stackra/queue/node";

import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";

/**
 * Queues a reindex job.
 *
 * @throws Error when `DATABASE_URL` is not set or Postgres refuses the connection.
 * @example
 * const { job } = await searchReindex({ model: "Product", scope, since: "2026-10-27T00:00:00Z" });
 */
export async function searchReindex(options: {
  readonly model?: string;
  readonly scope?: ScopeRef;
  readonly since?: string;
  readonly semantic?: boolean;
}): Promise<{ readonly job: PublicId<"job"> | undefined }> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("DATABASE_URL is not set for this member");
  // the container's default Clock: the system driver is not exported, so a host can replace it without being named
  const clock = (await Container.create([])).get(Clock);
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    const queue = new QueueService(new PostgresQueueDriver(database), clock);
    const input = {
      ...(options.model === undefined ? {} : { model: options.model }),
      ...(options.since === undefined ? {} : { since: options.since }),
    };
    const job = await (options.semantic === true
      ? queue.push(
          ReindexSemanticAction,
          input,
          options.scope === undefined ? {} : { scope: options.scope },
        )
      : queue.push(
          ReindexSearchAction,
          input,
          options.scope === undefined ? {} : { scope: options.scope },
        ));
    return { job };
  } finally {
    await database.close();
  }
}
