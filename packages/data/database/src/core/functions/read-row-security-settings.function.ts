/**
 * Stackra file contract:
 * Purpose: `readRowSecuritySettings(em)`, the `app.*` settings the row-level-security policies read (the scope, the
 *          tenant, the owner and the workspace) as the running transaction of `em` holds them, so a transaction on
 *          another connection can carry them (`replayRowSecuritySettings`).
 * Boundary: internal to `runTransaction` (`requiresNew`) and `PostgresDatabaseDriver.onReplica`. The setting names live
 *           here and nowhere else, as plain strings. Outside a transaction it reads nothing and returns none; an
 *           unset setting is left out, and one set to `''` is kept (every policy reads it as unset).
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0057 (decision 6: read replica); ADR 0136 (decision 2).
 */
import type { EntityManager } from "@mikro-orm/postgresql";

import type { RowSecuritySetting } from "#core/types/row-security-setting.type";

/**
 * The row-security settings of the running transaction of `em`.
 *
 * @example
 * const settings = await readRowSecuritySettings(this.em()); // [{ name: "app.tenant_id", setting: "scp_…" }, …]
 */
export async function readRowSecuritySettings(
  em: EntityManager,
): Promise<readonly RowSecuritySetting[]> {
  if (!em.isInTransaction()) return [];
  // raw-sql: Postgres keeps custom settings out of pg_settings, so they are read by name; an unset one is null
  return em.execute(
    "select name, setting from (select name, current_setting(name, true) as setting from unnest(array['app.scope_id', 'app.scope_path', 'app.scope_paths', 'app.tenant_id', 'app.owner_id', 'app.workspace_id']) as name) as s where setting is not null",
  );
}
