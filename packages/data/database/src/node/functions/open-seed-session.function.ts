/**
 * Stackra file contract:
 * Purpose: `openSeedSession(run)`, the connection `seedState` and `applySeed` share: one pooled Postgres connection
 *          with the statement timeouts set, a `query` that binds every value, and a `transaction` around a batch;
 *          closed when `run` ends.
 * Boundary: the only seed runner file that connects. The connection string is `directDatabaseUrl()` (`DATABASE_DIRECT_URL`,
 *           past the pooling proxy, else `DATABASE_URL`), never an argument, as for `migrate` (ADR 0473 decision 3). The seed ledger table comes from
 *           this package's migration 0003, so `stackra db migrate` runs first.
 * Runtime: node
 * Governing contract: ADR 0396 (decision 1); ADR 0159 (decision 3: session timeouts); ADR 0325 (decision 7); ADR 0473.
 */
import { MikroORM } from "@mikro-orm/postgresql";

import { directDatabaseUrl } from "#node/functions/direct-database-url.function";

/** What the callback works with. */
interface SeedSession {
  /** Runs `sql` with its bound `params` and resolves with the rows. */
  readonly query: (
    sql: string,
    params?: readonly unknown[],
  ) => Promise<readonly Record<string, unknown>[]>;

  /** Runs `work` in one transaction: all of it commits, or none. */
  readonly transaction: <T>(work: () => Promise<T>) => Promise<T>;
}

/**
 * Opens a session for `run`.
 *
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set or Postgres refuses the connection.
 * @example
 * const rows = await openSeedSession(({ query }) => query("select 1"));
 */
export async function openSeedSession<T>(run: (session: SeedSession) => Promise<T>): Promise<T> {
  const url = directDatabaseUrl();
  const orm = await MikroORM.init({
    clientUrl: url,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 1, max: 1 },
    allowGlobalContext: true,
  });
  try {
    const connection = orm.em.getConnection();
    // raw-sql: session settings are the runner's own, as for migrate
    await connection.execute("set lock_timeout = '5s'");
    await connection.execute("set statement_timeout = '5min'");
    const query = async (sql: string, params: readonly unknown[] = []) =>
      (await connection.execute(sql, [...params])) as unknown as readonly Record<string, unknown>[];
    return await run({
      query,
      transaction: async (work) => {
        // raw-sql: one pooled connection, so begin and commit frame the batch
        await connection.execute("begin");
        try {
          const result = await work();
          await connection.execute("commit");
          return result;
        } catch (error) {
          await connection.execute("rollback");
          throw error;
        }
      },
    });
  } finally {
    await orm.close(true);
  }
}
