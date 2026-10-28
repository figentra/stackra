/**
 * Stackra file contract:
 * Purpose: `migrate({ cwd, environment })`, `stackra db migrate`: applies the member's pending compiled files in
 *          sequence order under the runner's advisory lock, marking the version dirty while a file runs and clean when
 *          it ends, and recording each applied file's checksum and `applied_at` in `schema_migrations_history`.
 * Boundary: refuses to run when an applied file's checksum no longer matches its history row (a frozen file was
 *           edited), and stops on a dirty version (a run that crashed mid-file), naming the file; the runner never
 *           retries. A file applied before the history table existed is adopted (its checksum recorded) on the first
 *           run. A transactional file runs in one transaction, a non-transactional one as written (one statement); a
 *           file's `-- stackra:timeout=` header sets its own statement timeout. When a file fails, the INVALID
 *           indexes it left (a failed `create index concurrently`) are dropped and the version goes back to the last
 *           applied file, clean: the failed transaction rolled back and a failed single statement left nothing else,
 *           so the next run starts that file again.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24, decision 3: timeouts per session).
 */
import { openMigrationSession } from "#node/functions/open-migration-session.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import type { MigrationFile } from "#node/types/migration-file.type";
import type { MigrationSession } from "#node/types/migration-session.type";

/** The session statement timeout a step's header overrides; the session opens with it. */
const SESSION_STATEMENT_TIMEOUT = "5min";

/**
 * Applies the pending migrations.
 *
 * @throws Error when an applied file was edited, the version is dirty or a file fails; the message names the file.
 * @example
 * const { applied } = await migrate({ cwd: "apps/api", environment: "dev" });
 */
export function migrate(options: {
  readonly cwd: string;
  readonly environment: string;
}): Promise<{ readonly applied: readonly string[] }> {
  return openMigrationSession(options.cwd, async (session) => {
    const { files, execute, state } = session;
    const current = await state();
    const last = files.find((file) => file.version === current.version);
    if (current.dirty)
      throw new Error(
        `version ${current.version} is dirty${last ? ` (${last.name})` : ""}: fix it by hand`,
      );
    await checkHistory(session, current.version);
    const applied: string[] = [];
    let previous = current.version;
    for (const file of files.filter((candidate) => candidate.version > current.version)) {
      // raw-sql: the version row is the runner's bookkeeping
      await execute(
        `insert into schema_migrations (version, dirty) values (${file.version}, true) on conflict (version) do nothing; delete from schema_migrations where version < ${file.version}`,
        true,
      );
      try {
        if (file.timeout !== undefined)
          await execute(`set statement_timeout = ${sqlLiteral(file.timeout)}`, false);
        await execute(file.sql, file.transactional);
      } catch (error) {
        const dropped = file.transactional ? [] : await dropInvalidIndexes(session, file);
        await execute(
          previous === 0
            ? "delete from schema_migrations"
            : `update schema_migrations set version = ${previous}, dirty = false`,
          true,
        );
        throw new Error(
          `${file.name} failed${dropped.length > 0 ? ` (dropped invalid ${dropped.join(", ")})` : ""}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      } finally {
        if (file.timeout !== undefined)
          await execute(`set statement_timeout = '${SESSION_STATEMENT_TIMEOUT}'`, false);
      }
      await execute(
        `update schema_migrations set dirty = false where version = ${file.version}; ${historyInsert(file)}`,
        true,
      );
      previous = file.version;
      applied.push(file.name);
    }
    return { applied };
  });
}

/** The ledger row of an applied file; a re-applied version (after a dev rollback) takes the new checksum. */
function historyInsert(file: MigrationFile): string {
  return `insert into schema_migrations_history (version, name, checksum) values (${file.version}, ${sqlLiteral(file.name)}, ${sqlLiteral(file.checksum)}) on conflict (version) do update set name = excluded.name, checksum = excluded.checksum, applied_at = now()`;
}

/**
 * Refuses an applied file whose text changed, then adopts the applied files the ledger does not hold yet.
 *
 * @throws Error naming the first edited file.
 */
async function checkHistory(session: MigrationSession, version: number): Promise<void> {
  const recorded = new Map((await session.history()).map((row) => [row.version, row]));
  const appliedFiles = session.files.filter((file) => file.version <= version);
  for (const file of appliedFiles) {
    const row = recorded.get(file.version);
    if (row !== undefined && row.checksum !== file.checksum)
      throw new Error(
        `${file.name} was edited after it was applied (checksum ${row.checksum.slice(0, 12)} recorded, ${file.checksum.slice(0, 12)} now): a frozen migration never changes, add a new one`,
      );
  }
  const unrecorded = appliedFiles.filter((file) => !recorded.has(file.version));
  if (unrecorded.length > 0) await session.execute(unrecorded.map(historyInsert).join("; "), true);
}

/** Drops the INVALID indexes a failed concurrent build of `file` left, and returns their names. */
async function dropInvalidIndexes(
  session: MigrationSession,
  file: MigrationFile,
): Promise<string[]> {
  // raw-sql: a catalog read of the indexes a failed `create index concurrently` left INVALID
  const rows = await session.query(
    "select n.nspname as schema, c.relname as name from pg_index i join pg_class c on c.oid = i.indexrelid join pg_namespace n on n.oid = c.relnamespace where not i.indisvalid",
  );
  const dropped: string[] = [];
  for (const row of rows) {
    const name = String(row["name"]);
    if (!file.sql.includes(name)) continue;
    await session.execute(
      `drop index concurrently if exists "${String(row["schema"])}"."${name}"`,
      false,
    );
    dropped.push(name);
  }
  return dropped;
}
