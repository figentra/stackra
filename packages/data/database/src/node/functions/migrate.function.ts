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
 *           so the next run starts that file again. Each applied file's history row records the release the run applies
 *           (`release`, else `STACKRA_RELEASE`; a run may name none). In a forward-only environment (not dev, preview or
 *           test) the run sets `MIGRATE_FROM_VERSION_SETTING` to the version it started from and
 *           `MIGRATE_RELEASE_SETTING` to its release, which each contract step's release gate reads: a drop or finished
 *           rename is refused while the migration it waits for was applied under this same release (a retried deploy
 *           included), and on a database with older releases when the run names none.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24, decision 3: timeouts per session; destructive steps
 *                     deferred to a later release).
 */
import { MIGRATE_FROM_VERSION_SETTING } from "#core/constants/migrate-from-version-setting.constant";
import { MIGRATE_RELEASE_SETTING } from "#core/constants/migrate-release-setting.constant";
import { ROLLBACK_ENVIRONMENTS } from "#node/constants/rollback-environments.constant";
import { openMigrationSession } from "#node/functions/open-migration-session.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import type { MigrationFile } from "#node/types/migration-file.type";
import type { MigrationSession } from "#node/types/migration-session.type";

/** The session statement timeout a step's header overrides; the session opens with it. */
const SESSION_STATEMENT_TIMEOUT = "5min";

/** The variable naming the release a run applies when it is not passed: the deploy's version or commit. */
const RELEASE_VARIABLE = "STACKRA_RELEASE";

/** A release id: a version, tag or commit, such as `v1.4.0`, `2026.11.26-3` or a commit sha. */
const RELEASE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+/-]{0,127}$/;

/**
 * Applies the pending migrations.
 *
 * @param options.release - the release this run applies; `STACKRA_RELEASE` when absent.
 * @param env - the environment `STACKRA_RELEASE` is read from, `process.env` by default.
 * @throws TypeError for a release that is not a version, tag or commit; Error when an applied file was edited, the
 *         version is dirty or a file fails; the message names the file.
 * @example
 * const { applied } = await migrate({ cwd: "apps/api", environment: "production", release: "v1.4.0" });
 */
export async function migrate(
  options: {
    readonly cwd: string;
    readonly environment: string;
    readonly release?: string;
  },
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<{ readonly applied: readonly string[] }> {
  const release = (options.release ?? env[RELEASE_VARIABLE] ?? "").trim() || undefined;
  if (release !== undefined && !RELEASE_PATTERN.test(release))
    throw new TypeError(
      `the release ${JSON.stringify(release)} is not a version, tag or commit (letters, digits and . _ + / -, up to 128)`,
    );
  return openMigrationSession(options.cwd, async (session) => {
    const { files, execute, state } = session;
    const current = await state();
    const last = files.find((file) => file.version === current.version);
    if (current.dirty)
      throw new Error(
        `version ${current.version} is dirty${last ? ` (${last.name})` : ""}: fix it by hand`,
      );
    await checkHistory(session, current.version);
    // raw-sql: the release gate of a contract step reads where this run started; a rollback environment has no gate
    if (!ROLLBACK_ENVIRONMENTS.has(options.environment)) {
      await execute(
        `select set_config(${sqlLiteral(MIGRATE_FROM_VERSION_SETTING)}, ${sqlLiteral(String(current.version))}, false)`,
        false,
      );
      if (release !== undefined)
        await execute(
          `select set_config(${sqlLiteral(MIGRATE_RELEASE_SETTING)}, ${sqlLiteral(release)}, false)`,
          false,
        );
    }
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
        `update schema_migrations set dirty = false where version = ${file.version}; ${historyInsert(file, release)}`,
        true,
      );
      previous = file.version;
      applied.push(file.name);
    }
    return { applied };
  });
}

/**
 * The ledger row of an applied file under `release` (none for a file adopted from before the ledger); a re-applied
 * version (after a dev rollback) takes the new checksum and release.
 */
function historyInsert(file: MigrationFile, release?: string): string {
  return `insert into schema_migrations_history (version, name, checksum, release_id) values (${file.version}, ${sqlLiteral(file.name)}, ${sqlLiteral(file.checksum)}, ${release === undefined ? "null" : sqlLiteral(release)}) on conflict (version) do update set name = excluded.name, checksum = excluded.checksum, release_id = excluded.release_id, applied_at = now()`;
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
    // a row recorded before lint lines were left out of the checksum holds the whole file's digest; both stand
    if (row !== undefined && row.checksum !== file.checksum && row.checksum !== file.legacyChecksum)
      throw new Error(
        `${file.name} was edited after it was applied (checksum ${row.checksum.slice(0, 12)} recorded, ${file.checksum.slice(0, 12)} now): a frozen migration never changes, add a new one`,
      );
  }
  const unrecorded = appliedFiles.filter((file) => !recorded.has(file.version));
  if (unrecorded.length > 0)
    await session.execute(unrecorded.map((file) => historyInsert(file)).join("; "), true);
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
