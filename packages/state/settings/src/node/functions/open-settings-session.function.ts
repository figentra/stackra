/**
 * Stackra file contract:
 * Purpose: `openSettingsSession(scope, run)`, the connection the `settings:diff` and `settings:apply` runner shares:
 *          the member's database connected, a scope session at the target node, and a `SettingsPackService` over the
 *          Postgres value and revision stores with the fail-closed floor guard; closed when `run` ends.
 * Boundary: the connection string is the `DATABASE_URL` the member's runway and config put in the environment, never
 *           an argument. Every read and write runs inside `withScope(scope)`, so row-level security limits it to that
 *           node and its ancestors, and one transaction holds the whole run.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4: `settings:diff` and `settings:apply`); ADR 0395 (decision 5); ADR 0327
 *                     (decisions 3 and 9).
 */
import { SystemClockDriver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { PostgresDatabaseDriver } from "@stackra/database/node";

import { SettingsPackService, SettingsResolver } from "#core/index";
import { PostgresSettingRevisionStoreDriver } from "#node/drivers/postgres-setting-revision-store.driver";
import { PostgresSettingValueStoreDriver } from "#node/drivers/postgres-setting-value-store.driver";
import { RegisteredFloorGuardDriver } from "#node/drivers/registered-floor-guard.driver";
import { StoredSettingRevisionService } from "#node/services/stored-setting-revision.service";
import { StoredSettingService } from "#node/services/stored-setting.service";

/**
 * Opens a settings session at `scope` for `run`.
 *
 * @throws Error when `DATABASE_URL` is not set or Postgres refuses the connection.
 * @example
 * await openSettingsSession(scope, (packs) => packs.exportPack({ scope }, ["orders"]));
 */
export async function openSettingsSession<T>(
  scope: ScopeRef,
  run: (packs: SettingsPackService) => Promise<T>,
): Promise<T> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("DATABASE_URL is not set for this member");
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    return await database.withScope(scope, () => {
      const store = new PostgresSettingValueStoreDriver(new StoredSettingService());
      const revisions = new PostgresSettingRevisionStoreDriver(new StoredSettingRevisionService());
      const resolver = new SettingsResolver(
        store,
        new RegisteredFloorGuardDriver(),
        revisions,
        new SystemClockDriver(),
      );
      return run(new SettingsPackService(store, resolver));
    });
  } finally {
    await database.close();
  }
}
