/**
 * Stackra file contract:
 * Purpose: `loadDatabaseRunner(cwd)`, the member's database runner: its own `@stackra/database/node`, imported
 *          dynamically from the member's folder.
 * Boundary: imports through `importMemberDatabase`, so the member's installed version runs and the CLI bundles nothing
 *           of MikroORM. Fails with a message that names the fix when the member has no `@stackra/database` or its
 *           entry has no runner.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: `stackra db migrate`); ADR 0282 (decision 3).
 */
import { importMemberDatabase } from "#node/functions/import-member-database.function";
import type { DatabaseRunner } from "#node/types/database-runner.type";

/**
 * Loads the runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/database/node` or it exports no migrate and rollback.
 * @example
 * await (await loadDatabaseRunner("apps/api")).migrate({ cwd: "apps/api", environment: "staging" });
 */
export async function loadDatabaseRunner(cwd: string): Promise<DatabaseRunner> {
  const loaded = (await importMemberDatabase(cwd)) as Partial<DatabaseRunner>;
  if (typeof loaded.migrate !== "function" || typeof loaded.rollback !== "function") {
    throw new TypeError(
      "@stackra/database/node exports no migrate and rollback: update @stackra/database",
    );
  }
  return { migrate: loaded.migrate, rollback: loaded.rollback };
}
