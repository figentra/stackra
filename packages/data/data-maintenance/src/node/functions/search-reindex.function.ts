/**
 * Stackra file contract:
 * Purpose: `searchReindex({ model, scope, since, semantic, version })`, the half of the search runner
 *          `stackra search:reindex` calls (the other half, `searchStatus`, is @stackra/search's): it queues one reindex
 *          job (`ReindexSearchAction`, or `ReindexSemanticAction` for `semantic`) in the member's `queue.jobs`, in
 *          `scope` (platform-wide when absent), and answers the job id, or `undefined` when a reindex of that scope
 *          already waits or runs.
 * Boundary: it queues and returns; the member's workers run the job, where the `@Searchable` models are registered, so
 *           the CLI never loads a model. The connection string is `directDatabaseUrl()` of @stackra/database/node
 *           (`DATABASE_DIRECT_URL`, else `DATABASE_URL`, as the member's runway and config put them in the
 *           environment), never an argument: a CLI runs past the pooling proxy (ADR 0473). `since` is an ISO 8601
 *           instant and `version` an index version from 2 (a versioned rebuild and swap), both checked by the job's
 *           input schema when it runs.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: run as a job); ADR 0221 (decision 7: the reindex command); ADR 0148; ADR
 *                     0282 (decision 3: the CLI loads a member's runner); ADR 0473 (decision 3: the direct URL); ADR
 *                     0462 (decision 1: the jobs live in this add-on); stackra-303 (version).
 */
import { Container } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { PostgresDatabaseDriver, directDatabaseUrl } from "@stackra/database/node";
import { QueueService } from "@stackra/queue";
import { PostgresQueueDriver } from "@stackra/queue/node";

import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";

/**
 * Queues a reindex job.
 *
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set, or Postgres refuses the connection.
 * @example
 * const { job } = await searchReindex({ model: "Product", scope, since: "2026-10-27T00:00:00Z" });
 */
export async function searchReindex(options: {
  readonly model?: string;
  readonly scope?: ScopeRef;
  readonly since?: string;
  readonly semantic?: boolean;
  readonly version?: number;
}): Promise<{ readonly job: PublicId<"job"> | undefined }> {
  const url = directDatabaseUrl();
  // the container's default Clock: the system driver is not exported, so a host can replace it without being named
  const clock = (await Container.create([])).get(Clock);
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    const queue = new QueueService(new PostgresQueueDriver(database), clock);
    const input = {
      ...(options.model === undefined ? {} : { model: options.model }),
      ...(options.since === undefined ? {} : { since: options.since }),
      ...(options.version === undefined ? {} : { version: options.version }),
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
