/**
 * Stackra file contract:
 * Purpose: `loadDatabaseInspector(cwd)`, the member's developer database inspections (`describeSchema`,
 *          `queryInScope`, `migrationStatus`) from its own `@stackra/database/node`.
 * Boundary: imports through `importMemberDatabase`, so the member's installed version runs; fails with the fix when that
 *           version predates the inspections.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); STA-2906.
 */
import { importMemberDatabase } from "#node/functions/import-member-database.function";
import type { DatabaseInspector } from "#node/types/database-inspector.type";

/**
 * Loads the inspections from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/database/node` or it exports no inspections.
 * @example
 * const { tables } = await (await loadDatabaseInspector("services/notes")).describeSchema({ env: process.env });
 */
export async function loadDatabaseInspector(cwd: string): Promise<DatabaseInspector> {
  const loaded = (await importMemberDatabase(cwd)) as Partial<DatabaseInspector>;
  if (
    typeof loaded.describeSchema !== "function" ||
    typeof loaded.queryInScope !== "function" ||
    typeof loaded.migrationStatus !== "function"
  )
    throw new TypeError(
      "@stackra/database/node exports no describeSchema, queryInScope and migrationStatus: update @stackra/database",
    );
  return {
    describeSchema: loaded.describeSchema,
    queryInScope: loaded.queryInScope,
    migrationStatus: loaded.migrationStatus,
  };
}
