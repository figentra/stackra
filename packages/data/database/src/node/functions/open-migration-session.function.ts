/**
 * Stackra file contract:
 * Purpose: `openMigrationSession(cwd, run)`, the connection `migrate` and `rollback` share: one Postgres session holding
 *          the runner's advisory lock, with the lock and statement timeouts set, the `schema_migrations(version, dirty)`
 *          table and the `schema_migrations_history` ledger ensured, and the member's compiled files read; closed (and
 *          the lock released) when `run` ends.
 * Boundary: the only runner file that connects. The connection string is `directDatabaseUrl()` (`DATABASE_DIRECT_URL`,
 *           past the pooling proxy, else `DATABASE_URL`), never an argument (ADR 0473 decision 3). One pooled connection, so the session settings and the
 *           session-level advisory lock hold; a second runner (another pod or job) waits on the lock instead of
 *           applying the same files. `schema_migrations` keeps golang-migrate's shape (Encore's runner reads it); the
 *           checksum and `applied_at` live in the separate history table, so that shape never changes.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3 and the 2026-10-24 note: timeouts per session, `schema_migrations`); ADR
 *                     0473 (decision 3: the direct URL).
 */
import { join } from "node:path";

import { MikroORM } from "@mikro-orm/postgresql";

import { directDatabaseUrl } from "#node/functions/direct-database-url.function";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import type { MigrationSession } from "#node/types/migration-session.type";

/** The folder under the member root that gen writes the ordered SQL to. shortcut: gen's final path is STA-339. */
const MIGRATIONS_FOLDER = join(".stackra", "migrations");

/** The advisory lock key every migration runner of a database takes; fixed, so all runners contend for one lock. */
const MIGRATION_LOCK_KEY = 4_191_640_377;

/**
 * Opens a session for `run`.
 *
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set or the compiled files are missing.
 * @example
 * await openMigrationSession(".", async ({ files }) => files.length);
 */
export async function openMigrationSession<T>(
  cwd: string,
  run: (session: MigrationSession) => Promise<T>,
): Promise<T> {
  const url = directDatabaseUrl();
  const files = readMigrationFiles(join(cwd, MIGRATIONS_FOLDER));
  const orm = await MikroORM.init({
    clientUrl: url,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 1, max: 1 },
    allowGlobalContext: true,
  });
  try {
    const connection = orm.em.getConnection();
    // raw-sql: session settings and the bookkeeping table are the runner's own, outside any module schema
    await connection.execute(`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`);
    await connection.execute("set lock_timeout = '5s'");
    await connection.execute("set statement_timeout = '5min'");
    await connection.execute(
      "create table if not exists schema_migrations (version bigint not null primary key, dirty boolean not null)",
    );
    await connection.execute(
      "create table if not exists schema_migrations_history (version bigint not null primary key, name text not null, checksum text not null, applied_at timestamptz not null default now())",
    );
    return await run({
      files,
      execute: async (sql, wrap) => {
        await orm.schema.execute(sql, { wrap });
      },
      query: (sql) => connection.execute<Record<string, unknown>[]>(sql),
      state: async () => {
        const rows = await connection.execute<{ version: string; dirty: boolean }[]>(
          "select version, dirty from schema_migrations limit 1",
        );
        return { version: Number(rows[0]?.version ?? 0), dirty: rows[0]?.dirty ?? false };
      },
      history: async () => {
        const rows = await connection.execute<
          { version: string; name: string; checksum: string }[]
        >("select version, name, checksum from schema_migrations_history order by version");
        return rows.map((row) => ({
          version: Number(row.version),
          name: row.name,
          checksum: row.checksum,
        }));
      },
    });
  } finally {
    // closing the session releases the advisory lock with it
    await orm.close(true);
  }
}
