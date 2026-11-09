/**
 * Stackra file contract:
 * Purpose: `replayRowSecuritySettings(settings, execute)`, the row-security settings `readRowSecuritySettings` read
 *          from one transaction, set transaction-locally (`set_config(…, true)`, as `withScope` writes them) in another.
 * Boundary: internal to `runTransaction` (`requiresNew`) and `PostgresDatabaseDriver.onReplica`; `execute` runs the
 *           one statement in the target transaction, so either a primary or a replica connection can take it. No
 *           settings, no statement.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0057 (decision 6: read replica); ADR 0136 (decision 2).
 */
import type { RowSecuritySetting } from "#core/types/row-security-setting.type";

/**
 * Sets `settings` for the rest of the transaction `execute` runs in.
 *
 * @example
 * await replayRowSecuritySettings(settings, (sql, params) => trx.execute(sql, params));
 */
export async function replayRowSecuritySettings(
  settings: readonly RowSecuritySetting[],
  execute: (sql: string, params: string[]) => Promise<unknown>,
): Promise<void> {
  if (settings.length === 0) return;
  // raw-sql: the same set_config withScope writes, so the policies see the caller's scope and tenant
  await execute(
    `select ${settings.map(() => "set_config(?, ?, true)").join(", ")}`,
    settings.flatMap(({ name, setting }) => [name, setting]),
  );
}
