/**
 * Stackra file contract:
 * Purpose: `runInScope(database, scopes, work)`, how both `Database` drivers run `withScope`: `work` in a transaction
 *          (a savepoint inside a running one) with the `scopeSettings` of `scopes` set transaction-locally, and, inside
 *          a running transaction, the enclosing scope settings put back once `work` returns.
 * Boundary: internal to `PostgresDatabaseDriver` and `MemoryDatabaseDriver`, so the two stay the same. A released
 *           savepoint keeps a `set_config(…, true)` until the outer transaction ends, so a nested call reads the
 *           enclosing settings first and sets them back after flushing the savepoint's writes (which belong to the
 *           inner scope). When `work` throws, the savepoint's rollback restores them; a `finally` would run a statement
 *           in an aborted transaction and hide the real error. A top-level call adds no statement: the transaction's
 *           end clears the settings. An enclosing setting that was never set comes back as `''`, which every compiled
 *           policy reads as unset.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0495; `.agents/rules/tenancy.md` (two layers).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import type { ScopeRef } from "@stackra/contracts";

import { scopeSettings } from "#core/functions/scope-settings.function";
import type { Database } from "#core/ports/database.port";

/**
 * Runs `work` inside `scopes` on `database`.
 *
 * @throws TypeError for a scope path that is not an `ltree` path.
 * @example
 * return runInScope(this, scopes, work);
 */
export function runInScope<T>(
  database: Database,
  scopes: ScopeRef | readonly ScopeRef[],
  work: () => Promise<T>,
): Promise<T> {
  const settings = scopeSettings(scopes);
  const nested = database.em().isInTransaction();
  return database.transaction(async () => {
    const enclosing = nested ? await currentSettings(database.em(), settings) : undefined;
    await setSettings(database.em(), settings);
    const result = await work();
    if (enclosing === undefined) return result;
    // the ORM flushes the savepoint after this returns, and its writes belong to the inner scope
    await database.em().flush();
    // a released savepoint keeps a set_config(…, true) until the outer transaction ends, so put the outer ones back
    await setSettings(database.em(), enclosing);
    return result;
  });
}

/** The running values of the settings named in `settings`, an unset one as `''`. */
async function currentSettings(
  em: EntityManager,
  settings: readonly (readonly [string, string])[],
): Promise<readonly (readonly [string, string])[]> {
  // raw-sql: the scope settings are transaction state, which only current_setting reads
  const rows: readonly { name: string; value: string }[] = await em.execute(
    `select name, coalesce(current_setting(name, true), '') as value from unnest(array[${settings.map(() => "?").join(", ")}]::text[]) as name`,
    settings.map(([name]) => name),
  );
  return rows.map(({ name, value }) => [name, value] as const);
}

/** Sets `settings` for the rest of the running transaction. */
async function setSettings(
  em: EntityManager,
  settings: readonly (readonly [string, string])[],
): Promise<void> {
  // raw-sql: set_config is how a transaction carries the scope the row-level-security policies compare with
  await em.execute(
    `select ${settings.map(() => "set_config(?, ?, true)").join(", ")}`,
    settings.flat(),
  );
}
