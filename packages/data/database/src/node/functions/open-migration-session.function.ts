/**
 * Stackra file contract:
 * Purpose: `openMigrationSession(cwd, run)`, the connection `migrate` and `rollback` share: one Postgres session with
 *          the lock and statement timeouts set, the `schema_migrations(version, dirty)` table ensured, and the member's
 *          compiled files read; closed when `run` ends.
 * Boundary: the only runner file that connects. The connection string is the `DATABASE_URL` the member's runway and
 *           config put in the environment, never an argument. One pooled connection, so the session settings hold.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3 and the 2026-10-24 note: timeouts per session, `schema_migrations`).
 */
import { join } from "node:path";

import { MikroORM } from "@mikro-orm/postgresql";

import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import type { MigrationSession } from "#node/types/migration-session.type";

/** The folder under the member root that gen writes the ordered SQL to. shortcut: gen's final path is STA-339. */
const MIGRATIONS_FOLDER = join(".stackra", "migrations");

/**
 * Opens a session for `run`.
 *
 * @throws Error when `DATABASE_URL` is not set or the compiled files are missing.
 * @example
 * await openMigrationSession(".", async ({ files }) => files.length);
 */
export async function openMigrationSession<T>(
  cwd: string,
  run: (session: MigrationSession) => Promise<T>,
): Promise<T> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("DATABASE_URL is not set for this member");
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
    await connection.execute("set lock_timeout = '5s'");
    await connection.execute("set statement_timeout = '5min'");
    await connection.execute(
      "create table if not exists schema_migrations (version bigint not null primary key, dirty boolean not null)",
    );
    return await run({
      files,
      execute: async (sql, wrap) => {
        await orm.schema.execute(sql, { wrap });
      },
      state: async () => {
        const rows = await connection.execute<{ version: string; dirty: boolean }[]>(
          "select version, dirty from schema_migrations limit 1",
        );
        return { version: Number(rows[0]?.version ?? 0), dirty: rows[0]?.dirty ?? false };
      },
    });
  } finally {
    await orm.close(true);
  }
}
