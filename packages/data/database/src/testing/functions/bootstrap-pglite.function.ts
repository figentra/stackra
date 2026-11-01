/**
 * Stackra file contract:
 * Purpose: `bootstrapPglite`, which creates the approved extensions and applies a member's compiled migrations on a
 *          PGlite, each file as the runner would run it (a transactional file in one transaction).
 * Boundary: runs on the PGlite it is given and keeps nothing; no `schema_migrations` bookkeeping.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 2); ADR 0159; ADR 0269 (decision 3).
 */
import type { PGlite } from "@electric-sql/pglite";

import type { MigrationFile } from "#node/types/migration-file.type";
import { extensionsSql } from "#testing/functions/extensions-sql.function";

/**
 * Creates the extensions and applies `files` on `pglite`.
 *
 * @throws Error naming the migration file that failed.
 */
export async function bootstrapPglite(
  pglite: PGlite,
  files: readonly MigrationFile[],
): Promise<void> {
  // raw-sql: extensions and compiled migrations are DDL the schema owns, not queries a model makes
  await pglite.exec(extensionsSql());
  for (const file of files)
    try {
      if (file.transactional) await pglite.transaction((tx) => tx.exec(file.sql));
      else await pglite.exec(file.sql);
    } catch (error) {
      throw new Error(
        `${file.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
}
