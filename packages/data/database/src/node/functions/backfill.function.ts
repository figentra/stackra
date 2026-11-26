/**
 * Stackra file contract:
 * Purpose: `backfill(type, options)`, the node entry of a backfill run: opens one session on the direct database URL
 *          with the migration runner's lock and statement timeouts, runs `runBackfill` on it, and closes it. The queue
 *          job that owns a backfill calls it with `maxBatches` and queues itself again until it is `finished`.
 * Boundary: the connection string is `directDatabaseUrl()` (`DATABASE_DIRECT_URL`, past the pooling proxy, else
 *           `DATABASE_URL`), never an argument (ADR 0473 decision 3). One pooled connection, as the migration runner
 *           uses, so the timeouts hold for every batch. It reads and writes every tenant's rows of the table, so the
 *           URL's role bypasses row security (a superuser or `BYPASSRLS`, as the migrating role); the runtime role,
 *           which never does, fails on the first batch (SQLSTATE 42501: `runBackfill` runs with `row_security` off)
 *           instead of finding no rows.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs; timeouts per session); ADR 0473 (decision 3).
 */
import { MikroORM } from "@mikro-orm/postgresql";

import { runBackfill } from "#core/functions/run-backfill.function";
import type { BackfillClass } from "#core/types/backfill-class.type";
import type { BackfillProgress } from "#core/types/backfill-progress.type";
import type { RunBackfillOptions } from "#core/types/run-backfill-options.type";
import { directDatabaseUrl } from "#node/functions/direct-database-url.function";

/**
 * Runs `type` against the service's database.
 *
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set; any error `runBackfill` throws.
 * @example
 * const { finished } = await backfill(FillOrderTotalsBackfill, { maxBatches: 100 });
 */
export async function backfill(
  type: BackfillClass,
  options: RunBackfillOptions = {},
): Promise<BackfillProgress> {
  const orm = await MikroORM.init({
    clientUrl: directDatabaseUrl(),
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 1, max: 1 },
    allowGlobalContext: true,
  });
  try {
    const em = orm.em.fork();
    // raw-sql: the runner's session settings, as the migration session sets them
    await em.execute("set lock_timeout = '5s'");
    await em.execute("set statement_timeout = '5min'");
    return await runBackfill(
      type,
      {
        query: (sql) => em.execute(sql),
        transaction: (run) => em.transactional((tx) => run((sql) => tx.execute(sql))),
      },
      options,
    );
  } finally {
    await orm.close(true);
  }
}
