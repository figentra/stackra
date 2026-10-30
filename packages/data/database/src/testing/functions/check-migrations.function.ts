/**
 * Stackra file contract:
 * Purpose: `checkMigrations(directory, target?)`, the migration check of a member's compiled migrations: on a fresh
 *          database with the approved extensions it applies every `.up.sql` in order, reverts from the newest while a
 *          `.down.sql` exists, and applies the reverted ones again, so a migration that does not run, a down that
 *          does not undo its up, and an up that cannot run twice after its down all fail with the file's name.
 * Boundary: the testing entry. A fresh PGlite when no target is given (the unit tier); the integration tier passes a
 *           Postgres connection. A transactional file runs inside `begin`/`commit`, as the runner runs it; no
 *           `schema_migrations` bookkeeping. The PGlite it made is closed when the check ends.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2: up and down files, the transactional header); ADR 0160 (decision 2);
 *                     ADR 0269 (decision 3); STA-1689.
 */
import { PGlite } from "@electric-sql/pglite";

import type { MigrationFile } from "#node/types/migration-file.type";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import { PGLITE_EXTENSIONS } from "#testing/constants/pglite-extensions.constant";
import type { MigrationTarget } from "#testing/types/migration-target.type";

/**
 * Applies, reverts and re-applies the compiled migrations in `directory`.
 *
 * @param directory - the folder gen wrote the `.up.sql` and `.down.sql` files to.
 * @param target - where to run them; a fresh PGlite by default.
 * @throws Error naming the file and the direction when a step fails.
 * @example
 * await checkMigrations(fileURLToPath(new URL("./migrations", import.meta.url)));
 */
export async function checkMigrations(directory: string, target?: MigrationTarget): Promise<void> {
  const files = readMigrationFiles(directory);
  const made =
    target === undefined ? await PGlite.create({ extensions: PGLITE_EXTENSIONS }) : undefined;
  const database: MigrationTarget = target ?? (made as MigrationTarget);
  const run = async (file: MigrationFile, sql: string, step: string): Promise<void> => {
    try {
      // raw-sql: compiled migrations are DDL the schema owns, run as the runner runs them
      await database.exec(file.transactional ? `begin;\n${sql}\ncommit;` : sql);
    } catch (error) {
      if (file.transactional) await database.exec("rollback;").catch(() => undefined);
      throw new Error(
        `${file.name} (${step}) failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  };
  try {
    await database.exec(
      Object.keys(PGLITE_EXTENSIONS)
        .map((name) => `create extension if not exists ${name};`)
        .join("\n"),
    );
    for (const file of files) await run(file, file.sql, "up");
    const reverted: MigrationFile[] = [];
    for (const file of [...files].reverse()) {
      if (file.inverse === undefined) break;
      await run(file, file.inverse, "down");
      reverted.unshift(file);
    }
    for (const file of reverted) await run(file, file.sql, "up after down");
  } finally {
    await made?.close();
  }
}
