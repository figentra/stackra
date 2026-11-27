/**
 * Stackra file contract:
 * Purpose: `migrationStatus(options)`, `stackra db:migrations:status` and the `db_migrations_status` tool of the local
 *          developer MCP: the member's compiled migration files (`.stackra/migrations`) against the database's
 *          `schema_migrations` version and dirty flag, with each applied file checked against the checksum
 *          `schema_migrations_history` recorded, so an edited frozen file shows before `stackra db migrate` refuses it.
 * Boundary: reads only, in a read-only transaction: unlike `DatabaseRunner.status` it takes no advisory lock and
 *           creates no bookkeeping table, so a database Encore migrated (no history ledger) is read as it is. Local
 *           dev and the testbed only (`inspectionTarget`).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the compiled stream and `schema_migrations`);
 *                     ADR 0282 (decision 5); STA-2906.
 */
import { join } from "node:path";

import { inspectionTarget } from "#node/functions/inspection-target.function";
import { openInspectionSession } from "#node/functions/open-inspection-session.function";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import type { MigrationStatus } from "#node/types/migration-status.type";

/**
 * The migration state of the member at `cwd`.
 *
 * @param options - `cwd` is the member root; `env` the environment, `process.env` by default.
 * @throws InspectionRefusedError outside local dev and the testbed.
 * @throws Error when the member has no compiled migrations (`stackra gen` writes them).
 * @example
 * const { pending, migrations } = await migrationStatus({ cwd: "services/notes" });
 */
export async function migrationStatus(options: {
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
}): Promise<MigrationStatus> {
  const files = readMigrationFiles(join(options.cwd, ".stackra", "migrations"));
  const { url, environment } = inspectionTarget(options.env);
  return openInspectionSession(url, async ({ execute }) => {
    // raw-sql: the runner's bookkeeping tables, read only when they exist
    const [tables] = await execute(
      "select to_regclass('schema_migrations') is not null as state, to_regclass('schema_migrations_history') is not null as ledger",
    );
    const [state] =
      tables?.["state"] === true
        ? await execute("select version, dirty from schema_migrations limit 1")
        : [];
    const ledger = tables?.["ledger"] === true;
    const history = ledger
      ? await execute(
          "select version, name, checksum from schema_migrations_history order by version",
        )
      : [];
    const version = Number(state?.["version"] ?? 0);
    const recorded = new Map(history.map((row) => [Number(row["version"]), row]));
    const migrations = files.map((file) => {
      const row = recorded.get(file.version);
      const checksum = row === undefined ? undefined : String(row["checksum"]);
      return {
        version: file.version,
        name: file.name,
        applied: file.version <= version,
        // a row recorded before lint lines were left out of the checksum holds the whole file's digest; both stand
        edited:
          checksum !== undefined && checksum !== file.checksum && checksum !== file.legacyChecksum,
      };
    });
    const known = new Set(files.map((file) => file.version));
    return {
      environment,
      version,
      dirty: state?.["dirty"] === true,
      ledger,
      migrations,
      pending: migrations.filter((migration) => !migration.applied).length,
      missing: history
        .filter((row) => !known.has(Number(row["version"])))
        .map((row) => ({ version: Number(row["version"]), name: String(row["name"]) })),
    };
  });
}
